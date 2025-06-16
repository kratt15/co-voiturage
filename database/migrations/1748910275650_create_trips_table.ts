import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'trips'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('driver_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table
        .integer('vehicle_id')
        .unsigned()
        .references('id')
        .inTable('vehicles')
        .onDelete('CASCADE')
        .notNullable()
      table.string('departure_city').notNullable()
      table.string('departure_coordinates').notNullable() // latitude, longitude
      table.string('arrival_city').notNullable()
      table.string('arrival_coordinates').notNullable() // latitude, longitude
      table.timestamp('departure_date').notNullable()
      table.time('departure_time').notNullable()
      table.integer('estimated_duration').notNullable() // en minutes
      table.double('distance_km').notNullable()
      table.double('price_per_seat').notNullable()
      table.integer('available_seats').notNullable()
      table.integer('total_seats').notNullable()
      table
        .enum('status', ['DRAFT', 'PUBLISHED', 'FULL', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
        .defaultTo('DRAFT')
      table.text('comments').nullable()
      table.boolean('pets_allowed').defaultTo(false)
      table.boolean('luggage_allowed').defaultTo(true)
      table.json('possible_stops').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
