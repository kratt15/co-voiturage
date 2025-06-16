import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
import User from '#models/user'
import Trip from '#models/trip'

export default class Vehicle extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare driverId: number

  @column()
  declare brand: string

  @column()
  declare model: string

  @column()
  declare color: string

  @column()
  declare licensePlate: string

  @column()
  declare year: number

  @column()
  declare numberOfSeats: number

  @column()
  declare fuelType: string

  @column()
  declare hasAirConditioning: boolean

  @column()
  declare isVerified: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'driverId',
  })
  declare driver: BelongsTo<typeof User>

  @hasMany(() => Trip, {
    foreignKey: 'vehicleId',
  })
  declare trips: HasMany<typeof Trip>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (vehicle) => {
      if (!vehicle.uuid) {
        vehicle.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public get fullName(): string {
    return `${this.brand} ${this.model} (${this.year})`
  }

  public canBeUsedForTrip(): boolean {
    return this.isVerified && this.numberOfSeats > 1
  }
}
