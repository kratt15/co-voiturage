import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'bookings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('trip_id').unsigned().references('id').inTable('trips').onDelete('CASCADE').notNullable()
      table.integer('passenger_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.timestamp('booking_date').notNullable()
      table.integer('number_of_seats').notNullable()
      table.double('total_amount').notNullable()
      table
        .enum('status', ['PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'COMPLETED'])
        .defaultTo('PENDING')
      table.text('passenger_comment').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour améliorer les performances
      table.index(['trip_id', 'passenger_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
