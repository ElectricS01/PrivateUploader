import { Message } from "@app/models/message.model"
import { Field, InputType, Int, ObjectType } from "type-graphql"
import { Chat } from "@app/models/chat.model"

@ObjectType()
@InputType("MessageSubscriptionInput")
export class MessageSubscription {
  @Field(() => Message)
  message: Message

  @Field(() => Int)
  associationId: number

  @Field()
  mention: boolean

  @Field(() => Chat)
  chat: Chat
}
