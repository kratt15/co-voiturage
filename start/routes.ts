/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
//controllers
const roleAndPermission = () => import('#controllers/roles_and_permissions_controller')


router.get('/', async () => {
  return {
    hello: 'world',
  }
})


router.group(() => {
   // Roles and permissions routes
   router.group(() => {
    // get all roles
    router.get('/roles', [roleAndPermission,'getRoles']).as('acl.roles')
    // get all permissions
    router.get('/permissions', [roleAndPermission,'getPermission']).as('acl.permissions')
    // get all roles for admin
    router.get('/admin/roles', [roleAndPermission,'allRoleUser']).as('acl.admin.roles')
    // get all admins with their roles
    router.get('/admins/roles', [roleAndPermission,'allAdminWithRoles']).as('acl.admins.roles')
    // get all permissions for role
    router.get('/role/:id/permissions', [roleAndPermission,'getPermissionsForRole']).as('acl.role.permissions')
    // get all roles with their permissions
    router.get('/roles/permissions', [roleAndPermission,'getAllRolesWithPermissions']).as('acl.roles.permissions')
    // get if role is assigned to user
    router.get('/role/:id/users', [roleAndPermission,'getRoleIslinkedWithUsers']).as('acl.role.users')
    // create a role
    router.post('/roles', [roleAndPermission,'createRole']).as('acl.roles.create')
    // create a permission
    router.post('/permissions', [roleAndPermission,'createPermission']).as('acl.permissions.create')
    // assign a role to a admins
    router.post('/admins/roles', [roleAndPermission,'assignRolesToUser']).as('acl.admins.roles.create')
    // revoke a role from a admins
    router.delete('/admins/roles', [roleAndPermission,'revokeRoleForUser']).as('acl.admins.roles.revoke')
    // create a role with permissions
    router.post('/roles/permissions', [roleAndPermission,'assignPermissions']).as('acl.roles.permissions.create')
    // modify a role with her permissions
    router.put('/roles/:id/permissions', [roleAndPermission,'modifyAssignPermissions']).as('acl.roles.permissions.modify')
    // delete a role with her permissions
    router.delete('/roles/:id', [roleAndPermission,'deleteAssignPermissions']).as('acl.roles.permissions.delete')
  }).prefix('/acl').use([middleware.auth()])

  // Auth routes

}).prefix('/api/v1')
