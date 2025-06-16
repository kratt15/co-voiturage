import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.integer('sender_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('receiver_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('trip_id').unsigned().references('id').inTable('trips').onDelete('CASCADE').nullable()
      table.text('content').notNullable()
      table.timestamp('send_date').notNullable()
      table.boolean('is_read').defaultTo(false)

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()

      // Index pour améliorer les performances des conversations
      table.index(['sender_id', 'receiver_id', 'send_date'])
      table.index(['receiver_id', 'is_read'])
      table.index(['trip_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
