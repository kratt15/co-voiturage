import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'trips'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Ajouter le champ pour stocker la route optimisée
      table.json('optimized_route').nullable()

      // Ajouter un timestamp pour savoir quand la dernière optimisation a été faite
      table.timestamp('last_optimized_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('optimized_route')
      table.dropColumn('last_optimized_at')
    })
  }
}
