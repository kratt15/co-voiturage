import vine from '@vinejs/vine'

export const createVehicleValidator = vine.compile(
    vine.object({
        brand: vine.string().trim().minLength(3).maxLength(255),
        model: vine.string().trim().minLength(3).maxLength(255),
        color: vine.string().trim().minLength(3).maxLength(255),
        licensePlate: vine.string().trim().minLength(3).maxLength(255),
        year: vine.number().min(1900).max(2025),
        numberOfSeats: vine.number().min(1).max(100),
        fuelType: vine.string().trim().minLength(3).maxLength(255),
        hasAirConditioning: vine.boolean(),
        isVerified: vine.boolean(),
    })
)

export const updateVehicleValidator = vine.compile(
    vine.object({
        brand: vine.string().trim().minLength(3).maxLength(255).optional(),
        model: vine.string().trim().minLength(3).maxLength(255).optional(),
        color: vine.string().trim().minLength(3).maxLength(255).optional(),
        licensePlate: vine.string().trim().minLength(3).maxLength(255).optional(),
        year: vine.number().min(1900).max(2025).optional(),
        numberOfSeats: vine.number().min(1).max(100).optional(),
        fuelType: vine.string().trim().minLength(3).maxLength(255).optional(),
        hasAirConditioning: vine.boolean().optional(),
        isVerified: vine.boolean().optional(),
    })
)