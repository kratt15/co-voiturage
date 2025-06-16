import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import User from '#models/user'
import Trip from '#models/trip'
import Booking from '#models/booking'

export type ReviewType = 'DRIVER_TO_PASSENGER' | 'PASSENGER_TO_DRIVER'

export default class Review extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare authorId: number

  @column()
  declare recipientId: number

  @column()
  declare tripId: number

  @column()
  declare bookingId: number | null

  @column()
  declare rating: number

  @column()
  declare comment: string | null

  @column.dateTime()
  declare reviewDate: DateTime

  @column()
  declare type: ReviewType

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'authorId',
  })
  declare author: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'recipientId',
  })
  declare recipient: BelongsTo<typeof User>

  @belongsTo(() => Trip, {
    foreignKey: 'tripId',
  })
  declare trip: BelongsTo<typeof Trip>

  @belongsTo(() => Booking, {
    foreignKey: 'bookingId',
  })
  declare booking: BelongsTo<typeof Booking>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (review) => {
      if (!review.uuid) {
        review.uuid = uuidv4()
      }
    })

    this.after('create', async (review) => {
      // Mettre à jour la note globale du destinataire
      await review.updateRecipientGlobalRating()
    })
  }

  // Méthodes métier
  public isValid(): boolean {
    return this.rating >= 1 && this.rating <= 5
  }

  public async updateRecipientGlobalRating(): Promise<void> {
    const recipient = await User.findOrFail(this.recipientId)

    // Calculer la nouvelle note globale
    const reviews = await Review.query()
      .where('recipientId', this.recipientId)
      .where('rating', '>', 0)

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const newGlobalRating = totalRating / reviews.length

      recipient.globalRating = Math.round(newGlobalRating * 100) / 100 // Arrondi à 2 décimales
      await recipient.save()
    }
  }

  public static async canUserReviewTrip(
    authorId: string,
    recipientId: string,
    tripId: string,
    type: ReviewType
  ): Promise<boolean> {
    const existingReview = await Review.query()
      .where('authorId', authorId)
      .where('recipientId', recipientId)
      .where('tripId', tripId)
      .where('type', type)
      .first()

    return !existingReview
  }
}
