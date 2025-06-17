import User from '#models/user';
import type {HttpContext} from '@adonisjs/core/http'
import {
  createRoleValidator,
  createPermissionValidator,
  assignPermissionToRoleValidator,
  userAndRolesValidator
} from '#validators/role_and_permission'

import {Acl, Permission, Role} from '@holoyan/adonisjs-permissions'
import PrimaryException from '#exceptions/primary_exception';

export default class RolesAndPermissionsController {

  // Get all roles
  async getRoles({response}: HttpContext) {
    try {
      const roles = await Role.all()
      return response.status(200).json({
        roles: roles
      })
    } catch (error) {
      console.error('Error while fetching roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch roles',
        error
      })
    }
  }

  // Get all permissions
  async getPermission({response}: HttpContext) {
    try {
      const permissions = await Permission.all()
      return response.status(200).json({
        permissions: permissions
      })
    } catch (error) {
      console.error('Error while fetching permissions:', error)
      return response.status(500).json({
        message: 'Failed to fetch permissions',
        error
      })
    }
  }

  // Get all roles for user
  async allRoleUser({response, auth}: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const roles = await Acl.model(user).roles()
      return response.status(200).json({
        message: 'Roles fetched successfully',
        roles: roles
      })
    } catch (error) {
      console.error('Error while fetching user roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch user roles',
        error
      })
    }
  }

  // get all admins with their roles
  async allAdminWithRoles({response, auth}: HttpContext) {
    try {
      const authUser = auth.getUserOrFail()

      const users = await User.query()
        .where('isAdmin', true)
        .whereNot('id', authUser.id)
        .orderBy('created_at', 'desc')

      const usersWithRoles = []
      for (const user of users) {
        const roles = await Acl.model(user).roles()
        usersWithRoles.push({
          user: user,
          roles: roles
        })
      }
      return response.status(200).json({
        message: 'Users with roles fetched successfully',
        usersWithRoles: usersWithRoles
      })
    } catch (error) {
      console.error('Error while fetching users with roles:', error)
      return response.status(500).json({
        message: 'Failed to fetch users with roles',
        error
      })
    }
  }

  // Get all permissions for role
  async getPermissionsForRole({response, params}: HttpContext) {
    try {
      const role_id = params.id
      const role = await Role.findBy('id', role_id)
      if (!role) {
        throw new PrimaryException('Role not found', {
          code: 'ROLE_NOT_FOUND',
          status: 404
        })
      }
      const permissions = await Acl.role(role).permissions()
      return response.status(200).json({
        message: 'Permissions fetched successfully',
        permissions: permissions
      })
    } catch (error) {
      console.error('Error while fetching permissions for role:', error)
      return response.status(400).json({
        message: 'Failed to fetch permissions for role',
        error
      })
    }
  }

  // Get all roles with their permissions
  async getAllRolesWithPermissions({response}: HttpContext) {
    try {
      const roles = await Role.all()
      const rp = []

      for (const role of roles) {
        const permissions = await Acl.role(role).permissions()
        rp.push({
          role: role,
          permissions: permissions
        })
      }

      return response.status(200).json({
        message: 'Roles with permissions fetched successfully',
        roles: rp
      })
    } catch (error) {
      console.error('Error while fetching roles with permissions:', error)
      return response.status(500).json({
        message: 'Failed to fetch roles with permissions',
        error
      })
    }
  }

  //  Get if role is assgned to user
  async getRoleIslinkedWithUsers({params, response}: HttpContext) {
    try {
      const role = await Role.findBy('id', params.id)
      if (!role) {
        throw new PrimaryException('Role not found', {
          code: 'ROLE_NOT_FOUND',
          status: 404
        })
      }
      const users = await Acl.role(role).modelsFor('users')
      if (users.length !== 0) {
        return response.status(200).json({
          message: 'Role is assigned to users',
          users: users
        })
      } else {
        return response.status(200).json({
          message: 'Role is not assigned to users',
          users: users
        })
      }
    } catch (error) {
      console.error('Error while fetching roles for user:', error)

      return response.status(500).json({
        message: 'Failed to fetch roles for user',
        error
      })
    }
  }


  // Create a role
  async createRole({request, response}: HttpContext) {
    try {
      const {slug} = await request.validateUsing(createRoleValidator)

      if (slug.length == 0) {
        throw new PrimaryException('Slug is required', {
          code: 'SLUG_REQUIRED',
          status: 400
        })
      }
      const oneRole = await Role.findBy('slug', slug)
      if (oneRole) {
        throw new PrimaryException('Role already exists', {
          code: 'ROLE_ALREADY_EXISTS',
          status: 400
        })
      }
      const role = await Acl.role().create({
        slug: slug
      })
      return response.status(201).json({
        message: 'Role created successfully',
        role
      })
    } catch (error) {
      console.error('Error while creating role:', error)
      return response.status(400).json({
        message: 'Failed to create role',
        error
      })
    }
  }

  // Create a permission
  async createPermission({request, response}: HttpContext) {
    try {
      const {slug} = await request.validateUsing(createPermissionValidator)
      const permission = await Acl.permission().create({
        slug: slug
      })
      return response.status(201).json({
        message: 'Permission created successfully',
        permission
      })
    } catch (error) {
      console.error('Error while creating permission:', error)
      return response.status(400).json({
        message: 'Failed to create permission',
        error
      })
    }
  }

  // Assign a role to a user
  async assignRolesToUser({request, response}: HttpContext) {
    try {
      const {user_id, roles} = await request.validateUsing(userAndRolesValidator)
      const user = await User.findBy('id', user_id)
      if (!user) {
        throw new PrimaryException('User not found', {
          code: 'USER_NOT_FOUND',
          status: 404
        })
      }
      //verifie que les roles existent

      let roles_found = []
      let roles_not_found = []

      for (const role of roles) {
        const oneRole = await Role.findBy('id', role)
        if (!oneRole) {
          roles_not_found.push(role)
        } else {
          roles_found.push(oneRole.slug)
        }
      }

      for (const role of roles_found) {
        await Acl.model(user).assignRole(role)
      }

      return response.status(200).json({message: 'Roles assigned successfully', roles_not_found: roles_not_found})
    } catch (error) {
      console.error('Error while assigning roles:', error)
      return response.status(400).json({
        message: 'Failed to assign roles',
        error
      })
    }
  }

  // Revoke a role from a user
  async revokeRoleForUser({request, response}: HttpContext) {
    try {
      const {user_id, roles} = await request.validateUsing(userAndRolesValidator)
      const user = await User.findBy('id', user_id)
      if (!user) {
        throw new PrimaryException('User not found', {
          code: 'USER_NOT_FOUND',
          status: 404
        })
      }

      //verifie que les roles existent

      let roles_found = []
      let roles_not_found = []

      for (const role of roles) {
        const oneRole = await Role.findBy('id', role)
        if (!oneRole) {
          roles_not_found.push(role)
        } else {
          roles_found.push(oneRole.slug)
        }
      }

      for (const role of roles_found) {
        await Acl.model(user).revokeRole(role)
      }

      return response.status(200).json({message: 'Roles revoked successfully', roles_not_found: roles_not_found})
    } catch (error) {
      console.error('Error while revoking roles:', error)
      return response.status(400).json({
        message: 'Failed to revoke roles',
        error
      })
    }
  }

  //  create role with permissions
  async assignPermissions({request, response}: HttpContext) {
    try {
      const {role, permissions} = await request.validateUsing(assignPermissionToRoleValidator)
      // const oneRole = await Role.findBy('slug', role)

      const result = await Role.query()
        .whereRaw(`LOWER(slug) = ?`, [role.toLowerCase()])
        .first()

      if (result) {
        throw new PrimaryException('Role already exists', {
          code: 'ROLE_ALREADY_EXISTS',
          status: 400
        })
      }
      if (permissions.length == 0) {
        throw new PrimaryException('Permissions are required', {
          code: 'PERMISSIONS_REQUIRED',
          status: 400
        })
      }
      const newRole = await Acl.role().create({
        slug: role
      })

      let permissions_found = []
      let permissions_not_found = []

      for (const permission of permissions) {
        const onePermission = await Permission.findBy('id', permission)
        if (!onePermission) {
          permissions_not_found.push(permission)
        } else {
          permissions_found.push(onePermission.slug)
        }
      }


      await Acl.role(newRole).giveAll(permissions_found)

      return response.status(201).json({
        message: 'Permissions assigned successfully',
        role: newRole,
        permissions_not_found: permissions_not_found
      })
    } catch (error) {
      console.error('Error while assigning permissions:', error)
      return response.status(400).json({
        message: 'Failed to assign permissions',
        error
      })
    }
  }

  // Modify a role with her permissions
  async modifyAssignPermissions({request, response, params}: HttpContext) {
    try {
      const {role, permissions} = await request.validateUsing(assignPermissionToRoleValidator)
      const role_id = params.id

      if (!role_id) {
        throw new PrimaryException('Role ID is required', {
          code: 'ROLE_ID_REQUIRED',
          status: 400
        })
      }

      const result = await Role.query()
        .whereRaw(`LOWER(slug) = ?`, [role.toLowerCase()])
        .whereNot('id', role_id)
        .first()

      if (result) {
        throw new PrimaryException('Role already exists', {
          code: 'ROLE_ALREADY_EXISTS',
          status: 400
        })
      }
      if (permissions.length == 0) {
        throw new PrimaryException('Permissions are required', {
          code: 'PERMISSIONS_REQUIRED',
          status: 400
        })
      }
      const oneRole = await Role.findBy('id', role_id)
      if (!oneRole) {
        throw new PrimaryException('Role not found', {
          code: 'ROLE_NOT_FOUND',
          status: 404
        })
      }

      oneRole.slug = role
      await oneRole.save()

      let permissions_found = []
      let permissions_not_found = []

      for (const permission of permissions) {
        const onePermission = await Permission.findBy('id', permission)
        if (!onePermission) {
          permissions_not_found.push(permission)
        } else {
          permissions_found.push(onePermission.slug)
        }
      }

      await Acl.role(oneRole).flush()
      await Acl.role(oneRole).giveAll(permissions_found)

      return response.status(200).json({
        message: 'Role updated successfully',
        permissions_not_found: permissions_not_found
      })
    } catch (error) {
      console.error('Error while modifying permissions:', error)
      return response.status(400).json({
        message: 'Failed to modify permissions',
        error
      })
    }
  }

  // Delete a role
  async deleteAssignPermissions({response, params}: HttpContext) {
    try {
      const role_id = params.id

      if (!role_id) {
        throw new PrimaryException('Role ID is required', {
          code: 'ROLE_ID_REQUIRED',
          status: 400
        })
      }

      const oneRole = await Role.findBy('id', role_id)
      if (!oneRole) {
        throw new PrimaryException('Role not found', {
          code: 'ROLE_NOT_FOUND',
          status: 404
        })
      }

      await Acl.role(oneRole).flush()
      await oneRole.delete()

      return response.status(200).json({message: 'Role deleted successfully'})
    } catch (error) {
      console.error('Error while deleting role:', error)
      return response.status(400).json({
        message: 'Failed to delete role',
        error
      })
    }
  }
}
