import User from '#models/user'
import { Acl, Permission, Role } from '@holoyan/adonisjs-permissions'
import PrimaryException from '#exceptions/primary_exception'

export interface UserWithRoles {
  user: User
  roles: any[]
}

export interface RoleWithPermissions {
  role: any
  permissions: any[]
}

export interface RoleValidationResult {
  rolesFound: string[]
  rolesNotFound: any[]
}

export interface PermissionValidationResult {
  permissionsFound: string[]
  permissionsNotFound: any[]
}

export class AclService {
  /**
   * Récupère tous les rôles
   */
  async getAllRoles() {
    return await Role.all()
  }

  /**
   * Récupère toutes les permissions
   */
  async getAllPermissions() {
    return await Permission.all()
  }

  /**
   * Récupère tous les rôles d'un utilisateur
   */
  async getUserRoles(user: User) {
    return await Acl.model(user).roles()
  }

  /**
   * Récupère tous les admins avec leurs rôles (excluant l'utilisateur connecté)
   */
  async getAllAdminsWithRoles(excludeUserId: number): Promise<UserWithRoles[]> {
    const users = await User.query()
      .where('isAdmin', true)
      .whereNot('id', excludeUserId)
      .orderBy('created_at', 'desc')

    const usersWithRoles: UserWithRoles[] = []
    for (const user of users) {
      const roles = await this.getUserRoles(user)
      usersWithRoles.push({
        user: user,
        roles: roles,
      })
    }
    return usersWithRoles
  }

  /**
   * Récupère les permissions d'un rôle par ID
   */
  async getPermissionsForRole(roleId: string) {
    const role = await Role.findBy('id', roleId)
    if (!role) {
      throw new PrimaryException('Role not found', {
        code: 'ROLE_NOT_FOUND',
        status: 404,
      })
    }
    const permissions = await Acl.role(role).permissions()
    return { role, permissions }
  }

  /**
   * Récupère tous les rôles avec leurs permissions
   */
  async getAllRolesWithPermissions(): Promise<RoleWithPermissions[]> {
    const roles = await Role.all()
    const rolesWithPermissions: RoleWithPermissions[] = []

    for (const role of roles) {
      const permissions = await Acl.role(role).permissions()
      rolesWithPermissions.push({
        role: role,
        permissions: permissions,
      })
    }
    return rolesWithPermissions
  }

  /**
   * Vérifie si un rôle est assigné à des utilisateurs
   */
  async checkRoleAssignedToUsers(roleId: string) {
    const role = await Role.findBy('id', roleId)
    if (!role) {
      throw new PrimaryException('Role not found', {
        code: 'ROLE_NOT_FOUND',
        status: 404,
      })
    }
    const users = await Acl.role(role).modelsFor('users')
    return { role, users }
  }

  /**
   * Crée un nouveau rôle
   */
  async createRole(slug: string) {
    if (!slug || slug.length === 0) {
      throw new PrimaryException('Slug is required', {
        code: 'SLUG_REQUIRED',
        status: 400,
      })
    }

    const existingRole = await Role.findBy('slug', slug)
    if (existingRole) {
      throw new PrimaryException('Role already exists', {
        code: 'ROLE_ALREADY_EXISTS',
        status: 400,
      })
    }

    return await Acl.role().create({ slug: slug })
  }

  /**
   * Crée une nouvelle permission
   */
  async createPermission(slug: string) {
    return await Acl.permission().create({ slug: slug })
  }

  /**
   * Valide et trouve les rôles par IDs
   */
  async validateRoles(roleIds: number[]): Promise<RoleValidationResult> {
    const rolesFound: string[] = []
    const rolesNotFound: number[] = []

    for (const roleId of roleIds) {
      const role = await Role.findBy('id', roleId)
      if (!role) {
        rolesNotFound.push(roleId)
      } else {
        rolesFound.push(role.slug)
      }
    }

    return { rolesFound, rolesNotFound }
  }

