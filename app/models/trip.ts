import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import User from '#models/user'
import Vehicle from '#models/vehicle'
import Booking from '#models/booking'
import Review from '#models/review'

export type TripStatus = 'DRAFT' | 'PUBLISHED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
export type Coordinates = {
  latitude: number
  longitude: number
}

export default class Trip extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare driverId: number

  @column()
  declare vehicleId: number

  @column()
  declare departureCoordinates: Coordinates

  @column()
  declare departureCity: string

  @column()
  declare arrivalCity: string

  @column()
  declare arrivalCoordinates: Coordinates

  @column.dateTime()
  declare departureDate: DateTime

  @column()
  declare departureTime: string

  @column()
  declare estimatedDuration: number

  @column()
  declare distanceKm: number

  @column()
  declare pricePerSeat: number

  @column()
  declare availableSeats: number

  @column()
  declare totalSeats: number

  @column()
  declare status: TripStatus

  @column()
  declare comments: string | null

  @column()
  declare petsAllowed: boolean

  @column()
  declare luggageAllowed: boolean

  @column()
  declare possibleStops: {
    stop_1: string
    stop_2: string
  } | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'driverId',
  })
  declare driver: BelongsTo<typeof User>

  @belongsTo(() => Vehicle, {
    foreignKey: 'vehicleId',
  })
  declare vehicle: BelongsTo<typeof Vehicle>

  @hasMany(() => Booking, {
    foreignKey: 'tripId',
  })
  declare bookings: HasMany<typeof Booking>

  @hasMany(() => Review, {
    foreignKey: 'tripId',
  })
  declare reviews: HasMany<typeof Review>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (trip) => {
      if (!trip.uuid) {
        trip.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public get routeDescription(): string {
    return `${this.departureCity} → ${this.arrivalCity}`
  }

  public canBeBooked(): boolean {
    return this.status === 'PUBLISHED' && this.availableSeats > 0
  }

  public isFull(): boolean {
    return this.availableSeats === 0
  }

  public async updateAvailableSeats(): Promise<void> {
    const bookings = await Booking.query().where('tripId', this.id).whereIn('status', ['CONFIRMED', 'PAID'])
    const bookedSeats = bookings.reduce((sum, booking) => sum + booking.numberOfSeats, 0)

    this.availableSeats = this.totalSeats - bookedSeats

    if (this.availableSeats === 0 && this.status === 'PUBLISHED') {
      this.status = 'FULL'
    }

    await this.save()
  }
}
