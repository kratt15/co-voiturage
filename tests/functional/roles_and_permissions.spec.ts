import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import User from '#models/user'
import { Acl } from '@holoyan/adonisjs-permissions'
import { createTestAdmin, createTestUser } from '#tests/helpers/auth_helper'

test.group('Roles and Permissions API', (group) => {
  let authenticatedUser: User
  let adminUser: User
  let testRole: any
  let testPermission: any

  group.setup(async () => {
    await testUtils.db().truncate()
  })

  group.teardown(async () => {
    await testUtils.db().truncate()
  })

  group.each.setup(async () => {
    adminUser = await createTestAdmin({
      email: 'admin@test.com',
      phone: '0123456789',
    })

    authenticatedUser = await createTestUser({
      email: 'user@test.com',
      phone: '0123456788',
    })
  })

  group.each.teardown(async () => {
    await testUtils.db().truncate()
  })

  test('GET /api/v1/acl/roles - should get all roles', async ({ client }) => {
    testRole = await Acl.role().create({ slug: 'test-role' })

    const response = await client.get('/api/v1/acl/roles').loginAs(adminUser)

    response.assertStatus(200)
    response.assertBody({
      roles: [
        {
          id: testRole.id,
          slug: 'test-role',
          title: null,
          entity_type: '*',
          entity_id: null,
          scope: 'default',
          allowed: true,
          created_at: testRole.created_at.toISOString(),
          updated_at: testRole.updated_at.toISOString(),
        },
      ],
    })
  })

  test('GET /api/v1/acl/permissions - should get all permissions', async ({ client }) => {
    testPermission = await Acl.permission().create({ slug: 'test-permission' })

    const response = await client.get('/api/v1/acl/permissions').loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      permissions: [
        {
          id: testPermission.id,
          slug: 'test-permission',
        },
      ],
    })
  })

  test('GET /api/v1/acl/admin/roles - should get current user roles', async ({ client }) => {
    testRole = await Acl.role().create({ slug: 'user-role' })
    await Acl.model(adminUser).assignRole('user-role')

    const response = await client.get('/api/v1/acl/admin/roles').loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Roles fetched successfully',
    })
  })

  test('GET /api/v1/acl/admins/roles - should get all admins with roles', async ({ client }) => {
    const response = await client.get('/api/v1/acl/admins/roles').loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Users with roles fetched successfully',
      usersWithRoles: [],
    })
  })

  test('GET /api/v1/acl/role/:id/permissions - should get permissions for role', async ({
    client,
  }) => {
    testRole = await Acl.role().create({ slug: 'test-role' })
    testPermission = await Acl.permission().create({ slug: 'test-permission' })
    await Acl.role(testRole).give('test-permission')

    const response = await client
      .get(`/api/v1/acl/role/${testRole.id}/permissions`)
      .loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Permissions fetched successfully',
    })
  })

  test('GET /api/v1/acl/role/:id/permissions - should return 404 for non-existent role', async ({
    client,
  }) => {
    const response = await client.get('/api/v1/acl/role/999/permissions').loginAs(adminUser)

    response.assertStatus(404)
  })

  test('GET /api/v1/acl/roles/permissions - should get all roles with permissions', async ({
    client,
  }) => {
    testRole = await Acl.role().create({ slug: 'test-role' })
    testPermission = await Acl.permission().create({ slug: 'test-permission' })
    await Acl.role(testRole).give('test-permission')

    const response = await client.get('/api/v1/acl/roles/permissions').loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Roles with permissions fetched successfully',
    })
  })

  test('GET /api/v1/acl/role/:id/users - should check if role is assigned to users', async ({
    client,
  }) => {
    testRole = await Acl.role().create({ slug: 'test-role' })

    const response = await client.get(`/api/v1/acl/role/${testRole.id}/users`).loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Role is not assigned to users',
      users: [],
    })
  })

  test('POST /api/v1/acl/roles - should create a new role', async ({ client }) => {
    const response = await client.post('/api/v1/acl/roles').loginAs(adminUser).json({
      slug: 'new-test-role',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Role created successfully',
      role: {
        slug: 'new-test-role',
      },
    })
  })

  test('POST /api/v1/acl/roles - should return 400 for duplicate role', async ({ client }) => {
    await Acl.role().create({ slug: 'duplicate-role' })

    const response = await client.post('/api/v1/acl/roles').loginAs(adminUser).json({
      slug: 'duplicate-role',
    })

    response.assertStatus(400)
  })

  test('POST /api/v1/acl/roles - should return 400 for empty slug', async ({ client }) => {
    const response = await client.post('/api/v1/acl/roles').loginAs(adminUser).json({
      slug: '',
    })

    response.assertStatus(400)
  })

  test('POST /api/v1/acl/permissions - should create a new permission', async ({ client }) => {
    const response = await client.post('/api/v1/acl/permissions').loginAs(adminUser).json({
      slug: 'new-test-permission',
    })

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Permission created successfully',
      permission: {
        slug: 'new-test-permission',
      },
    })
  })

  test('POST /api/v1/acl/admins/roles - should assign roles to user', async ({ client }) => {
    const role1 = await Acl.role().create({ slug: 'role-1' })
    const role2 = await Acl.role().create({ slug: 'role-2' })

    const response = await client
      .post('/api/v1/acl/admins/roles')
      .loginAs(adminUser)
      .json({
        user_id: authenticatedUser.id,
        roles: [role1.id, role2.id],
      })

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Roles assigned successfully',
      roles_not_found: [],
    })
  })

  test('POST /api/v1/acl/admins/roles - should return 404 for non-existent user', async ({
    client,
  }) => {
    const response = await client
      .post('/api/v1/acl/admins/roles')
      .loginAs(adminUser)
      .json({
        user_id: 999,
        roles: [1],
      })

    response.assertStatus(404)
  })

  test('DELETE /api/v1/acl/admins/roles - should revoke roles from user', async ({ client }) => {
    const role1 = await Acl.role().create({ slug: 'revoke-role-1' })
    await Acl.model(authenticatedUser).assignRole('revoke-role-1')

    const response = await client
      .delete('/api/v1/acl/admins/roles')
      .loginAs(adminUser)
      .json({
        user_id: authenticatedUser.id,
        roles: [role1.id],
      })

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Roles revoked successfully',
      roles_not_found: [],
    })
  })

  test('POST /api/v1/acl/roles/permissions - should create role with permissions', async ({
    client,
  }) => {
    const perm1 = await Acl.permission().create({ slug: 'perm-1' })
    const perm2 = await Acl.permission().create({ slug: 'perm-2' })

    const response = await client
      .post('/api/v1/acl/roles/permissions')
      .loginAs(adminUser)
      .json({
        role: 'role-with-permissions',
        permissions: [perm1.id, perm2.id],
      })

    response.assertStatus(201)
    response.assertBodyContains({
      message: 'Permissions assigned successfully',
      role: {
        slug: 'role-with-permissions',
      },
      permissions_not_found: [],
    })
  })

  test('POST /api/v1/acl/roles/permissions - should return 400 for duplicate role', async ({
    client,
  }) => {
    await Acl.role().create({ slug: 'existing-role' })

    const response = await client
      .post('/api/v1/acl/roles/permissions')
      .loginAs(adminUser)
      .json({
        role: 'existing-role',
        permissions: [1],
      })

    response.assertStatus(400)
  })

  test('POST /api/v1/acl/roles/permissions - should return 400 for empty permissions', async ({
    client,
  }) => {
    const response = await client.post('/api/v1/acl/roles/permissions').loginAs(adminUser).json({
      role: 'new-role',
      permissions: [],
    })

    response.assertStatus(400)
  })

  test('PUT /api/v1/acl/roles/:id/permissions - should update role with permissions', async ({
    client,
  }) => {
    testRole = await Acl.role().create({ slug: 'update-role' })
    const perm1 = await Acl.permission().create({ slug: 'update-perm-1' })
    const perm2 = await Acl.permission().create({ slug: 'update-perm-2' })

    const response = await client
      .put(`/api/v1/acl/roles/${testRole.id}/permissions`)
      .loginAs(adminUser)
      .json({
        role: 'updated-role',
        permissions: [perm1.id, perm2.id],
      })

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Role updated successfully',
      permissions_not_found: [],
    })
  })

  test('PUT /api/v1/acl/roles/:id/permissions - should return 404 for non-existent role', async ({
    client,
  }) => {
    const response = await client
      .put('/api/v1/acl/roles/999/permissions')
      .loginAs(adminUser)
      .json({
        role: 'non-existent',
        permissions: [1],
      })

    response.assertStatus(404)
  })

  test('DELETE /api/v1/acl/roles/:id - should delete role', async ({ client }) => {
    testRole = await Acl.role().create({ slug: 'delete-role' })

    const response = await client.delete(`/api/v1/acl/roles/${testRole.id}`).loginAs(adminUser)

    response.assertStatus(200)
    response.assertBodyContains({
      message: 'Role deleted successfully',
    })
  })

  test('DELETE /api/v1/acl/roles/:id - should return 404 for non-existent role', async ({
    client,
  }) => {
    const response = await client.delete('/api/v1/acl/roles/999').loginAs(adminUser)

    response.assertStatus(404)
  })

  test('should return 401 for unauthenticated requests', async ({ client }) => {
    const response = await client.get('/api/v1/acl/roles')

    response.assertStatus(401)
  })

  test('POST /api/v1/acl/roles - should validate required fields', async ({ client }) => {
    const response = await client.post('/api/v1/acl/roles').loginAs(adminUser).json({})

    response.assertStatus(422)
  })

  test('POST /api/v1/acl/permissions - should validate required fields', async ({ client }) => {
    const response = await client.post('/api/v1/acl/permissions').loginAs(adminUser).json({})

    response.assertStatus(422)
  })

  test('POST /api/v1/acl/admins/roles - should validate user_id and roles', async ({ client }) => {
    const response = await client.post('/api/v1/acl/admins/roles').loginAs(adminUser).json({
      user_id: 'invalid',
      roles: 'invalid',
    })

    response.assertStatus(422)
  })

  test('POST /api/v1/acl/roles/permissions - should validate role and permissions', async ({
    client,
  }) => {
    const response = await client.post('/api/v1/acl/roles/permissions').loginAs(adminUser).json({
      role: '',
      permissions: 'invalid',
    })

    response.assertStatus(422)
  })
})
