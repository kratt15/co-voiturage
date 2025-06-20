import vine from '@vinejs/vine'

export const createAdminValidator = vine.compile(vine.object({
    firstname: vine.string(),
    lastname: vine.string(),
    email: vine.string().email().toLowerCase().unique(async (db, value, field) => {
        // Correction : n'utiliser .whereNot que si un id est fourni (update), sinon ne rien mettre (création)
        let query = db.from('users').where('email', value)
        if (field.data?.params?.id) {
            query = query.whereNot('id', field.data.params.id)
        }
        const user = await query.first()
        return !user
      }),
    roles: vine.array(vine.number())
}))

export const updateAdminValidator = vine.compile(vine.object({
    firstname: vine.string(),
    lastname: vine.string(),
    email: vine.string().email().toLowerCase().unique(async (db, value, field) => {
        // Correction : n'utiliser .whereNot que si un id est fourni (update), sinon ne rien mettre (création)
        let query = db.from('users').where('email', value)
        if (field.data?.params?.id) {
            query = query.whereNot('id', field.data.params.id)
        }
        const user = await query.first()
        return !user
      }),
    roles: vine.array(vine.number())
}))