  /**
   * Assigne des rôles à un utilisateur
   */
  async assignRolesToUser(userId: number, roleIds: number[]) {
    const user = await User.findBy('id', userId)
    if (!user) {
      throw new PrimaryException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      })
    }

    const { rolesFound, rolesNotFound } = await this.validateRoles(roleIds)

    for (const roleSlug of rolesFound) {
      await Acl.model(user).assignRole(roleSlug)
    }

    return { user, rolesNotFound }
  }

  /**
   * Révoque des rôles d'un utilisateur
   */
  async revokeRolesFromUser(userId: number, roleIds: number[]) {
    const user = await User.findBy('id', userId)
    if (!user) {
      throw new PrimaryException('User not found', {
        code: 'USER_NOT_FOUND',
        status: 404,
      })
    }

    const { rolesFound, rolesNotFound } = await this.validateRoles(roleIds)

    for (const roleSlug of rolesFound) {
      await Acl.model(user).revokeRole(roleSlug)
    }

    return { user, rolesNotFound }
  }

  /**
   * Valide et trouve les permissions par IDs
   */
  async validatePermissions(permissionIds: number[]): Promise<PermissionValidationResult> {
    const permissionsFound: string[] = []
    const permissionsNotFound: number[] = []

    for (const permissionId of permissionIds) {
      const permission = await Permission.findBy('id', permissionId)
      if (!permission) {
        permissionsNotFound.push(permissionId)
      } else {
        permissionsFound.push(permission.slug)
      }
    }

    return { permissionsFound, permissionsNotFound }
  }

  /**
   * Crée un rôle et lui assigne des permissions
   */
  async createRoleWithPermissions(roleSlug: string, permissionIds: number[]) {
    // Vérifier si le rôle existe déjà
    const existingRole = await Role.query()
      .whereRaw(`LOWER(slug) = ?`, [roleSlug.toLowerCase()])
      .first()

    if (existingRole) {
      throw new PrimaryException('Role already exists', {
        code: 'ROLE_ALREADY_EXISTS',
        status: 400,
      })
    }

    if (permissionIds.length === 0) {
      throw new PrimaryException('Permissions are required', {
        code: 'PERMISSIONS_REQUIRED',
        status: 400,
      })
    }

    // Créer le nouveau rôle
    const newRole = await Acl.role().create({ slug: roleSlug })

    // Valider et assigner les permissions
    const { permissionsFound, permissionsNotFound } = await this.validatePermissions(permissionIds)
    await Acl.role(newRole).giveAll(permissionsFound)

    return { role: newRole, permissionsNotFound }
  }

  /**
   * Modifie un rôle et ses permissions
   */
  async updateRoleWithPermissions(roleId: string, roleSlug: string, permissionIds: number[]) {
    if (!roleId) {
      throw new PrimaryException('Role ID is required', {
        code: 'ROLE_ID_REQUIRED',
        status: 400,
      })
    }

    // Vérifier si un autre rôle avec ce slug existe déjà
    const existingRole = await Role.query()
      .whereRaw(`LOWER(slug) = ?`, [roleSlug.toLowerCase()])
      .whereNot('id', roleId)
      .first()

    if (existingRole) {
      throw new PrimaryException('Role already exists', {
        code: 'ROLE_ALREADY_EXISTS',
        status: 400,
      })
    }

    if (permissionIds.length === 0) {
      throw new PrimaryException('Permissions are required', {
        code: 'PERMISSIONS_REQUIRED',
        status: 400,
      })
    }

    // Trouver le rôle à modifier
    const role = await Role.findBy('id', roleId)
    if (!role) {
      throw new PrimaryException('Role not found', {
        code: 'ROLE_NOT_FOUND',
        status: 404,
      })
    }

    // Mettre à jour le slug du rôle
    role.slug = roleSlug
    await role.save()

    // Valider et mettre à jour les permissions
    const { permissionsFound, permissionsNotFound } = await this.validatePermissions(permissionIds)

    // Supprimer toutes les permissions existantes et assigner les nouvelles
    await Acl.role(role).flush()
    await Acl.role(role).giveAll(permissionsFound)

    return { role, permissionsNotFound }
  }

  /**
   * Supprime un rôle et toutes ses permissions
   */
  async deleteRole(roleId: string) {
    if (!roleId) {
      throw new PrimaryException('Role ID is required', {
        code: 'ROLE_ID_REQUIRED',
        status: 400,
      })
    }

    const role = await Role.findBy('id', roleId)
    if (!role) {
      throw new PrimaryException('Role not found', {
        code: 'ROLE_NOT_FOUND',
        status: 404,
      })
    }

    // Supprimer toutes les permissions du rôle puis le rôle lui-même
    await Acl.role(role).flush()
    await role.delete()

    return role
  }
}
