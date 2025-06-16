import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import User from '#models/user'
import Trip from '#models/trip'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare senderId: number

  @column()
  declare receiverId: number

  @column()
  declare tripId: number | null

  @column()
  declare content: string

  @column.dateTime()
  declare sendDate: DateTime

  @column()
  declare isRead: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'senderId',
  })
  declare sender: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'receiverId',
  })
  declare receiver: BelongsTo<typeof User>

  @belongsTo(() => Trip, {
    foreignKey: 'tripId',
  })
  declare trip: BelongsTo<typeof Trip>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (message) => {
      if (!message.uuid) {
        message.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public async markAsRead(): Promise<void> {
    if (!this.isRead) {
      this.isRead = true
      await this.save()
    }
  }

  public static async getConversation(
    user1Id: string,
    user2Id: string,
    tripId?: string
  ): Promise<Message[]> {
    const query = Message.query()
      .where((builder) => {
        builder.where('senderId', user1Id).andWhere('receiverId', user2Id)
      })
      .orWhere((builder) => {
        builder.where('senderId', user2Id).andWhere('receiverId', user1Id)
      })

    if (tripId) {
      query.andWhere('tripId', tripId)
    }

    return query.preload('sender').preload('receiver').orderBy('sendDate', 'asc')
  }

  public static async getUnreadCount(userId: string): Promise<number> {
    const result = await Message.query()
      .where('receiverId', userId)
      .andWhere('isRead', false)
      .count('* as count')

    return Number(result[0].$extras.count())
  }

  public static async markConversationAsRead(senderId: string, receiverId: string): Promise<void> {
    await Message.query()
      .where('senderId', senderId)
      .andWhere('receiverId', receiverId)
      .andWhere('isRead', false)
      .update({ isRead: true })
  }
}
