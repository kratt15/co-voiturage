import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasOne, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasOne, HasMany } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import Trip from '#models/trip'
import User from '#models/user'
import Payment from '#models/payment'
import Review from '#models/review'

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'

export default class Booking extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare tripId: number

  @column()
  declare passengerId: number

  @column.dateTime()
  declare bookingDate: DateTime

  @column()
  declare numberOfSeats: number

  @column()
  declare totalAmount: number

  @column()
  declare status: BookingStatus

  @column()
  declare passengerComment: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Trip, {
    foreignKey: 'tripId',
  })
  declare trip: BelongsTo<typeof Trip>

  @belongsTo(() => User, {
    foreignKey: 'passengerId',
  })
  declare passenger: BelongsTo<typeof User>

  @hasOne(() => Payment, {
    foreignKey: 'bookingId',
  })
  declare payment: HasOne<typeof Payment>

  @hasMany(() => Review, {
    foreignKey: 'bookingId',
  })
  declare reviews: HasMany<typeof Review>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (booking) => {
      if (!booking.uuid) {
        booking.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public canBeCancelled(): boolean {
    return ['PENDING', 'CONFIRMED'].includes(this.status)
  }

  public canBePaid(): boolean {
    return this.status === 'CONFIRMED'
  }

  public isActive(): boolean {
    return ['CONFIRMED', 'PAID'].includes(this.status)
  }

  public async cancel(): Promise<void> {
    if (this.canBeCancelled()) {
      this.status = 'CANCELLED'
      await this.save()

      // Mettre à jour les places disponibles du trajet
      const trip = await Trip.findOrFail(this.tripId)
      trip.availableSeats += this.numberOfSeats
      await trip.save()
    }
  }

  public async markAsPaid(): Promise<void> {
    if (this.status === 'CONFIRMED') {
      this.status = 'PAID'
      await this.save()
    }
  }

  public async complete(): Promise<void> {
    if (this.status === 'PAID') {
      this.status = 'COMPLETED'
      await this.save()
    }
  }
}
