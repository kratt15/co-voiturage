import type { HttpContext } from '@adonisjs/core/http'
import {
  createRoleValidator,
  createPermissionValidator,
  assignPermissionToRoleValidator,
  userAndRolesValidator,
} from '#validators/role_and_permission'
import { AclService } from '#services/acl_service'

export default class RolesAndPermissionsController {
  private aclService = new AclService()

  // Get all roles
  async getRoles({ response }: HttpContext) {
    try {
      const roles = await this.aclService.getAllRoles()
      return response.status(200).json({
        roles: roles,
      })
    } catch (error) {
      console.error('Error while fetching roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch roles',
        error,
      })
    }
  }

  // Get all permissions
  async getPermission({ response }: HttpContext) {
    try {
      const permissions = await this.aclService.getAllPermissions()
      return response.status(200).json({
        permissions: permissions,
      })
    } catch (error) {
      console.error('Error while fetching permissions:', error)
      return response.status(500).json({
        message: 'Failed to fetch permissions',
        error,
      })
    }
  }

  // Get all roles for user
  async allRoleUser({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const roles = await this.aclService.getUserRoles(user)
      return response.status(200).json({
        message: 'Roles fetched successfully',
        roles: roles,
      })
    } catch (error) {
      console.error('Error while fetching user roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch user roles',
        error,
      })
    }
  }

  // get all admins with their roles
  async allAdminWithRoles({ response, auth }: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()
      const usersWithRoles = await this.aclService.getAllAdminsWithRoles(authUser.id)

      return response.status(200).json({
        message: 'Users with roles fetched successfully',
        usersWithRoles: usersWithRoles,
      })
    } catch (error) {
      console.error('Error while fetching users with roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch users with roles',
        error,
      })
    }
  }

  // Get all permissions for role
  async getPermissionsForRole({ response, params }: HttpContext) {
    try {
      const roleId = params.id
      const { permissions } = await this.aclService.getPermissionsForRole(roleId)

      return response.status(200).json({
        message: 'Permissions fetched successfully',
        permissions: permissions,
      })
    } catch (error) {
      console.error('Error while fetching permissions for role:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to fetch permissions for role',
        error,
      })
    }
  }

  // Get all roles with their permissions
  async getAllRolesWithPermissions({ response }: HttpContext) {
    try {
      const rolesWithPermissions = await this.aclService.getAllRolesWithPermissions()

      return response.status(200).json({
        message: 'Roles with permissions fetched successfully',
        roles: rolesWithPermissions,
      })
    } catch (error) {
      console.error('Error while fetching roles with permissions:', error)
      return response.status(500).json({
        message: 'Failed to fetch roles with permissions',
        error,
      })
    }
  }

  //  Get if role is assgned to users
  async getRoleIslinkedWithUsers({ params, response }: HttpContext) {
    try {
      const roleId = params.id
      const { users } = await this.aclService.checkRoleAssignedToUsers(roleId)

      const message =
        users.length !== 0 ? 'Role is assigned to users' : 'Role is not assigned to users'

      return response.status(200).json({
        message: message,
        users: users,
      })
    } catch (error) {
      console.error('Error while fetching roles for user:', error)
      const status = error.status || 500
      return response.status(status).json({
        message: 'Failed to fetch roles for user',
        error,
      })
    }
  }

  // Create a role
  async createRole({ request, response }: HttpContext) {
    try {
      const { slug } = await request.validateUsing(createRoleValidator)
      const role = await this.aclService.createRole(slug)

      return response.status(201).json({
        message: 'Role created successfully',
        role,
      })
    } catch (error) {
      console.error('Error while creating role:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to create role',
        error,
      })
    }
  }

  // Create a permission
  async createPermission({ request, response }: HttpContext) {
    try {
      const { slug } = await request.validateUsing(createPermissionValidator)
      const permission = await this.aclService.createPermission(slug)

      return response.status(201).json({
        message: 'Permission created successfully',
        permission,
      })
    } catch (error) {
      console.error('Error while creating permission:', error)
      return response.status(400).json({
        message: 'Failed to create permission',
        error,
      })
    }
  }

  // Assign a role to a user
  async assignRolesToUser({ request, response }: HttpContext) {
    try {
      const { user_id, roles } = await request.validateUsing(userAndRolesValidator)
      const { rolesNotFound } = await this.aclService.assignRolesToUser(user_id, roles)

      return response.status(200).json({
        message: 'Roles assigned successfully',
        roles_not_found: rolesNotFound,
      })
    } catch (error) {
      console.error('Error while assigning roles:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to assign roles',
        error,
      })
    }
  }

  // Revoke a role from a user
  async revokeRoleForUser({ request, response }: HttpContext) {
    try {
      const { user_id, roles } = await request.validateUsing(userAndRolesValidator)
      const { rolesNotFound } = await this.aclService.revokeRolesFromUser(user_id, roles)

      return response.status(200).json({
        message: 'Roles revoked successfully',
        roles_not_found: rolesNotFound,
      })
    } catch (error) {
      console.error('Error while revoking roles:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to revoke roles',
        error,
      })
    }
  }

  //  create role with permissions
  async assignPermissions({ request, response }: HttpContext) {
    try {
      const { role, permissions } = await request.validateUsing(assignPermissionToRoleValidator)
      const { role: newRole, permissionsNotFound } =
        await this.aclService.createRoleWithPermissions(role, permissions)

      return response.status(201).json({
        message: 'Permissions assigned successfully',
        role: newRole,
        permissions_not_found: permissionsNotFound,
      })
    } catch (error) {
      console.error('Error while assigning permissions:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to assign permissions',
        error,
      })
    }
  }

  // Modify a role with her permissions
  async modifyAssignPermissions({ request, response, params }: HttpContext) {
    try {
      const { role, permissions } = await request.validateUsing(assignPermissionToRoleValidator)
      const roleId = params.id

      const { permissionsNotFound } = await this.aclService.updateRoleWithPermissions(
        roleId,
        role,
        permissions
      )

      return response.status(200).json({
        message: 'Role updated successfully',
        permissions_not_found: permissionsNotFound,
      })
    } catch (error) {
      console.error('Error while modifying permissions:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to modify permissions',
        error,
      })
    }
  }

  // Delete a role
  async deleteAssignPermissions({ response, params }: HttpContext) {
    try {
      const roleId = params.id
      await this.aclService.deleteRole(roleId)

      return response.status(200).json({
        message: 'Role deleted successfully',
      })
    } catch (error) {
      console.error('Error while deleting role:', error)
      const status = error.status || 400
      return response.status(status).json({
        message: 'Failed to delete role',
        error,
      })
    }
  }
}
