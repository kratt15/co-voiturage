import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(3).maxLength(255).optional(),
    lastName: vine.string().trim().minLength(3).maxLength(255).optional(),
    email: vine.string().trim().email().optional(),
    phone: vine.string().trim().minLength(10).maxLength(15).optional(),
    birthDate: vine.date().optional(),
    photo: vine.string().trim().minLength(3).maxLength(255).optional(),
    drivingLicense: vine.string().trim().minLength(3).maxLength(255).optional(),
    licenseObtentionDate: vine.date().optional(),
    drivingExperience: vine.number().min(0).max(100).optional(),
    globalRating: vine.number().min(0).max(5).optional(),


  })
)

export const updatePasswordValidator = vine.compile(
  vine.object({
    oldPassword: vine.string().trim().minLength(8).maxLength(255),
    password: vine.string().minLength(8).confirmed({confirmationField: 'passwordConfirmation'})
  })
)