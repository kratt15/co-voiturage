import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'payments'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table
        .integer('booking_id')
        .unsigned()
        .references('id')
        .inTable('bookings')
        .onDelete('CASCADE')
        .notNullable()
        .unique()
      table.double('amount').notNullable()
      table.timestamp('payment_date').notNullable()
      table.string('payment_method').notNullable()
      table.enum('status', ['PENDING', 'CONFIRMED', 'FAILED', 'REFUNDED']).defaultTo('PENDING')
      table.double('service_fee').defaultTo(0)
      table.string('transaction_id').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour les recherches par statut et date
      table.index(['status', 'payment_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
