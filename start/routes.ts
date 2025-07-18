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
const authController = () => import('#controllers/auth/auth_controller')
const vehicleController = () => import('#controllers/vehicles_controller')
const userController = () => import('#controllers/users_controller')
const tripController = () => import('#controllers/trips_controller')
const bookingController = () => import('#controllers/bookings_controller')
router.get('/', async () => {
  return {
    hello: 'world',
  }
})

router
  .group(() => {
    // Roles and permissions routes
    router
      .group(() => {
        // get all roles
        router.get('/roles', [roleAndPermission, 'getRoles']).as('acl.roles')
        // get all permissions
        router.get('/permissions', [roleAndPermission, 'getPermission']).as('acl.permissions')
        // get all roles for admin
        router.get('/admin/roles', [roleAndPermission, 'allRoleUser']).as('acl.admin.roles')
        // get all admins with their roles
        router.get('/admins/roles', [roleAndPermission, 'allAdminWithRoles']).as('acl.admins.roles')
        // get all permissions for role
        router
          .get('/role/:id/permissions', [roleAndPermission, 'getPermissionsForRole'])
          .as('acl.role.permissions')
        // get all roles with their permissions
        router
          .get('/roles/permissions', [roleAndPermission, 'getAllRolesWithPermissions'])
          .as('acl.roles.permissions')
        // get if a role is assigned to user
        router
          .get('/role/:id/users', [roleAndPermission, 'getRoleIslinkedWithUsers'])
          .as('acl.role.users')
        // create a role
        router.post('/roles', [roleAndPermission, 'createRole']).as('acl.roles.create')
        // create a permission
        router
          .post('/permissions', [roleAndPermission, 'createPermission'])
          .as('acl.permissions.create')
        // assign a role to  admins
        router
          .post('/admins/roles', [roleAndPermission, 'assignRolesToUser'])
          .as('acl.admins.roles.create')
        // revoke a role from admins
        router
          .delete('/admins/roles', [roleAndPermission, 'revokeRoleForUser'])
          .as('acl.admins.roles.revoke')
        // create a role with permissions
        router
          .post('/roles/permissions', [roleAndPermission, 'assignPermissions'])
          .as('acl.roles.permissions.create')
        // modify a role with her permissions
        router
          .put('/roles/:id/permissions', [roleAndPermission, 'modifyAssignPermissions'])
          .as('acl.roles.permissions.modify')
        // delete a role with her permissions
        router
          .delete('/roles/:id', [roleAndPermission, 'deleteAssignPermissions'])
          .as('acl.roles.permissions.delete')
      })
      .prefix('/acl')
      .use([middleware.auth()])

    // Auth routes
    router
      .group(() => {
        // register a user
        router.post('/register', [authController, 'register']).as('auth.register')
        // login a user
        router.post('/login', [authController, 'login']).as('auth.login')
        // logout a user
        router
          .post('/logout', [authController, 'logout'])
          .as('auth.logout')
          .use([middleware.auth()])
        // get current user
        router
          .get('/current-user', [authController, 'currentUser'])
          .as('auth.current.user')
          .use([middleware.auth()])
        // resend email
        router.post('/resend-email', [authController, 'resendEmail']).as('auth.resend.email')
        // verify email
        router.get('/verify-email', [authController, 'verifyEmail']).as('auth.verify.email')
        // forgot password
        router
          .post('/forgot-password', [authController, 'forgotPassword'])
          .as('auth.forgot.password')
        // reset password
        router.post('/reset-password', [authController, 'resetPassword']).as('auth.reset.password')
      })
      .prefix('/auth')

    // User routes
    router
      .group(() => {
        // get a user
        router.get('/:uuid', [userController, 'getUser']).as('user.show')
        // get user profile
        router.get('/profile', [userController, 'profile']).as('user.profile')
        // update user profile
        router.put('/profile', [userController, 'updateProfile']).as('user.update.profile')
        // update user password
        router.put('/password', [userController, 'updatePassword']).as('user.update.password')
        // delete user account
        router.delete('/', [userController, 'deleteAccount']).as('user.delete')
        // get user trips
        router.get('/trips', [userController, 'userTrips']).as('user.trips')
      })
      .prefix('/users')
      .use([middleware.auth()])

    // Vehicle routes
    router
      .group(() => {
        // get all vehicles
        router.get('/', [vehicleController, 'getAllVehicles']).as('vehicle.all')
        // get a vehicle
        router.get('/:uuid', [vehicleController, 'showVehicle']).as('vehicle.show')
        // create a vehicle
        router.post('/', [vehicleController, 'createVehicle']).as('vehicle.create')
        // update a vehicle
        router.put('/:uuid', [vehicleController, 'updateVehicle']).as('vehicle.update')
        // delete a vehicle
        router.delete('/:uuid', [vehicleController, 'deleteVehicle']).as('vehicle.delete')
      })
      .prefix('/vehicles')
      .use([middleware.auth()])

    // Trip routes
    router
      .group(() => {
        // get all trips
        router.get('/', [tripController, 'getAllTrips']).as('trip.all')
        // get a trip
        router.get('/:uuid', [tripController, 'showTrip']).as('trip.show')
        // create a trip
        router.post('/', [tripController, 'createTrip']).as('trip.create')
        // update a trip
        router.put('/:uuid', [tripController, 'updateTrip']).as('trip.update')

        // test geocoding
        router.post('/test-geocoding', [tripController, 'testGeocoding']).as('trip.test.geocoding')
        // test reverse geocoding
        router
          .post('/test-reverse-geocoding', [tripController, 'testReverseGeocoding'])
          .as('trip.test.reverse.geocoding')
        // test matrix
        router.post('/test-matrix', [tripController, 'testMatrix']).as('trip.test.matrix')
        // test symmetric matrix
        router
          .post('/test-symmetric-matrix', [tripController, 'testSymmetricMatrix'])
          .as('trip.test.symmetric.matrix')
        // test one to many matrix
        router
          .post('/test-one-to-many-matrix', [tripController, 'testOneToManyMatrix'])
          .as('trip.test.one.to.many.matrix')
        // test many to one matrix
        router
          .post('/test-many-to-one-matrix', [tripController, 'testManyToOneMatrix'])
          .as('trip.test.many.to.one.matrix')
        // test traffic matrix
        router
          .post('/test-traffic-matrix', [tripController, 'testTrafficMatrix'])
          .as('trip.test.traffic.matrix')
        // test curbside matrix
        router
          .post('/test-curbside-matrix', [tripController, 'testCurbsideMatrix'])
          .as('trip.test.curbside.matrix')
        // test fallback matrix
        router
          .post('/test-fallback-matrix', [tripController, 'testFallbackMatrix'])
          .as('trip.test.fallback.matrix')
        // test nearest destination
        router
          .post('/test-nearest-destination', [tripController, 'testNearestDestination'])
          .as('trip.test.nearest.destination')
      })
      .prefix('/trips')
      .use([middleware.auth()])

    // Booking routes
    router
      .group(() => {
        // get all bookings for the current user
        router.get('/', [bookingController, 'getMyBookings']).as('booking.my')
        // get a specific booking
        router.get('/:uuid', [bookingController, 'getBooking']).as('booking.show')
        // create a booking for a trip
        router.post('/trips/:tripUuid', [bookingController, 'createBooking']).as('booking.create')
        // update a booking
        router.put('/:uuid', [bookingController, 'updateBooking']).as('booking.update')
        // cancel a booking
        router.delete('/:uuid', [bookingController, 'cancelBooking']).as('booking.cancel')

        // conducteur specific routes
        // get all bookings for a trip (driver only)
        router
          .get('/trips/:uuid/bookings', [bookingController, 'getTripBookings'])
          .as('booking.trip')
        // confirm a booking (driver only)
        router.put('/:uuid/confirm', [bookingController, 'confirmBooking']).as('booking.confirm')
        // reject a booking (driver only)
        router.put('/:uuid/reject', [bookingController, 'rejectBooking']).as('booking.reject')
      })
      .prefix('/bookings')
      .use([middleware.auth()])
  })
  .prefix('/api/v1')
