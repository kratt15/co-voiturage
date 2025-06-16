import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import { v4 as uuidv4 } from 'uuid'
//
import Vehicle from '#models/vehicle'
import Trip from '#models/trip'
import Booking from '#models/booking'
import Review from '#models/review'
import Notification from '#models/notification'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare uuid: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare phone: string

  @column.date()
  declare birthDate: DateTime

  @column()
  declare photo: string | null

  @column()
  declare globalRating: number

  @column()
  declare numberOfTrips: number

  @column()
  declare isVerified: boolean

  @column({ serializeAs: null })
  declare password: string

  // Champs Driver (optionnels)
  @column()
  declare drivingLicense: string | null

  @column.date()
  declare licenseObtentionDate: DateTime | null

  @column()
  declare drivingExperience: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relations
  @hasMany(() => Vehicle, {
    foreignKey: 'driverId',
  })
  declare vehicles: HasMany<typeof Vehicle>

  @hasMany(() => Trip, {
    foreignKey: 'driverId',
  })
  declare tripsAsDriver: HasMany<typeof Trip>

  @hasMany(() => Booking, {
    foreignKey: 'passengerId',
  })
  declare bookingsAsPassenger: HasMany<typeof Booking>

  @hasMany(() => Review, {
    foreignKey: 'authorId',
  })
  declare givenReviews: HasMany<typeof Review>

  @hasMany(() => Review, {
    foreignKey: 'recipientId',
  })
  declare receivedReviews: HasMany<typeof Review>

  @hasMany(() => Notification, {
    foreignKey: 'userId',
  })
  declare notifications: HasMany<typeof Notification>

  // Hooks
  static async boot() {
    super.boot()

    this.before('create', async (user) => {
      if (!user.uuid) {
        user.uuid = uuidv4()
      }
    })
  }

  // Méthodes métier
  public isDriver(): boolean {
    return this.drivingLicense !== null
  }

  public canDrive(): boolean {
    return this.isDriver() && this.isVerified
  }

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
