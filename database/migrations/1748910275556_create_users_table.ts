import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table.uuid('uuid').notNullable().unique()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone').notNullable().unique()
      table.date('birth_date').notNullable()
      table.string('photo').nullable()
      table.double('global_rating').defaultTo(0)
      table.integer('number_of_trips').defaultTo(0)
      table.boolean('is_verified').defaultTo(false)
      table.string('password').notNullable()

      // Champs spécifiques aux conducteurs (optionnels)
      table.string('driving_license').nullable()
      table.date('license_obtention_date').nullable()
      table.integer('driving_experience').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
