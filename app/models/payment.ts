import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import Booking from '#models/booking'

export type PaymentStatus = 'PENDING' | 'CONFIRMED' | 'FAILED' | 'REFUNDED'

export default class Payment extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare bookingId: number

  @column()
  declare amount: number

  @column.dateTime()
  declare paymentDate: DateTime

  @column()
  declare paymentMethod: string

  @column()
  declare status: PaymentStatus

  @column()
  declare serviceFee: number

  @column()
  declare transactionId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Booking, {
    foreignKey: 'bookingId',
  })
  declare booking: BelongsTo<typeof Booking>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (payment) => {
      if (!payment.uuid) {
        payment.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public get totalAmount(): number {
    return this.amount + this.serviceFee
  }

  public canBeRefunded(): boolean {
    return this.status === 'CONFIRMED'
  }

  public async confirm(transactionId: string): Promise<void> {
    this.status = 'CONFIRMED'
    this.transactionId = transactionId
    await this.save()

    // Marquer la réservation comme payée
    const booking = await Booking.findOrFail(this.bookingId)
    booking.markAsPaid()
  }

  public async fail(): Promise<void> {
    this.status = 'FAILED'
    await this.save()
  }

  public async refund(): Promise<void> {
    if (this.canBeRefunded()) {
      this.status = 'REFUNDED'
      await this.save()
    }
  }
}
