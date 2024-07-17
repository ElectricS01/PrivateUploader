import { Arg, Ctx, Int, Mutation, Query, Resolver } from "type-graphql"
import { Container, Service } from "typedi"
import { Authorization } from "@app/lib/graphql/AuthChecker"
import { AccessLevel } from "@app/enums/admin/AccessLevel"
import { Success } from "@app/classes/graphql/generic/success"
import { Context } from "@app/types/graphql/context"
import { Chat } from "@app/models/chat.model"
import { ChatRank } from "@app/models/chatRank.model"
import { ChatAssociation } from "@app/models/chatAssociation.model"
import { ChatPermissionsHandler } from "@app/services/chat/permissions"
import { User } from "@app/models/user.model"
import { UserUtilsService } from "@app/services/userUtils.service"
import { ClearCacheInput } from "@app/classes/graphql/admin/cache"
import { AdminService } from "@app/services/admin.service"
import { EXPECTED_OPTIONS_KEY } from "dataloader-sequelize"
import { PulseService } from "@app/services/pulse.service"
import { Plan } from "@app/models/plan.model"
import { ExperimentOverride } from "@app/classes/graphql/core/experiments"
import { Experiment } from "@app/models/experiment.model"
import { GqlError } from "@app/lib/gqlErrors"

@Resolver()
@Service()
export class AdminResolver {
  constructor(
    private userUtilsService: UserUtilsService,
    private adminService: AdminService
  ) {}

