import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('author_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('recipient_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('trip_id').unsigned().references('id').inTable('trips').onDelete('CASCADE').notNullable()
      table.integer('booking_id').unsigned().references('id').inTable('bookings').onDelete('CASCADE').nullable()
      table.integer('rating').notNullable() // 1 à 5
      table.text('comment').nullable()
      table.timestamp('review_date').notNullable()
      table.enum('type', ['DRIVER_TO_PASSENGER', 'PASSENGER_TO_DRIVER']).notNullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour améliorer les performances
      table.index(['recipient_id', 'rating'])
      table.index(['trip_id'])

      // Contrainte pour éviter les doublons d'avis pour un même trajet
      table.unique(['author_id', 'recipient_id', 'trip_id', 'type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
