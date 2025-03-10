import { BelongsTo, Column, DataType, Model, Table } from "sequelize-typescript"
import { User } from "@app/models/user.model"
import { Field, Int, ObjectType } from "type-graphql"
import { PartialUserBase } from "@app/classes/graphql/user/partialUser"
import { DateType } from "@app/classes/graphql/serializers/date"

@ObjectType()
@Table
export class FriendNickname extends Model {
  @Field(() => Int)
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataType.INTEGER
  })
  id: number

  @Field()
  @Column
  userId: number

  @Field(() => DateType)
  @Column
  createdAt: Date

  @Field(() => DateType)
  @Column
  updatedAt: Date

  @Field()
  @Column
  friendId: number

  @Field()
  @Column
  nickname: string

  @Field(() => PartialUserBase, {
    nullable: true
  })
  @BelongsTo(() => User, "userId")
  user: User

  @Field(() => PartialUserBase, {
    nullable: true
  })
  @BelongsTo(() => User, "friendId")
  friend: User
}
