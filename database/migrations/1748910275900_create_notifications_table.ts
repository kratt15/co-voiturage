import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'notifications'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.string('title').notNullable()
      table.text('message').notNullable()
      table.timestamp('creation_date').notNullable()
      table.boolean('is_read').defaultTo(false)
      table
        .enum('type', ['BOOKING', 'PAYMENT', 'CANCELLATION', 'REMINDER', 'MESSAGE'])
        .notNullable()
      table.json('metadata').nullable() // Pour stocker des infos supplémentaires (IDs de trip, booking, etc.)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour améliorer les performances
      table.index(['user_id', 'is_read', 'creation_date'])
      table.index(['type', 'creation_date'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
