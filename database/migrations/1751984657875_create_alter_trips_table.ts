import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'trips'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('departure_city').nullable().alter()
      table.string('arrival_city').nullable().alter()
      table.json('departure_coordinates').alter()
      table.json('arrival_coordinates').alter()
      table.double('price_per_seat').nullable().alter()
      table.integer('available_seats').nullable().alter()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('departure_city').alter()
      table.string('arrival_city').alter()
      table.string('departure_coordinates').alter()
      table.string('arrival_coordinates').alter()
      table.double('price_per_seat').alter()
      table.integer('available_seats').alter()
    })
  }
}
