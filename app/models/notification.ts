import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import User from '#models/user'

export type NotificationType = 'BOOKING' | 'PAYMENT' | 'CANCELLATION' | 'REMINDER' | 'MESSAGE'

export interface NotificationMetadata {
  tripId?: string
  bookingId?: string
  paymentId?: string
  messageId?: string
  [key: string]: any
}

export default class Notification extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare userId: number

  @column()
  declare title: string

  @column()
  declare message: string

  @column.dateTime()
  declare creationDate: DateTime

  @column()
  declare isRead: boolean

  @column()
  declare type: NotificationType

  @column({
    prepare: (value: NotificationMetadata) => JSON.stringify(value),
    consume: (value: string) => (value ? JSON.parse(value) : null),
  })
  declare metadata: NotificationMetadata | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (notification) => {
      if (!notification.uuid) {
        notification.uuid = uuidv4()
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

  public static async getUnreadCount(userId: string): Promise<number> {
    const result = await this.query()
      .where('userId', userId)
      .andWhere('isRead', false)
      .count('* as total')

    return Number(result[0].$extras.count())
  }
}
