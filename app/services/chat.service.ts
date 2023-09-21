import { Container, Service } from "typedi"
import { Chat } from "@app/models/chat.model"
import { ChatAssociation } from "@app/models/chatAssociation.model"
import { User } from "@app/models/user.model"
import { LegacyUser } from "@app/models/legacyUser.model"
import { Message } from "@app/models/message.model"
import Errors from "@app/lib/errors"
import { UserUtilsService } from "@app/services/userUtils.service"
import embedParser from "@app/lib/embedParser"
import { Includeable, Op } from "sequelize"
import paginate from "jw-paginate"
import axios from "axios"
import { ClientSatisfies } from "@app/lib/clientSatisfies"
import { partialUserBase } from "@app/classes/graphql/user/partialUser"
import { SocketNamespaces } from "@app/classes/graphql/SocketEvents"
import { MessageSubscription } from "@app/classes/graphql/chat/messageSubscription"
import { ChatPermissionsHandler } from "@app/services/chat/permissions"
import { ChatPermissions } from "@app/classes/graphql/chat/ranks/permissions"
import { ChatRank } from "@app/models/chatRank.model"
import { ChatPermission } from "@app/models/chatPermission.model"
import { ChatRankAssociation } from "@app/models/chatRankAssociation.model"
import { GraphQLError } from "graphql/error"

class MessageIncludes {
  constructor(showNameColor = true) {
    return [
      {
        model: Message,
        as: "reply"
      },
      {
        model: ChatAssociation,
        as: "readReceipts",
        attributes: ["userId", "lastRead"]
      }
    ]
  }
}

@Service()
export class ChatService {
  private userIncludes = [
    {
      model: User,
      as: "tpuUser",
      attributes: partialUserBase
    },
    {
      model: LegacyUser,
      as: "legacyUser",
      attributes: partialUserBase
    }
  ]
  private chatIncludes: Includeable[] = [
    {
      model: ChatAssociation,
      as: "users",
      include: [
        {
          model: User,
          as: "tpuUser",
          attributes: partialUserBase
        },
        {
          model: LegacyUser,
          as: "legacyUser",
          attributes: partialUserBase
        }
      ],
      attributes: [
        "id",
        "userId",
        "rank",
        "legacyUserId",
        "user",
        "lastRead",
        "createdAt",
        "updatedAt"
      ],
      order: [
        ["rank", "DESC"],
        ["createdAt", "ASC"]
      ]
    }
  ]

  async normalizeIndexes(chatId: number, emit: boolean = true) {
    try {
      const normalized = []

      const ranks = await ChatRank.findAll({
        where: {
          chatId
        },
        order: [
          ["managed", "DESC"],
          ["index", "ASC"]
        ]
      })

      for (let i = 0; i < ranks.length; i++) {
        const rank = ranks[i]

        const normalizedIndex = Math.max(i, 0)

        await rank.update({ index: normalizedIndex })

        normalized.push({
          id: rank.id,
          index: normalizedIndex
        })
      }
      if (emit) {
        const chat = await Chat.findOne({
          where: { id: chatId },
          include: [
            {
              model: ChatAssociation,
              as: "users",
              attributes: [
                "id",
                "userId",
                "rank",
                "legacyUserId",
                "user",
                "lastRead",
                "createdAt",
                "updatedAt"
              ]
            }
          ]
        })
        if (!chat) return false
        for (const user of chat.users) {
          if (!user.userId) continue
          socket
            .of(SocketNamespaces.CHAT)
            .to(user.userId)
            .emit("rankOrderUpdated", {
              chatId,
              ranks: normalized
            })
        }
      }
      return true
    } catch (error) {
      console.error("Error normalizing indexes:", error)
      throw error
    }
  }

  async syncPermissions(userId: number, associationId: number) {
    const permissions = await this.getPermissions(userId, associationId)
    socket.of(SocketNamespaces.CHAT).to(userId).emit("syncPermissions", {
      associationId,
      permissions,
      userId
    })
  }

  async getHighestIndex(chatAssociationId: number) {
    const rank = await ChatRankAssociation.findOne({
      where: {
        chatAssociationId
      },
      include: [
        {
          model: ChatRank,
          as: "rank"
        }
      ],
      order: [[{ model: ChatRank, as: "rank" }, "index", "DESC"]]
    })
    return rank?.rank?.index || 0
  }

