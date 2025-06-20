import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { AclService } from '#services/acl_service'
import { Acl, Permission, Role } from '@holoyan/adonisjs-permissions'
import PrimaryException from '#exceptions/primary_exception'
import { createTestAdmin, createTestUser } from '#tests/helpers/auth_helper'

test.group('AclService Unit Tests', (group) => {
  let aclService: AclService
  let testUser: User
  let testAdmin: User

  group.setup(async () => {
    await testUtils.db().truncate()
  })

  group.teardown(async () => {
    await testUtils.db().truncate()
  })

  group.each.setup(async () => {
    aclService = new AclService()

    testUser = await createTestUser({
      email: 'test@user.com',
      phone: '0123456789',
    })

    testAdmin = await createTestAdmin({
      email: 'test@admin.com',
      phone: '0123456788',
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('getAllRoles should return all roles', async ({ assert }) => {
    // Créer des rôles de test
    await Acl.role().create({ slug: 'role1' })
    await Acl.role().create({ slug: 'role2' })

    const roles = await aclService.getAllRoles()

    assert.equal(roles.length, 2)
    assert.equal(roles[0].slug, 'role1')
    assert.equal(roles[1].slug, 'role2')
  })

  test('getAllPermissions should return all permissions', async ({ assert }) => {
    // Créer des permissions de test
    await Acl.permission().create({ slug: 'permission1' })
    await Acl.permission().create({ slug: 'permission2' })

    const permissions = await aclService.getAllPermissions()

    assert.equal(permissions.length, 2)
    assert.equal(permissions[0].slug, 'permission1')
    assert.equal(permissions[1].slug, 'permission2')
  })

  test('getUserRoles should return user roles', async ({ assert }) => {
    // Créer et assigner un rôle à l'utilisateur
    await Acl.role().create({ slug: 'user-role' })
    await Acl.model(testUser).assignRole('user-role')

    const roles = await aclService.getUserRoles(testUser)

    assert.equal(roles.length, 1)
    assert.equal(roles[0].slug, 'user-role')
  })

  test('getAllAdminsWithRoles should return admins excluding current user', async ({ assert }) => {
    // Créer un autre admin
    const anotherAdmin = await createTestAdmin({
      firstName: 'Another',
      lastName: 'Admin',
      email: 'another@admin.com',
      phone: '0123456787',
    })

    const result = await aclService.getAllAdminsWithRoles(testAdmin.id)

    assert.equal(result.length, 1)
    assert.equal(result[0].user.id, anotherAdmin.id)
    assert.isArray(result[0].roles)
  })

  test('getPermissionsForRole should return role permissions', async ({ assert }) => {
    // Créer un rôle et une permission
    const role = await Acl.role().create({ slug: 'test-role' })
    await Acl.permission().create({ slug: 'test-permission' })
    await Acl.role(role).give('test-permission')

    const result = await aclService.getPermissionsForRole(role.id.toString())

    assert.equal(result.role.id, role.id)
    assert.isArray(result.permissions)
  })

  test('getPermissionsForRole should throw exception for non-existent role', async ({ assert }) => {
    await assert.rejects(
      () => aclService.getPermissionsForRole('999'),
      PrimaryException,
      'Role not found'
    )
  })

  test('checkRoleAssignedToUsers should return users assigned to role', async ({ assert }) => {
    const role = await Acl.role().create({ slug: 'test-role' })
    await Acl.model(testUser).assignRole('test-role')

    const result = await aclService.checkRoleAssignedToUsers(role.id.toString())

    assert.equal(result.role.id, role.id)
    assert.isArray(result.users)
  })

  test('createRole should create a new role', async ({ assert }) => {
    const role = await aclService.createRole('new-role')

    assert.equal(role.slug, 'new-role')
  })

  test('createRole should throw exception for empty slug', async ({ assert }) => {
    await assert.rejects(() => aclService.createRole(''), PrimaryException, 'Slug is required')
  })

  test('createRole should throw exception for duplicate slug', async ({ assert }) => {
    await Acl.role().create({ slug: 'duplicate-role' })

    await assert.rejects(
      () => aclService.createRole('duplicate-role'),
      PrimaryException,
      'Role already exists'
    )
  })

  test('createPermission should create a new permission', async ({ assert }) => {
    const permission = await aclService.createPermission('new-permission')

    assert.equal(permission.slug, 'new-permission')
  })

  test('validateRoles should return found and not found roles', async ({ assert }) => {
    const role1 = await Acl.role().create({ slug: 'role1' })
    const role2 = await Acl.role().create({ slug: 'role2' })

    const result = await aclService.validateRoles([role1.id, role2.id, 999])

    assert.equal(result.rolesFound.length, 2)
    assert.equal(result.rolesNotFound.length, 1)
    assert.include(result.rolesFound, 'role1')
    assert.include(result.rolesFound, 'role2')
    assert.include(result.rolesNotFound, 999)
  })

  test('assignRolesToUser should assign roles to user', async ({ assert }) => {
    const role1 = await Acl.role().create({ slug: 'role1' })
    const role2 = await Acl.role().create({ slug: 'role2' })

    const result = await aclService.assignRolesToUser(testUser.id, [role1.id, role2.id])

    assert.equal(result.user.id, testUser.id)
    assert.equal(result.rolesNotFound.length, 0)

    // Vérifier que les rôles ont été assignés
    const userRoles = await aclService.getUserRoles(testUser)
    assert.equal(userRoles.length, 2)
  })

  test('assignRolesToUser should throw exception for non-existent user', async ({ assert }) => {
    await assert.rejects(
      () => aclService.assignRolesToUser(999, [1]),
      PrimaryException,
      'User not found'
    )
  })

  test('revokeRolesFromUser should revoke roles from user', async ({ assert }) => {
    const role1 = await Acl.role().create({ slug: 'role1' })
    await Acl.model(testUser).assignRole('role1')

    const result = await aclService.revokeRolesFromUser(testUser.id, [role1.id])

    assert.equal(result.user.id, testUser.id)
    assert.equal(result.rolesNotFound.length, 0)

    // Vérifier que le rôle a été révoqué
    const userRoles = await aclService.getUserRoles(testUser)
    assert.equal(userRoles.length, 0)
  })

  test('validatePermissions should return found and not found permissions', async ({ assert }) => {
    const perm1 = await Acl.permission().create({ slug: 'perm1' })
    const perm2 = await Acl.permission().create({ slug: 'perm2' })

    const result = await aclService.validatePermissions([perm1.id, perm2.id, 999])

    assert.equal(result.permissionsFound.length, 2)
    assert.equal(result.permissionsNotFound.length, 1)
    assert.include(result.permissionsFound, 'perm1')
    assert.include(result.permissionsFound, 'perm2')
    assert.include(result.permissionsNotFound, 999)
  })

  test('createRoleWithPermissions should create role and assign permissions', async ({
    assert,
  }) => {
    const perm1 = await Acl.permission().create({ slug: 'perm1' })
    const perm2 = await Acl.permission().create({ slug: 'perm2' })

    const result = await aclService.createRoleWithPermissions('new-role', [perm1.id, perm2.id])

    assert.equal(result.role.slug, 'new-role')
    assert.equal(result.permissionsNotFound.length, 0)

    // Vérifier que les permissions ont été assignées
    const rolePermissions = await aclService.getPermissionsForRole(result.role.id.toString())
    assert.equal(rolePermissions.permissions.length, 2)
  })

  test('createRoleWithPermissions should throw exception for duplicate role', async ({
    assert,
  }) => {
    await Acl.role().create({ slug: 'existing-role' })

    await assert.rejects(
      () => aclService.createRoleWithPermissions('existing-role', [1]),
      PrimaryException,
      'Role already exists'
    )
  })

  test('createRoleWithPermissions should throw exception for empty permissions', async ({
    assert,
  }) => {
    await assert.rejects(
      () => aclService.createRoleWithPermissions('new-role', []),
      PrimaryException,
      'Permissions are required'
    )
  })

  test('updateRoleWithPermissions should update role and permissions', async ({ assert }) => {
    const role = await Acl.role().create({ slug: 'old-role' })
    const perm1 = await Acl.permission().create({ slug: 'perm1' })
    const perm2 = await Acl.permission().create({ slug: 'perm2' })

    const result = await aclService.updateRoleWithPermissions(role.id.toString(), 'updated-role', [
      perm1.id,
      perm2.id,
    ])

    assert.equal(result.role.slug, 'updated-role')
    assert.equal(result.permissionsNotFound.length, 0)

    // Vérifier que le rôle a été mis à jour
    const updatedRole = await Role.findOrFail(role.id)
    assert.equal(updatedRole.slug, 'updated-role')
  })

  test('updateRoleWithPermissions should throw exception for non-existent role', async ({
    assert,
  }) => {
    await assert.rejects(
      () => aclService.updateRoleWithPermissions('999', 'new-role', [1]),
      PrimaryException,
      'Role not found'
    )
  })

  test('deleteRole should delete role and permissions', async ({ assert }) => {
    const role = await Acl.role().create({ slug: 'delete-role' })
    const perm = await Acl.permission().create({ slug: 'delete-perm' })
    await Acl.role(role).give('delete-perm')

    await aclService.deleteRole(role.id.toString())

    // Vérifier que le rôle a été supprimé
    const deletedRole = await Role.find(role.id)
    assert.isNull(deletedRole)
  })

  test('deleteRole should throw exception for non-existent role', async ({ assert }) => {
    await assert.rejects(() => aclService.deleteRole('999'), PrimaryException, 'Role not found')
  })

  test('getAllRolesWithPermissions should return all roles with their permissions', async ({
    assert,
  }) => {
    const role1 = await Acl.role().create({ slug: 'role1' })
    const role2 = await Acl.role().create({ slug: 'role2' })
    const perm1 = await Acl.permission().create({ slug: 'perm1' })

    await Acl.role(role1).give('perm1')

    const result = await aclService.getAllRolesWithPermissions()

    assert.equal(result.length, 2)
    assert.equal(result[0].role.slug, 'role1')
    assert.equal(result[1].role.slug, 'role2')
    assert.isArray(result[0].permissions)
    assert.isArray(result[1].permissions)
  })
})
