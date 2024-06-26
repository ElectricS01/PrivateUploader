import { BelongsTo, Column, DataType, Model, Table } from "sequelize-typescript"
import { User } from "@app/models/user.model"

@Table({
  tableName: "Feedback"
})
export class Feedback extends Model {
  @Column
  route: string

  @Column({
    type: DataType.TEXT
  })
  debugInfo: string

  @Column
  uploadId: number

  @Column({
    type: DataType.TEXT
  })
  feedbackText: string

  @Column
  starRating: number

  @Column
  userId: number

  @BelongsTo(() => User, "userId")
  user: User
}