  async getPermissions(
    userId: number,
    associationId: number
  ): Promise<ChatPermissions[]> {
    const association = await ChatAssociation.findOne({
      where: { id: associationId, userId },
      include: [
        {
          model: Chat,
          attributes: ["userId", "type"],
          as: "chat"
        },
        {
          model: ChatRank,
          as: "ranks",
          include: [
            {
              model: ChatPermission,
              as: "permissions"
            }
          ]
        }
      ]
    })
    if (!association) return []
    const permissions = [
      ...new Set(
        association.ranks.flatMap((rank) =>
          rank.permissions.map((permission) => permission.id)
        )
      )
    ]
    console.log(
      association.chat.userId === userId && association.chat.type === "group"
    )
    if (association.chat.userId === userId && association.chat.type === "group")
      permissions.push(ChatPermissions.OWNER)
    return permissions as ChatPermissions[]
  }

  async checkPermissions(
    userId: number,
    associationId: number,
    permission: ChatPermissions,
    noThrow: boolean = false
  ): Promise<ChatPermissions[]> {
    const permissions = await this.getPermissions(userId, associationId)

    let hasPermission: boolean
    if (
      permission === ChatPermissions.OWNER ||
      permission === ChatPermissions.TRUSTED
    ) {
      hasPermission = permissions.includes(permission)
    } else {
      hasPermission =
        permissions.includes(permission) ||
        permissions.includes(ChatPermissions.ADMIN) ||
        permissions.includes(ChatPermissions.OWNER)
    }
    if (!noThrow && !hasPermission)
      throw new GraphQLError(
        "You do not have permission to perform this action on the group."
      )
    return permissions
  }

  async emitToFCMs(message: Message, chat: Chat, userId: number) {
    if (!config.providers.google) return
    for (const user of chat.users) {
      const key = await redis.get(`user:${user.userId}:notificationKey`)
      if (!key) continue
      await axios
        .post(
          `https://fcm.googleapis.com/fcm/send`,
          {
            to: key,
            data: {
              content: message.content,
              id: message.id,
              associationId: user.id,
              userId: message.userId,
              username: message.user?.username,
              avatar: message.user?.avatar,
              chatName: chat.name,
              createdAt: message.createdAt
            }
          },
          {
            headers: {
              Authorization: `key=${config.providers.google.access_token}`,
              "Content-Type": "application/json"
            }
          }
        )
        .catch((e) => console.log(e?.response?.data))
    }
  }

  async updateAssociationSettings(
    associationId: number,
    userId: number,
    settings: {
      notifications: typeof ChatAssociation.prototype.notifications
    }
  ) {
    const association = await ChatAssociation.findOne({
      where: {
        id: associationId,
        userId
      }
    })
    if (!association) throw Errors.USER_NOT_FOUND
    await association.update({
      notifications: settings.notifications
    })
    socket
      .of(SocketNamespaces.CHAT)
      .to(userId)
      .emit("chatUpdate", {
        id: association.chatId,
        association: {
          ...association.toJSON(),
          notifications: settings.notifications
        }
      })
    return association
  }