  @Authorization({
    accessLevel: AccessLevel.ADMIN,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminMigrateLegacyRanksForChat(@Ctx() ctx: Context): Promise<Success> {
    const chats = await Chat.findAll({
      include: [
        {
          model: ChatRank,
          as: "ranks",
          required: false,
          where: {
            managed: true
          }
        },
        {
          model: ChatAssociation,
          as: "users",
          required: false
        }
      ]
    })
    const applicable = chats.filter((chat) => !chat.ranks.length)
    for (const chat of applicable) {
      const service = new ChatPermissionsHandler()
      await service.createDefaults(chat)
      console.log(chat.id)
    }
    return { success: true }
  }

  @Authorization({
    accessLevel: AccessLevel.ADMIN,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminSendEmailForUnverifiedUsers(
    @Ctx() ctx: Context
  ): Promise<Success> {
    const users = await User.findAll({
      where: {
        emailVerified: false
      }
    })
    for (const user of users) {
      console.log(`sending for ${user.username}`)
      this.userUtilsService.sendVerificationEmail(user.id, true, false)
      await new Promise((resolve) => setTimeout(resolve, 60000))
    }
    return { success: true }
  }

  @Authorization({
    accessLevel: AccessLevel.ADMIN,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminClearCache(
    @Ctx() ctx: Context,
    @Arg("input") input: ClearCacheInput
  ) {
    if (input.userId) {
      if (input.await) {
        await this.adminService.purgeUserCache(input.userId)
      } else {
        this.adminService.purgeUserCache(input.userId)
      }
      return { success: true }
    } else {
      if (input.await) {
        await this.adminService.purgeCache(input.type)
      } else {
        this.adminService.purgeCache(input.type)
      }
      return { success: true }
    }
  }

  @Authorization({
    accessLevel: AccessLevel.ADMIN,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminDebugBatch(@Ctx() ctx: Context) {
    console.log(User.findByPk)
    // get sequelize-typescript instance for dataloader-sequelize
    const [user1, user2] = await Promise.all([
      User.findByPk(1, {
        [EXPECTED_OPTIONS_KEY]: ctx.dataloader
      }),
      User.findByPk(6, {
        [EXPECTED_OPTIONS_KEY]: ctx.dataloader
      })
    ])

    await User.findByPk(1, {
      [EXPECTED_OPTIONS_KEY]: ctx.dataloader
    })
    await User.findByPk(1, {
      [EXPECTED_OPTIONS_KEY]: ctx.dataloader
    })

    console.log(user1?.username, user2?.username)
    return { success: true }
  }

  @Authorization({
    accessLevel: AccessLevel.ADMIN,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminGenerateInsights(
    @Ctx() ctx: Context,
    @Arg("userId") userId: number,
    @Arg("type") type: string,
    @Arg("customGte", { nullable: true }) customGte?: string
  ) {
    const pulseService = Container.get(PulseService)
    pulseService.generateInsights(userId, <any>type, customGte)
    return { success: true }
  }

  @Authorization({
    accessLevel: AccessLevel.MODERATOR,
    scopes: "*"
  })
  @Query(() => [Plan])
  async adminPlans(@Ctx() ctx: Context) {
    return await Plan.findAll()
  }

  @Authorization({
    accessLevel: AccessLevel.MODERATOR,
    scopes: "*"
  })
  @Query(() => [ExperimentOverride])
  async adminGetExperimentOverrides(
    @Ctx() ctx: Context,
    @Arg("userId", () => Int, {
      nullable: true,
      description: "If null or 0, will get the system global overrides"
    })
    userId?: number
  ) {
    if (userId) {
      const overrides = await Experiment.findAll({
        where: {
          userId
        }
      })
      return overrides.map((o) => {
        return {
          id: o.key,
          value: o.value === "true" ? 1 : o.value === "false" ? 0 : o.value,
          force: false,
          userId: 0
        }
      })
    }
    return (await redis.json.get("experimentOverridesGlobal")) || []
  }

  @Authorization({
    accessLevel: AccessLevel.MODERATOR,
    scopes: "*"
  })
  @Mutation(() => ExperimentOverride)
  async adminSetExperimentOverride(
    @Ctx() ctx: Context,
    @Arg("input", () => ExperimentOverride) override: ExperimentOverride
  ) {
    try {
      if (override.userId) {
        const user = await User.findByPk(override.userId)
        if (!user) throw new GqlError("USER_NOT_FOUND")
        if (user.administrator && ctx.role !== AccessLevel.ADMIN)
          throw new GqlError("NOT_ADMIN")
        const existing = await Experiment.findOne({
          where: {
            key: override.id,
            userId: override.userId
          }
        })
        if (existing) {
          await existing.update({
            value: override.value
          })
          return {
            id: existing.id,
            value: existing.value,
            force: false,
            userId: -1
          }
        } else {
          const created = await Experiment.create({
            key: override.id,
            value: override.value,
            userId: override.userId
          })
          return {
            id: created.key,
            value: created.value,
            force: false,
            userId: -1
          }
        }
      }
      if (ctx.role !== AccessLevel.ADMIN) throw new GqlError("NOT_ADMIN")
      const overrides =
        (await redis.json.get("experimentOverridesGlobal")) || []
      const existing = overrides.find(
        (o: ExperimentOverride) => o.id === override.id
      )
      if (existing) {
        overrides.splice(overrides.indexOf(existing), 1)
      }
      overrides.push({
        ...override,
        userId: ctx.user!!.id
      })
      await redis.json.set("experimentOverridesGlobal", "$", overrides)
      return {
        ...override,
        userId: ctx.user!!.id
      }
    } catch (e) {
      console.error(e)
      return e
    }
  }

  @Authorization({
    accessLevel: AccessLevel.MODERATOR,
    scopes: "*"
  })
  @Mutation(() => Success)
  async adminDeleteExperimentOverride(
    @Ctx() ctx: Context,
    @Arg("id") id: string
  ) {
    const overrides = (await redis.json.get("experimentOverridesGlobal")) || []
    const existing = overrides.find((o: ExperimentOverride) => o.id === id)
    if (existing) {
      overrides.splice(overrides.indexOf(existing), 1)
    }
    await redis.json.set("experimentOverridesGlobal", "$", overrides)
    return { success: true }
  }
}
