import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'vehicles'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('driver_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('brand').notNullable()
      table.string('model').notNullable()
      table.string('color').notNullable()
      table.string('license_plate').unique().notNullable()
      table.integer('year').notNullable()
      table.integer('number_of_seats').notNullable()
      table.string('fuel_type').notNullable()
      table.boolean('has_air_conditioning').defaultTo(false)
      table.boolean('is_verified').defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
