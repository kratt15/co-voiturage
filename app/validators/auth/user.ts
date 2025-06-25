import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
    vine.object({
        firstName: vine.string().trim().minLength(3).maxLength(255),
        lastName: vine.string().trim().minLength(3).maxLength(255),
        email: vine.string().trim().email().unique(async(db,value) => {
          const user = await db.from('users').where('email', value).first()
          return !user
        }).toLowerCase(),
        phone: vine.string().trim().minLength(10).maxLength(15).unique(async(db,value) => {
          const user = await db.from('users').where('phone', value).first()
          return !user
        }),
        birthDate: vine.date(),
        photo: vine.string().trim().minLength(10).maxLength(255).optional(),
        globalRating: vine.number().min(0).max(5).optional(),
        numberOfTrips: vine.number().min(0).optional(),
        password: vine.string().minLength(8).maxLength(30).confirmed({confirmationField: 'passwordConfirmation'})
    })
)

export const loginValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email().minLength(3).maxLength(255).toLowerCase(),
        password: vine.string().trim().minLength(8).maxLength(255),
    })
)

export const onlyEmailValidator = vine.compile(
    vine.object({
        email: vine.string().trim().email().minLength(3).maxLength(255).toLowerCase(),
    })
)

export const resetPasswordValidator = vine.compile(
    vine.object({
        password: vine.string().trim().minLength(8).maxLength(255).confirmed({confirmationField: 'passwordConfirmation'}),
    })
)