  async leaveGroupChat(associationId: number, userId: number) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    const user = await ChatAssociation.findOne({
      where: {
        chatId: chat.id,
        userId,
        id: associationId
      }
    })
    if (!user) throw Errors.USER_NOT_FOUND
    await this.sendMessage(
      `<@${userId}> left the chat`,
      userId,
      associationId,
      undefined,
      "leave",
      []
    )
    await ChatAssociation.destroy({
      where: {
        chatId: chat.id,
        userId
      }
    })
    if (user.rank === "owner") {
      const associations = await ChatAssociation.findAll({
        where: {
          chatId: chat.id,
          rank: "owner"
        }
      })
      if (associations.length === 1) {
        const association = await ChatAssociation.findOne({
          where: {
            chatId: chat.id,
            [Op.not]: [
              {
                userId
              }
            ]
          }
        })
        if (!association) {
          await Message.destroy({
            where: {
              chatId: chat.id
            }
          })
          await Chat.destroy({
            where: {
              id: chat.id
            }
          })
          await ChatAssociation.destroy({
            where: {
              chatId: chat.id
            }
          })
          return true
        }
        if (chat.type === "group") {
          await ChatAssociation.update(
            {
              rank: "owner"
            },
            {
              where: {
                id: association.id
              }
            }
          )
          this.emitForAll(associationId, userId, "chatUserUpdate", {
            id: association.id,
            rank: "owner",
            chatId: chat.id
          })
        }
      }
    }
    this.emitForAll(associationId, userId, "removeChatUser", {
      id: user.id,
      chatId: chat.id
    })
    socket.of(SocketNamespaces.CHAT).to(userId).emit("removeChat", {
      id: chat.id
    })
    return true
  }

  async searchChat(
    chatId: number,
    query: string,
    page: number = 1,
    clientSatisfies: ClientSatisfies
  ) {
    if (!page) page = 1
    const chat = await Chat.findOne({
      where: {
        id: chatId
      }
    })
    if (!chat) throw Errors.CHAT_NOT_FOUND
    const where = {
      chatId: chat.id,
      [Op.or]: [
        {
          content: {
            [Op.like]: `%${query}%`
          }
        },
        {
          embeds: {
            [Op.like]: `%${query}%`
          }
        }
      ]
    }
    const messages = await Message.findAll({
      order: [["createdAt", "DESC"]],
      where,
      include: new MessageIncludes(clientSatisfies.nameColor),
      limit: 20,
      offset: (page - 1) * 20
    })
    const count = await Message.count({
      where
    })
    const pager = paginate(count, page, 20)
    return {
      messages,
      pager
    }
  }

  async updateUserRank(
    updatingUserId: number,
    associationId: number,
    rank: "owner" | "admin" | "member",
    userId: number
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    const user = await ChatAssociation.findOne({
      where: {
        chatId: chat.id,
        userId: updatingUserId
      }
    })
    if (!user) throw Errors.USER_NOT_FOUND
    if (user.rank === "owner") throw Errors.PERMISSION_DENIED_RANK
    if (user.rank === chat.association?.rank)
      throw Errors.PERMISSION_DENIED_RANK
    await ChatAssociation.update(
      {
        rank
      },
      {
        where: {
          chatId: chat.id,
          userId: updatingUserId
        }
      }
    )
    this.emitForAll(associationId, userId, "chatUserUpdate", {
      id: user.id,
      rank: rank,
      chatId: chat.id
    })
    return user
  }

  async deleteMessage(
    messageId: number,
    userId: number,
    associationId: number
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    const message = await Message.findOne({
      where: {
        id: messageId,
        userId,
        chatId: chat.id
      }
    })
    if (!message) {
      await this.checkPermissions(
        userId,
        associationId,
        ChatPermissions.DELETE_MESSAGES
      )
      const message = await Message.findOne({
        where: {
          id: messageId,
          chatId: chat.id
        }
      })
      if (!message || message.type !== "message") throw Errors.MESSAGE_NOT_FOUND
      await message.destroy()
      this.emitForAll(associationId, userId, "messageDelete", {
        id: message.id,
        chatId: chat.id
      })
      return message
    } else {
      if (message.type !== "message") throw Errors.MESSAGE_NOT_FOUND
      await message.destroy()
      this.emitForAll(associationId, userId, "messageDelete", {
        id: message.id,
        chatId: chat.id
      })
      return message
    }
  }

  async updateGroupSettings(
    associationId: number,
    userId: number,
    settings: {
      name?: string | null
      icon?: string | null
    }
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    await this.checkPermissions(userId, associationId, ChatPermissions.OVERVIEW)
    await Chat.update(
      {
        name: settings.name === "" ? null : settings.name,
        icon: settings.icon
      },
      {
        where: {
          id: chat.id
        }
      }
    )
    if (settings.name !== chat.name) {
      this.sendMessage(
        `<@${userId}> updated the chat name to ${settings.name}.`,
        userId,
        associationId,
        undefined,
        "rename",
        []
      )
    }
    if (settings.icon !== undefined) {
      this.sendMessage(
        `<@${userId}> updated the chat icon.`,
        userId,
        associationId,
        undefined,
        "system",
        []
      )
    }
    this.emitForAll(associationId, userId, "chatUpdate", {
      name: settings.name,
      id: chat.id,
      icon: settings.icon
    })
    return chat
  }

  /*
   async patchCacheForAll(chatId: number, removeUserId?: number) {
    const cache = Container.get(CacheService)
    const chat = await Chat.findOne({
      where: {
        id: chatId
      },
      include: [
        {
          model: ChatAssociation,
          as: "users",
          include: this.userIncludes
        }
      ]
    })
    if (!chat) throw Errors.CHAT_NOT_FOUND
    if (removeUserId) {
      await cache.generateChatsCache(removeUserId)
    }
    for (const user of chat.users) {
      if (!user.userId) continue
      await cache.patchChatsCacheForUser(user.userId, {
        ...chat.toJSON(),
        association: user.toJSON()
      } as ChatCache)
    }
  }*/

  async removeUserFromChat(
    associationId: number,
    removeUserId: number[],
    userId: number,
    isLeaving: boolean = false
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    let removable = []
    const associations = await ChatAssociation.findAll({
      where: {
        chatId: chat.id,
        userId: removeUserId
      }
    })
    if (!isLeaving) {
      const myIndex = await this.getHighestIndex(associationId)
      for (const association of associations) {
        if (association.userId === chat.userId) continue
        const theirIndex = await this.getHighestIndex(associationId)
        if (theirIndex > myIndex && chat.userId !== userId) continue
        removable.push(association)
      }
    } else {
      removable.push(...associations)
    }
    if (!associations.length) throw Errors.CHAT_USER_NOT_FOUND
    await ChatAssociation.destroy({
      where: {
        chatId: chat.id,
        id: removable.map((assoc) => assoc.id)
      }
    })
    for (const association of removable) {
      if (!isLeaving) {
        this.sendMessage(
          `<@${userId}> removed <@${association.userId}> from the chat.`,
          userId,
          associationId,
          undefined,
          "leave"
        )
      } else {
        this.sendMessage(
          `<@${userId} left the chat.`,
          userId,
          associationId,
          undefined,
          "leave"
        )
      }
      let unread: Record<string, string> = await redis.json.get(
        `unread:${association.userId}`
      )
      delete unread[chat.id.toString()]
      await redis.json.set(`unread:${association.userId}`, "$", unread)
      this.emitForAll(associationId, userId, "removeChatUser", {
        chatId: chat.id,
        id: association.id
      })
      socket.of(SocketNamespaces.CHAT).to(removeUserId).emit("removeChat", {
        id: chat.id
      })
    }
    for (const association of chat.users) {
      Container.get(UserUtilsService).trackedUserIds(association.userId, true)
    }
    return true
  }

  async addUsersToChat(
    associationId: number,
    userIds: number[],
    userId: number
  ) {
    let chat = await this.getChatFromAssociation(associationId, userId)
    const existingAssociations = await ChatAssociation.findAll({
      where: {
        chatId: chat.id,
        userId: userIds
      }
    })
    if (existingAssociations.length > 0) {
      throw Errors.USER_ALREADY_IN_CHAT
    }
    const friends = await Container.get(UserUtilsService).validateFriends(
      userId,
      userIds
    )
    let newAssociations = []
    const rank = await ChatRank.findOne({
      where: {
        chatId: chat.id,
        managed: true
      }
    })
    if (!rank) throw Errors.COLUBRINA_CHAT
    for (const friend of friends) {
      const association = await ChatAssociation.create({
        chatId: chat.id,
        userId: friend.friendId,
        rank: "member",
        identifier: chat.id + "-" + friend.friendId
      })
      await ChatRankAssociation.create({
        rankId: rank.id,
        chatAssociationId: association.id
      })
      newAssociations.push(association.id)
      this.sendMessage(
        `<@${userId}> added <@${friend.friendId}> to the chat.`,
        userId,
        associationId,
        undefined,
        "join"
      )
    }
    const associations = await ChatAssociation.findAll({
      where: {
        chatId: chat.id
      },
      include: this.userIncludes
    })
    for (const association of associations) {
      Container.get(UserUtilsService).trackedUserIds(association.userId, true)
    }
    const newUsers = await ChatAssociation.findAll({
      where: {
        id: newAssociations
      },
      include: [
        ...this.userIncludes,
        {
          model: ChatRank,
          as: "ranks"
        }
      ]
    })
    for (const user of newUsers) {
      user.dataValues.ranksMap = user.ranks.map((rank) => rank.id)
    }
    this.emitForAll(associationId, userId, "addChatUsers", {
      chatId: chat.id,
      users: newUsers
    })
    for (const association of newUsers) {
      socket
        .of(SocketNamespaces.CHAT)
        .to(association.userId)
        .emit("chatCreated", await this.getChat(chat.id, association.userId))
    }
    return associations
  }

  async typing(associationId: number, userId: number) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    await this.emitForAll(
      associationId,
      userId,
      "typing",
      {
        chatId: chat.id,
        userId,
        user: await Container.get(UserUtilsService).getUserById(userId),
        expires: Date.now() + 5000
      },
      true
    )
    return true
  }

  async editMessage(
    messageId: number,
    userId: number,
    content: string,
    associationId: number,
    pinned?: boolean
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    if (!chat) throw Errors.CHAT_NOT_FOUND
    const message = await Message.findOne({
      where: {
        id: messageId,
        chatId: chat.id
      }
    })
    if (!message || message.type !== "message") throw Errors.MESSAGE_NOT_FOUND
    if (pinned !== undefined) {
      await this.checkPermissions(
        userId,
        associationId,
        ChatPermissions.PIN_MESSAGES
      )
      await Message.update(
        {
          pinned: !message.pinned
        },
        {
          where: {
            id: messageId
          }
        }
      )
      this.sendMessage(
        `<@${userId}> ${message.pinned ? "unpinned" : "pinned"} a message.`,
        userId,
        associationId,
        messageId,
        "pin",
        []
      )
      this.emitForAll(associationId, userId, "edit", {
        chatId: chat.id,
        id: messageId,
        user: await Container.get(UserUtilsService).getUserById(userId),
        pinned: !message.pinned,
        content: message.content,
        edited: message.edited,
        editedAt: message.editedAt
      })
      return true
    }
    if (message.userId !== userId) throw Errors.MESSAGE_NOT_FOUND
    if (!content?.trim()?.length) throw Errors.NO_MESSAGE_CONTENT
    const date = new Date()
    await Message.update(
      {
        content,
        edited: true,
        editedAt: date
      },
      {
        where: {
          id: messageId,
          userId
        }
      }
    )
    this.emitForAll(associationId, userId, "edit", {
      chatId: message.chatId,
      id: messageId,
      content,
      edited: true,
      editedAt: date,
      user: await Container.get(UserUtilsService).getUserById(userId),
      pinned: message.pinned
    })
    return true
  }

  async emitForAll(
    associationId: number,
    userId: number,
    key: string,
    data: any,
    excludeCreator = false
  ) {
    let chat = await this.getChatFromAssociation(associationId, userId)
    if (excludeCreator) {
      chat.users = chat.users.filter(
        (u: ChatAssociation) => u.userId !== userId
      )
    }
    for (const user of chat.users) {
      if (!user.userId) continue
      socket.of(SocketNamespaces.CHAT).to(user.userId).emit(key, data)
    }
  }

  async readChat(associationId: number, userId: number) {
    try {
      const chat = await this.getChatFromAssociation(associationId, userId)
      const chatId = chat.id
      const notifications = await redis.json.get(
        `unread:${userId}`,
        `$.${chatId}`
      )
      if (notifications) {
        await redis.json.set(`unread:${userId}`, "$", {
          ...notifications,
          [chatId]: 0
        })
      } else {
        await redis.json.set(`unread:${userId}`, "$", {
          [chatId]: 0
        })
      }
      socket.of(SocketNamespaces.CHAT).to(userId).emit("readChat", {
        id: chatId
      })
      const message = await Message.findOne({
        where: {
          chatId
        },
        order: [["id", "DESC"]]
      })
      if (message) {
        const association = await ChatAssociation.findOne({
          where: {
            chatId,
            userId
          }
        })
        const user = await User.findOne({
          where: {
            id: userId
          },
          attributes: ["id", "status", "storedStatus"]
        })
        if (
          !association ||
          association.lastRead === message.id ||
          user?.storedStatus === "invisible"
        )
          return
        await association.update(
          { lastRead: message.id },
          {
            where: {
              chatId,
              userId
            }
          }
        )
        this.emitForAll(association.id, userId, "readReceipt", {
          chatId,
          id: message.id,
          userId,
          lastRead: message.id
        })
      }
    } catch (e) {
      console.log(e)
    }
  }

  async getChat(chatId: number, userId: number) {
    const chat = await Chat.findOne({
      where: { id: chatId },
      include: [
        {
          model: ChatAssociation,
          where: { userId },
          required: true,
          as: "association"
        },
        {
          model: ChatRank,
          as: "ranks",
          order: [["index", "DESC"]]
        },
        {
          model: ChatAssociation,
          as: "users",
          include: [
            {
              model: ChatRank,
              as: "ranks",
              order: [["index", "DESC"]],
              include: [
                {
                  model: ChatPermission,
                  as: "permissions"
                }
              ]
            },
            {
              model: User,
              as: "tpuUser",
              attributes: partialUserBase
            },
            {
              model: LegacyUser,
              as: "legacyUser",
              attributes: partialUserBase
            }
          ],
          attributes: [
            "id",
            "userId",
            "rank",
            "legacyUserId",
            "user",
            "lastRead",
            "createdAt",
            "updatedAt"
          ],
          order: [
            ["rank", "DESC"],
            ["createdAt", "ASC"]
          ]
        }
      ]
    })
    if (!chat) throw Errors.CHAT_NOT_FOUND
    const recipient = await this.getRecipient(chat, userId)

    return {
      ...chat.toJSON(),
      users: chat.users.map((user) => {
        return {
          ...user.toJSON(),
          ranksMap: user.ranks.map((rank) => rank.id),
          permissions: [
            ...new Set(
              user.ranks.flatMap((rank) =>
                rank.permissions.map((permission) => permission.id)
              )
            )
          ]
        }
      }),
      ranks: chat.ranks
        .map((rank) => {
          return {
            ...rank.toJSON(),
            permissionsMap:
              rank?.permissions?.map((permission) => permission.id) || []
          }
        })
        .sort((a, b) => {
          return b.index - a.index || 0
        }),
      unread: 0,
      recipient: recipient
    }
  }

  async createChat(users: number[], userId: number) {
    const chatPermissionsHandler = new ChatPermissionsHandler()
    if (!users.length || users.includes(userId))
      throw Errors.INVALID_FRIEND_SELECTION

    const friends = await Container.get(UserUtilsService).validateFriends(
      userId,
      users
    )
    const type = friends.length === 1 ? "direct" : "group"
    const intent = [userId, ...users].sort((a, b) => a - b).join("-")
    if (type === "direct") {
      const chat = await Chat.findOne({
        where: {
          type: "direct",
          intent
        },
        include: this.chatIncludes
      })

      if (chat?.users.find((u: ChatAssociation) => u.userId === userId)) {
        return await this.getChat(chat.id, userId)
      } else if (chat) {
        const association = await ChatAssociation.create({
          userId,
          chatId: chat.id,
          rank: "member",
          identifier: chat.id + "-" + userId
        })
        let association2
        if (!chat.users.length) {
          association2 = await ChatAssociation.create({
            userId: users[0],
            chatId: chat.id,
            rank: "member",
            identifier: chat.id + "-" + users[0]
          })
        }
        const chatWithUsers = await this.getChat(chat.id, association.userId)
        socket
          .of(SocketNamespaces.CHAT)
          .to(association.userId)
          .emit("chatCreated", chatWithUsers)
        Container.get(UserUtilsService).trackedUserIds(association.userId, true)
        if (association2) {
          socket
            .of(SocketNamespaces.CHAT)
            .to(association2.userId)
            .emit("chatCreated", chatWithUsers)
          Container.get(UserUtilsService).trackedUserIds(
            association2.userId,
            true
          )
        }
        return chatWithUsers
      }
    }

    const chat = await Chat.create({
      name: type === "group" ? "Unnamed Group" : "Direct Message",
      type,
      userId,
      intent: type === "direct" ? intent : null
    })
    redis.set(`chat:${chat.id}:sortDate`, dayjs().valueOf())
    let associations = []

    associations.push(
      await ChatAssociation.create({
        userId,
        chatId: chat.id,
        rank: type === "direct" ? "member" : "owner",
        identifier: chat.id + "-" + userId
      })
    )

    for (const user of users) {
      associations.push(
        await ChatAssociation.create({
          userId: user,
          chatId: chat.id,
          rank: "member",
          identifier: chat.id + "-" + user
        })
      )
    }
    const chatWithUsers = await this.getChat(chat.id, userId)
    await chatPermissionsHandler.createDefaults(chatWithUsers)
    for (const association of associations) {
      const chatWithUsers = await this.getChat(chat.id, association.userId)
      if (!chatWithUsers) continue
      socket
        .of(SocketNamespaces.CHAT)
        .to(association.userId)
        .emit("chatCreated", chatWithUsers)
      Container.get(UserUtilsService).trackedUserIds(association.userId, true)
    }
    return chatWithUsers
  }

  async sendMessageToUsers(messageId: number, chat: Chat) {
    const message = await Message.findOne({
      where: { id: messageId },
      include: new MessageIncludes(false)
    })

    if (!message) throw Errors.UNKNOWN
    this.emitToFCMs(message, chat, message.userId)
    for (const association of chat.users) {
      if (association?.tpuUser) {
        const assoc = await ChatAssociation.findOne({
          where: {
            id: association.id,
            userId: association.tpuUser.id
          },
          attributes: ["id", "notifications"]
        })
        if (!assoc) continue
        const mention = message.content.includes(`<@${association.tpuUser.id}>`)
        socket
          .of(SocketNamespaces.CHAT)
          .to(association.tpuUser.id)
          .emit("message", {
            message: {
              ...message.toJSON(),
              type: message.type.toUpperCase()
            },
            chat: {
              name: chat.name,
              id: chat.id,
              type: chat.type,
              recipient: await this.getRecipient(chat, association.user.id)
            },
            associationId: association.id,
            mention
          } as MessageSubscription)

        if (
          association.tpuUser.id === message.userId ||
          assoc.notifications === "none" ||
          (assoc.notifications === "mentions" && !mention)
        )
          continue

        let notifications = await redis.json.get(
          `unread:${association.tpuUser.id}`
        )
        if (notifications) {
          notifications[chat.id] += 1 || 1
        } else {
          notifications = {
            [chat.id]: 1
          }
        }
        redis.json.set(`unread:${association.tpuUser.id}`, "$", notifications)
      }
    }

    return message
  }

  async sendMessage(
    content: string,
    userId: number,
    associationId: number,
    replyId?: number | null,
    type:
      | "message"
      | "leave"
      | "join"
      | "pin"
      | "administrator"
      | "rename"
      | "system" = "message",
    attachments?: string[]
  ) {
    const chat = await this.getChatFromAssociation(associationId, userId)
    if (replyId !== undefined && replyId !== null) {
      const message = await Message.findOne({
        where: {
          id: replyId,
          chatId: chat.id
        }
      })
      if (!message) throw Errors.REPLY_MESSAGE_NOT_FOUND
    }
    // must contain at least one character excluding spaces and newlines and must not contain just #s (one or more)
    if (!attachments?.length) {
      content = content?.trim()
      if (
        !content.replace(/\s/g, "").length ||
        !content.replace(/#/g, "").length
      )
        throw Errors.NO_MESSAGE_CONTENT
    }
    if (content.length >= 4000) throw Errors.MESSAGE_TOO_LONG
    const message = await Message.create({
      content,
      chatId: chat.id,
      userId,
      type,
      replyId
    })

    redis.set(`chat:${chat.id}:sortDate`, dayjs(message.createdAt).valueOf())
    embedParser(message, message.chatId, userId, associationId, attachments)
    return await this.sendMessageToUsers(message.id, chat)
  }

  async getRecipient(chat: Chat, userId: number) {
    if (chat.type !== "direct") return null
    const recipient = chat.users.find(
      (a: ChatAssociation) => a.userId !== userId
    )
    if (recipient) {
      return {
        ...recipient.user.toJSON(),
        legacyUser: !!recipient.legacyUser
      }
    } else {
      const intent = chat.intent
        ?.split("-")
        .map((i: string) => parseInt(i))
        .filter((i: number) => i !== userId)
      if (intent?.length) {
        const user = await User.findOne({
          where: { id: intent[0] },
          attributes: [
            "id",
            "username",
            "avatar",
            "createdAt",
            "description",
            "administrator",
            "moderator"
          ]
        })
        if (!user) return null
        return {
          ...user.toJSON(),
          legacyUser: false
        }
      } else {
        return null
      }
    }
  }

  async getChatFromAssociation(
    associationId: number,
    userId: number,
    gql: boolean = true
  ) {
    const chat = await Chat.findOne({
      include: [
        {
          model: ChatAssociation,
          where: {
            id: associationId,
            userId
          },
          required: true,
          as: "association"
        },
        {
          model: ChatAssociation,
          as: "users",
          attributes: [
            "id",
            "userId",
            "user",
            "rank",
            "legacyUserId",
            "lastRead",
            "createdAt",
            "updatedAt"
          ],
          include: [
            {
              model: User,
              as: "tpuUser",
              attributes: partialUserBase
            },
            {
              model: LegacyUser,
              as: "legacyUser",
              attributes: partialUserBase
            }
          ]
        }
      ]
    })
    if (!chat && gql)
      throw new GraphQLError("The chat could not be found.", {
        extensions: {
          code: "CHAT_NOT_FOUND"
        }
      })
    if (!chat) throw Errors.CHAT_NOT_FOUND
    return chat
  }

  async getMessages(
    chatId: number,
    userId: number,
    position: "top" | "bottom" = "top",
    clientSatisfies: ClientSatisfies,
    offset?: number
  ) {
    const chat = await this.getChatFromAssociation(chatId, userId)
    let where = offset
      ? position === "top"
        ? { id: { [Op.lt]: offset } }
        : { id: { [Op.gt]: offset } }
      : {}
    let messages = await Message.findAll({
      where: {
        chatId: chat.id,
        ...where
      },
      order: [["id", position === "top" ? "DESC" : "ASC"]],
      limit: 50,
      include: new MessageIncludes(clientSatisfies.nameColor)
    })
    if (position === "bottom") messages.reverse()
    return messages
  }

  async getMessagesPagination(
    chatId: number,
    userId: number,
    position: "top" | "bottom" = "top",
    type: "pins" | "messages" = "messages",
    page: number = 1,
    clientSatisfies: ClientSatisfies
  ) {
    const chat = await this.getChatFromAssociation(chatId, userId)
    let messages = await Message.findAll({
      where: {
        chatId: chat.id,
        ...(type === "pins" ? { pinned: true } : {})
      },
      order: [["createdAt", position === "top" ? "DESC" : "ASC"]],
      limit: 50,
      include: new MessageIncludes(clientSatisfies.nameColor)
    })
    if (position === "bottom") messages.reverse()
    const count = await Message.count({
      where: {
        chatId: chat.id,
        ...(type === "pins" ? { pinned: true } : {})
      }
    })
    const pager = paginate(count, page, 50)
    return {
      messages,
      pager
    }
  }

  async getSortedUserChats(
    userId: number,
    internal = false,
    clientSatisfies: ClientSatisfies
  ) {
    let chats = await this.getUserChats(userId, clientSatisfies)
    if (internal) return chats
    const start = new Date().getTime()
    for (const chat of chats) {
      chat.dataValues._redisSortDate =
        (await redis.get(`chat:${chat.id}:sortDate`)) || "0"
      chat.dataValues.recipient = await this.getRecipient(chat, userId)
    }

    const sorted = chats.sort((a: Chat, b: Chat) => {
      const aDate = parseInt(a.dataValues._redisSortDate)
      const bDate = parseInt(b.dataValues._redisSortDate)
      return bDate - aDate
    })
    const notifications = await redis.json.get(`unread:${userId}`)
    if (notifications) {
      for (const chat of sorted) {
        chat.dataValues.unread = notifications[chat.id] || 0
      }
    } else {
      for (const chat of sorted) {
        chat.dataValues.unread = 0
      }
    }
    const end = new Date().getTime()
    console.log("sorting took", end - start)
    return sorted
  }

  async getUserChats(userId: number, clientSatisfies: ClientSatisfies) {
    const chats = await Chat.findAll({
      include: [
        {
          model: ChatAssociation,
          where: { userId },
          required: true,
          as: "association"
        },
        {
          model: ChatAssociation,
          as: "users",
          attributes: [
            "id",
            "userId",
            "user",
            "rank",
            "legacyUserId",
            "lastRead",
            "createdAt",
            "updatedAt"
          ],
          include: [
            {
              model: User,
              as: "tpuUser",
              attributes: [
                "id",
                "username",
                "avatar",
                "createdAt",
                "updatedAt",
                ...(clientSatisfies.nameColor ? ["nameColor"] : [])
              ]
            },
            {
              model: LegacyUser,
              as: "legacyUser",
              attributes: partialUserBase
            }
          ]
        }
      ]
    })
    return chats
    /* return chats.map((chat: Chat) => {
      const recipient =
        chat.type === "direct"
          ? chat.users
              .find((a: ChatAssociation) => a.userId !== userId)
              ?.toJSON()
          : null
      return {
        ...chat.toJSON(),
        recipient: recipient
          ? {
              ...(recipient.user || recipient.legacyUser),
              legacyUser: !!recipient.legacyUser
            }
          : null,
        users: chat.users.map((association: ChatAssociation) => {
          return {
            ...(association.user?.toJSON() || association.legacyUser?.toJSON()),
            legacyUser: !!association.legacyUser,
            association: association.toJSON()
          }
        })
      }
    })*/
  }
}
