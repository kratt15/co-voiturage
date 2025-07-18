import vine from '@vinejs/vine'

export const createTripValidator = vine.compile(
  vine.object({
    departureCoordinates: vine.object({
      latitude: vine.number().min(-90).max(90),
      longitude: vine.number().min(-180).max(180),
    }),
    departureCity: vine.string().trim().minLength(3).maxLength(255),
    arrivalCity: vine.string().trim().minLength(3).maxLength(255),
    arrivalCoordinates: vine.object({
      latitude: vine.number().min(-90).max(90),
      longitude: vine.number().min(-180).max(180),
    }),
    departureDate: vine.date(),
    departureTime: vine
      .string()
      .trim()
      .minLength(3)
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
    estimatedDuration: vine.number().min(1).max(100),
    distanceKm: vine.number().min(1).max(200),
    pricePerSeat: vine.number().min(1),
    availableSeats: vine.number().min(1).max(100),
    totalSeats: vine.number().min(1).max(100),
    comments: vine.string().trim().minLength(3).maxLength(255).optional(),
    petsAllowed: vine.boolean(),
    luggageAllowed: vine.boolean(),
    possibleStops: vine.object({
      stop_1: vine.string().trim().minLength(3).maxLength(255),
      stop_2: vine.string().trim().minLength(3).maxLength(255),
    }).optional(),
    vehicleId: vine.number().min(1),

  })
)

export const updateTripValidator = vine.compile(
  vine.object({
    departureCoordinates: vine.object({
      latitude: vine.number().min(-90).max(90),
      longitude: vine.number().min(-180).max(180),
    }).optional(),
    departureCity: vine.string().trim().minLength(3).maxLength(255).optional(),
    arrivalCity: vine.string().trim().minLength(3).maxLength(255).optional(),
    arrivalCoordinates: vine.object({
      latitude: vine.number().min(-90).max(90),
      longitude: vine.number().min(-180).max(180),
    }).optional(),
    departureDate: vine.date().optional(),
    departureTime: vine
      .string()
      .trim()
      .minLength(3)
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .optional(),
    estimatedDuration: vine.number().min(1).max(100).optional(),
    distanceKm: vine.number().min(1).max(200).optional(),
    pricePerSeat: vine.number().min(1).optional(),
    availableSeats: vine.number().min(1).max(100).optional(),
    totalSeats: vine.number().min(1).max(100).optional(),
    comments: vine.string().trim().minLength(3).maxLength(255).optional(),
    petsAllowed: vine.boolean().optional(),
    luggageAllowed: vine.boolean().optional(),
    possibleStops: vine.object({
      stop_1: vine.string().trim().minLength(3).maxLength(255),
      stop_2: vine.string().trim().minLength(3).maxLength(255),
    }).optional(),
    vehicleId: vine.number().min(1).optional(),

  })
)
