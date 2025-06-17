import vine from '@vinejs/vine'

export const createPermissionValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().maxLength(50),
  })
)

export const createRoleValidator = vine.compile(
  vine.object({
    slug: vine.string().trim().maxLength(50),
  })
)

export const assignPermissionToRoleValidator = vine.compile(
  vine.object({
    role: vine.string().trim().maxLength(50),
    permissions: vine.array(vine.number().positive()),
  })
)

export const userAndRolesValidator = vine.compile(
  vine.object({
    user_id: vine.number().positive(),
    roles: vine.array(vine.number().positive()),
  })
)
