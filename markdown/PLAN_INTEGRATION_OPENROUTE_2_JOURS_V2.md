# 🚀 PLAN D'INTÉGRATION OPENROUTESERVICE & FINALISATION API V2

## Sprint Intensif 2 Jours - Analyse Complète et Réaliste

---

## 📊 ANALYSE DÉTAILLÉE DE L'ÉTAT RÉEL DU PROJET

### ✅ **CE QUI EST VRAIMENT FAIT**

#### 1. **Système d'Authentification** ✅ (100%)

**Fichier**: `app/controllers/auth/auth_controller.ts`

- ✅ `POST /api/v1/auth/register` - FAIT
- ✅ `POST /api/v1/auth/login` - FAIT
- ✅ `POST /api/v1/auth/logout` - FAIT (avec middleware auth)
- ✅ `GET /api/v1/auth/current-user` - FAIT (avec middleware auth)
- ✅ `POST /api/v1/auth/resend-email` - FAIT
- ✅ `GET /api/v1/auth/verify-email` - FAIT
- ✅ `POST /api/v1/auth/forgot-password` - FAIT
- ✅ `POST /api/v1/auth/reset-password` - FAIT

**Validators**: ✅ Tous créés dans `app/validators/auth/user.ts`

#### 2. **Système ACL (Rôles/Permissions)** ✅ (100%)

**Fichier**: `app/controllers/roles_and_permissions_controller.ts`

- 14 endpoints complets et testés
- Service ACL fonctionnel
- Tests complets (426 lignes)

#### 3. **Gestion des Véhicules** ✅ (100%)

**Fichier**: `app/controllers/vehicles_controller.ts`

- ✅ `GET /api/v1/vehicles` - getAllVehicles
- ✅ `GET /api/v1/vehicles/:uuid` - showVehicle
- ✅ `POST /api/v1/vehicles` - createVehicle
- ✅ `PUT /api/v1/vehicles/:uuid` - updateVehicle
- ✅ `DELETE /api/v1/vehicles/:uuid` - deleteVehicle

**Validators**: ✅ `createVehicleValidator` et `updateVehicleValidator`

### ⚠️ **CE QUI EST PARTIELLEMENT FAIT**

#### 1. **Gestion des Trajets** ⚠️ (20%)

**Fichier**: `app/controllers/trips_controller.ts` (INCOMPLET!)

- ✅ `getAllTrips()` - Méthode implémentée
- ✅ `showTrip()` - Méthode implémentée
- ❌ PAS DE ROUTES DÉFINIES dans `routes.ts` !
- ❌ `createTrip()` - MANQUANT
- ❌ `updateTrip()` - MANQUANT
- ❌ `deleteTrip()` - MANQUANT
- ❌ `searchTrips()` - MANQUANT

**Validators**: ✅ EXISTENT (`createTripValidator`, `updateTripValidator`)

#### 2. **Services** ⚠️

- ✅ `ACLService` - Complet (336 lignes)
- ✅ `MailService` - Complet (94 lignes)
- ❌ `AuthService` - VIDE (3 lignes)
- ❌ `RouteService` - VIDE (10 lignes) MAIS variables env définies !

### ❌ **CE QUI N'EXISTE PAS DU TOUT**

1. **BookingsController** - N'EXISTE PAS
2. **UsersController** - N'EXISTE PAS (profils)
3. **PaymentsController** - N'EXISTE PAS
4. **ReviewsController** - N'EXISTE PAS
5. **NotificationsController** - N'EXISTE PAS
6. **MessagesController** - N'EXISTE PAS

### 🔑 **DÉCOUVERTE IMPORTANTE**

Dans `start/env.ts`, il y a DÉJÀ des variables pour un service de routage :

```typescript
ROUTE_SERVICE_URL: Env.schema.string(),
ROUTE_SERVICE_API_KEY: Env.schema.string(),
```

⚠️ **PROBLÈME** : L'app ne démarre pas sans ces variables !

---

## 🎯 **OBJECTIFS RÉALISTES DU SPRINT 2 JOURS**

### **Priorité 1 : Faire Fonctionner l'Application**

1. Configurer les variables d'environnement manquantes
2. Compléter RouteService avec OpenRouteService
3. Finir TripsController et ajouter ses routes

### **Priorité 2 : API Minimale Fonctionnelle**

1. Système de réservation (BookingsController)
2. Profils utilisateurs (UsersController)
3. Tests de base

### **Hors Scope (pour plus tard)**

- Paiements
- Évaluations
- Messagerie
- Notifications
- Upload images

---

## 📅 **JOUR 1 : Réparer et Compléter l'Existant**

### 🌅 **MATIN (4h) : 8h00 - 12h00**

#### **08:00 - 08:30 | Fix Environment & Setup** (30min)

**1. Créer un fichier `.env.example`**

```bash
# Application
NODE_ENV=development
PORT=3333
APP_KEY=your_app_key_here
HOST=0.0.0.0
LOG_LEVEL=info

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_DATABASE=covoiturage

# Mail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# Route Service (OpenRouteService)
ROUTE_SERVICE_URL=https://api.openrouteservice.org/v2
ROUTE_SERVICE_API_KEY=your_openroute_api_key
```

**2. Tester que l'app démarre**

```bash
cp .env.example .env
# Remplir avec vos vraies valeurs
pnpm dev
```

#### **08:30 - 10:00 | Implémenter RouteService** (1.5h)

**Compléter `app/services/route_service.ts`** :

```typescript
import env from '#start/env'
import { Exception } from '@adonisjs/core/exceptions'

interface Coordinates {
  latitude: number
  longitude: number
}

interface RouteOptions {
  profile?: 'driving-car' | 'driving-hgv' | 'cycling-regular'
  avoidFeatures?: string[]
}

export class RouteService {
  private baseUrl = env.get('ROUTE_SERVICE_URL')
  private apiKey = env.get('ROUTE_SERVICE_API_KEY')

  /**
   * Calculer un itinéraire entre deux points
   */
  async getDirections(start: Coordinates, end: Coordinates, options: RouteOptions = {}) {
    const profile = options.profile || 'driving-car'
    const url = `${this.baseUrl}/directions/${profile}`

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coordinates: [
            [start.longitude, start.latitude],
            [end.longitude, end.latitude],
          ],
          ...(options.avoidFeatures && { avoid_features: options.avoidFeatures }),
        }),
      })

      if (!response.ok) {
        throw new Exception(`OpenRoute API Error: ${response.status}`)
      }

      const data = await response.json()
      const route = data.routes[0]

      return {
        distance: Math.round((route.summary.distance / 1000) * 100) / 100, // km
        duration: Math.round(route.summary.duration / 60), // minutes
        geometry: route.geometry,
      }
    } catch (error) {
      throw new Exception(`Failed to calculate route: ${error.message}`)
    }
  }

  /**
   * Calculer une matrice de distances/temps
   */
  async getMatrix(locations: Coordinates[]) {
    const url = `${this.baseUrl}/matrix/driving-car`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        locations: locations.map((loc) => [loc.longitude, loc.latitude]),
        metrics: ['distance', 'duration'],
      }),
    })

    const data = await response.json()

    return {
      distances: data.distances.map((row) => row.map((d) => Math.round((d / 1000) * 100) / 100)),
      durations: data.durations.map((row) => row.map((d) => Math.round(d / 60))),
    }
  }

  /**
   * Parser des coordonnées string "lat,lng"
   */
  parseCoordinates(coordString: string): Coordinates {
    const [lat, lng] = coordString.split(',').map(Number)
    if (isNaN(lat) || isNaN(lng)) {
      throw new Exception('Invalid coordinates format')
    }
    return { latitude: lat, longitude: lng }
  }
}
```

#### **10:00 - 12:00 | Compléter TripsController + Routes** (2h)

**1. Compléter `app/controllers/trips_controller.ts`**

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Trip from '#models/trip'
import { createTripValidator, updateTripValidator } from '#validators/trip'
import { RouteService } from '#services/route_service'
import db from '@adonisjs/lucid/services/db'

export default class TripsController {
  private routeService = new RouteService()

  // Méthodes existantes...

  async create({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(createTripValidator)

      // Retirer driverId du body (on utilise l'user connecté)
      const { driverId, ...tripData } = data

      // Calculer distance et durée avec OpenRouteService
      const start = this.routeService.parseCoordinates(tripData.departureCoordinates)
      const end = this.routeService.parseCoordinates(tripData.arrivalCoordinates)

      const route = await this.routeService.getDirections(start, end)

      const result = await db.transaction(async (trx) => {
        const trip = await Trip.create(
          {
            ...tripData,
            driverId: user.id,
            estimatedDuration: route.duration,
            distanceKm: route.distance,
            availableSeats: tripData.totalSeats,
          },
          { client: trx }
        )

        await trip.load('driver')
        await trip.load('vehicle')

        return trip
      })

      return response.created(result)
    } catch (error) {
      return response.status(500).json({
        message: 'Error creating trip',
        error: error.message,
      })
    }
  }

  async update({ request, response, params, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { uuid } = params
      const data = await request.validateUsing(updateTripValidator)

      const trip = await Trip.findByOrFail('uuid', uuid)

      // Vérifier que c'est bien le conducteur
      if (trip.driverId !== user.id) {
        return response.forbidden({ message: 'Not authorized' })
      }

      // Recalculer si les coordonnées changent
      if (data.departureCoordinates || data.arrivalCoordinates) {
        const start = this.routeService.parseCoordinates(
          data.departureCoordinates || trip.departureCoordinates
        )
        const end = this.routeService.parseCoordinates(
          data.arrivalCoordinates || trip.arrivalCoordinates
        )

        const route = await this.routeService.getDirections(start, end)
        data.estimatedDuration = route.duration
        data.distanceKm = route.distance
      }

      trip.merge(data)
      await trip.save()

      await trip.load('driver')
      await trip.load('vehicle')

      return response.ok(trip)
    } catch (error) {
      return response.status(500).json({
        message: 'Error updating trip',
        error: error.message,
      })
    }
  }

  async delete({ response, params, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { uuid } = params

      const trip = await Trip.findByOrFail('uuid', uuid)

      if (trip.driverId !== user.id) {
        return response.forbidden({ message: 'Not authorized' })
      }

      await trip.delete()

      return response.ok({ message: 'Trip deleted successfully' })
    } catch (error) {
      return response.status(500).json({
        message: 'Error deleting trip',
        error: error.message,
      })
    }
  }

  async search({ request, response }: HttpContext) {
    try {
      const {
        departureCity,
        arrivalCity,
        departureDate,
        seats = 1,
        page = 1,
        limit = 20,
      } = request.qs()

      const query = Trip.query()
        .where('status', 'PUBLISHED')
        .where('availableSeats', '>=', seats)
        .preload('driver')
        .preload('vehicle')

      if (departureCity) {
        query.where('departureCity', 'ILIKE', `%${departureCity}%`)
      }

      if (arrivalCity) {
        query.where('arrivalCity', 'ILIKE', `%${arrivalCity}%`)
      }

      if (departureDate) {
        query.where('departureDate', '>=', departureDate)
      }

      const trips = await query.orderBy('departureDate', 'asc').paginate(page, limit)

      return response.ok(trips)
    } catch (error) {
      return response.status(500).json({
        message: 'Error searching trips',
        error: error.message,
      })
    }
  }
}
```

**2. Ajouter les routes dans `start/routes.ts`**

```typescript
// Ajouter après les imports
const tripsController = () => import('#controllers/trips_controller')

// Ajouter dans le groupe API après les routes vehicles
// Trip routes
router
  .group(() => {
    // get all trips
    router.get('/', [tripsController, 'getAllTrips']).as('trips.all')
    // search trips
    router.post('/search', [tripsController, 'search']).as('trips.search')
    // get a trip
    router.get('/:uuid', [tripsController, 'showTrip']).as('trips.show')
    // create a trip
    router.post('/', [tripsController, 'create']).as('trips.create')
    // update a trip
    router.put('/:uuid', [tripsController, 'update']).as('trips.update')
    // delete a trip
    router.delete('/:uuid', [tripsController, 'delete']).as('trips.delete')
  })
  .prefix('/trips')
  .use([middleware.auth()]) // Toutes les routes trips nécessitent auth
```

### 🌇 **APRÈS-MIDI (4h) : 13h00 - 17h00**

#### **13:00 - 15:00 | BookingsController Complet** (2h)

**1. Créer le contrôleur**

```bash
node ace make:controller bookings
```

**2. Implémenter `app/controllers/bookings_controller.ts`**

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import Booking from '#models/booking'
import Trip from '#models/trip'
import db from '@adonisjs/lucid/services/db'
import vine from '@vinejs/vine'

// Validator temporaire (à déplacer dans validators/booking.ts)
const createBookingValidator = vine.compile(
  vine.object({
    numberOfSeats: vine.number().min(1).max(8),
    passengerComment: vine.string().optional(),
  })
)

export default class BookingsController {
  async create({ request, response, params, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { uuid: tripUuid } = params
      const data = await request.validateUsing(createBookingValidator)

      const result = await db.transaction(async (trx) => {
        const trip = await Trip.query().where('uuid', tripUuid).useTransaction(trx).firstOrFail()

        // Vérifications
        if (trip.status !== 'PUBLISHED') {
          throw new Error('Trip is not available for booking')
        }

        if (trip.driverId === user.id) {
          throw new Error('You cannot book your own trip')
        }

        if (trip.availableSeats < data.numberOfSeats) {
          throw new Error('Not enough available seats')
        }

        // Vérifier si pas déjà réservé
        const existingBooking = await Booking.query()
          .where('tripId', trip.id)
          .where('passengerId', user.id)
          .whereNotIn('status', ['CANCELLED'])
          .useTransaction(trx)
          .first()

        if (existingBooking) {
          throw new Error('You already have a booking for this trip')
        }

        // Créer la réservation
        const booking = await Booking.create(
          {
            tripId: trip.id,
            passengerId: user.id,
            numberOfSeats: data.numberOfSeats,
            totalAmount: trip.pricePerSeat * data.numberOfSeats,
            status: 'PENDING',
            passengerComment: data.passengerComment,
            bookingDate: DateTime.now(),
          },
          { client: trx }
        )

        // Mettre à jour les places disponibles
        trip.availableSeats -= data.numberOfSeats
        if (trip.availableSeats === 0) {
          trip.status = 'FULL'
        }
        await trip.save()

        await booking.load('trip')
        await booking.load('passenger')

        return booking
      })

      return response.created(result)
    } catch (error) {
      return response.status(400).json({
        message: 'Booking failed',
        error: error.message,
      })
    }
  }

  async index({ response, auth, request }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { status, page = 1, limit = 20 } = request.qs()

      const query = Booking.query()
        .where('passengerId', user.id)
        .preload('trip', (q) => {
          q.preload('driver')
          q.preload('vehicle')
        })

      if (status) {
        query.where('status', status)
      }

      const bookings = await query.orderBy('createdAt', 'desc').paginate(page, limit)

      return response.ok(bookings)
    } catch (error) {
      return response.status(500).json({
        message: 'Error fetching bookings',
        error: error.message,
      })
    }
  }

  async show({ response, params, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { uuid } = params

      const booking = await Booking.query()
        .where('uuid', uuid)
        .where('passengerId', user.id)
        .preload('trip', (q) => {
          q.preload('driver')
          q.preload('vehicle')
        })
        .firstOrFail()

      return response.ok(booking)
    } catch (error) {
      return response.status(404).json({
        message: 'Booking not found',
      })
    }
  }

  async cancel({ response, params, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const { uuid } = params

      const result = await db.transaction(async (trx) => {
        const booking = await Booking.query()
          .where('uuid', uuid)
          .where('passengerId', user.id)
          .useTransaction(trx)
          .firstOrFail()

        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) {
          throw new Error('This booking cannot be cancelled')
        }

        booking.status = 'CANCELLED'
        await booking.save()

        // Restaurer les places
        const trip = await Trip.findOrFail(booking.tripId, { client: trx })
        trip.availableSeats += booking.numberOfSeats
        if (trip.status === 'FULL') {
          trip.status = 'PUBLISHED'
        }
        await trip.save()

        return booking
      })

      return response.ok({
        message: 'Booking cancelled successfully',
        booking: result,
      })
    } catch (error) {
      return response.status(400).json({
        message: 'Cancellation failed',
        error: error.message,
      })
    }
  }
}
```

**3. Ajouter les routes**

```typescript
// Ajouter après l'import des controllers
const bookingsController = () => import('#controllers/bookings_controller')

// Ajouter après les routes trips
// Booking routes
router
  .group(() => {
    // create booking for a trip
    router.post('/trips/:uuid/bookings', [bookingsController, 'create']).as('bookings.create')
    // get all bookings
    router.get('/bookings', [bookingsController, 'index']).as('bookings.index')
    // get a booking
    router.get('/bookings/:uuid', [bookingsController, 'show']).as('bookings.show')
    // cancel a booking
    router.delete('/bookings/:uuid', [bookingsController, 'cancel']).as('bookings.cancel')
  })
  .use([middleware.auth()])
```

#### **15:00 - 16:00 | UsersController (Profils)** (1h)

**1. Créer le contrôleur**

```bash
node ace make:controller users
```

**2. Implémenter `app/controllers/users_controller.ts`**

```typescript
import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import Trip from '#models/trip'
import vine from '@vinejs/vine'

// Validator temporaire
const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().optional(),
    lastName: vine.string().optional(),
    phone: vine.string().optional(),
    birthDate: vine.date().optional(),
  })
)

export default class UsersController {
  async profile({ response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()

      await user.load('vehicles')

      // Stats du profil
      const stats = {
        tripsAsDriver: await Trip.query().where('driverId', user.id).count('* as total'),
        tripsAsPassenger: await Booking.query()
          .where('passengerId', user.id)
          .whereIn('status', ['CONFIRMED', 'COMPLETED'])
          .count('* as total'),
      }

      return response.ok({
        user,
        stats,
      })
    } catch (error) {
      return response.status(500).json({
        message: 'Error fetching profile',
        error: error.message,
      })
    }
  }

  async updateProfile({ request, response, auth }: HttpContext) {
    try {
      const user = auth.getUserOrFail()
      const data = await request.validateUsing(updateProfileValidator)

      user.merge(data)
      await user.save()

      return response.ok(user)
    } catch (error) {
      return response.status(400).json({
        message: 'Update failed',
        error: error.message,
      })
    }
  }

  async show({ response, params }: HttpContext) {
    try {
      const { uuid } = params

      const user = await User.query()
        .where('uuid', uuid)
        .select([
          'uuid',
          'firstName',
          'lastName',
          'globalRating',
          'numberOfTrips',
          'createdAt',
          'isVerified',
        ])
        .firstOrFail()

      return response.ok(user)
    } catch (error) {
      return response.status(404).json({
        message: 'User not found',
      })
    }
  }

  async userTrips({ response, params, request }: HttpContext) {
    try {
      const { uuid } = params
      const { page = 1, limit = 20 } = request.qs()

      const user = await User.findByOrFail('uuid', uuid)

      const trips = await Trip.query()
        .where('driverId', user.id)
        .where('status', 'PUBLISHED')
        .preload('vehicle')
        .orderBy('departureDate', 'asc')
        .paginate(page, limit)

      return response.ok(trips)
    } catch (error) {
      return response.status(500).json({
        message: 'Error fetching trips',
        error: error.message,
      })
    }
  }
}
```

**3. Ajouter les routes**

```typescript
// Ajouter après l'import
const usersController = () => import('#controllers/users_controller')

// Ajouter après les routes bookings
// User routes
router
  .group(() => {
    // get current user profile
    router.get('/profile', [usersController, 'profile']).as('users.profile')
    // update profile
    router.put('/profile', [usersController, 'updateProfile']).as('users.updateProfile')
    // get public user profile
    router.get('/:uuid', [usersController, 'show']).as('users.show')
    // get user trips
    router.get('/:uuid/trips', [usersController, 'userTrips']).as('users.trips')
  })
  .prefix('/users')
  .use([middleware.auth()])
```

#### **16:00 - 17:00 | Tests & Vérification** (1h)

**1. Vérifier toutes les routes**

```bash
pnpm ace list:routes
```

**2. Tester avec HTTP client**
Créer `http-tests/trips.http`:

```http
### Variables
@baseUrl = http://localhost:3333/api/v1
@token = VOTRE_TOKEN

### 1. Créer un trajet
POST {{baseUrl}}/trips
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "departureCoordinates": "48.8566,2.3522",
  "departureCity": "Paris",
  "arrivalCoordinates": "45.7640,4.8357",
  "arrivalCity": "Lyon",
  "departureDate": "2024-02-15",
  "departureTime": "08:00",
  "pricePerSeat": 25,
  "totalSeats": 3,
  "status": "PUBLISHED",
  "vehicleId": 1,
  "petsAllowed": false,
  "luggageAllowed": true
}
```

---

## 📅 **JOUR 2 : Optimisation & Finalisation**

### 🌅 **MATIN (4h) : 8h00 - 12h00**

#### **08:00 - 10:00 | Service d'Optimisation** (2h)

**Créer `app/services/optimization_service.ts`**

```typescript
import env from '#start/env'
import { RouteService } from '#services/route_service'

interface Driver {
  id: string
  location: [number, number]
  capacity: number
  timeWindow?: [number, number]
}

interface Passenger {
  id: string
  pickup: [number, number]
  dropoff: [number, number]
  timeWindow?: [number, number]
}

export class OptimizationService {
  private apiKey = env.get('ROUTE_SERVICE_API_KEY')
  private baseUrl = 'https://api.openrouteservice.org'
  private routeService = new RouteService()

  /**
   * Optimiser un covoiturage avec plusieurs conducteurs et passagers
   */
  async optimizeGroupCarpool(drivers: Driver[], passengers: Passenger[]) {
    const requestBody = {
      vehicles: drivers.map((driver) => ({
        id: driver.id,
        start: driver.location,
        capacity: [driver.capacity],
        ...(driver.timeWindow && { time_window: driver.timeWindow }),
      })),

      jobs: [],
      shipments: passengers.map((passenger) => ({
        id: passenger.id,
        pickup: {
          location: passenger.pickup,
          service: 120, // 2 minutes
          ...(passenger.timeWindow && { time_windows: [passenger.timeWindow] }),
        },
        delivery: {
          location: passenger.dropoff,
          service: 60, // 1 minute
        },
        amount: [1],
      })),
    }

    const response = await fetch(`${this.baseUrl}/optimization`, {
      method: 'POST',
      headers: {
        'Authorization': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      throw new Error(`Optimization failed: ${response.status}`)
    }

    const result = await response.json()

    return this.formatOptimizationResult(result)
  }

  /**
   * Calculer le meilleur ordre d'arrêts pour un trajet
   */
  async optimizeMultiStopRoute(
    start: [number, number],
    end: [number, number],
    stops: Array<{ location: [number, number]; type: 'pickup' | 'dropoff' }>
  ) {
    // Utiliser la matrice pour optimiser l'ordre
    const allLocations = [start, ...stops.map((s) => s.location), end]
    const coordinates = allLocations.map((loc) => ({
      latitude: loc[1],
      longitude: loc[0],
    }))

    const matrix = await this.routeService.getMatrix(coordinates)

    // Algorithme simple d'optimisation (peut être amélioré)
    const optimizedOrder = this.calculateOptimalOrder(matrix, stops)

    return {
      totalDistance: optimizedOrder.totalDistance,
      totalDuration: optimizedOrder.totalDuration,
      orderedStops: optimizedOrder.stops,
    }
  }

  private formatOptimizationResult(apiResult: any) {
    return {
      totalCost: apiResult.cost,
      routes:
        apiResult.routes?.map((route: any) => ({
          vehicleId: route.vehicle,
          steps: route.steps,
          distance: Math.round((route.distance / 1000) * 100) / 100,
          duration: Math.round(route.duration / 60),
        })) || [],
      unassigned: apiResult.unassigned || [],
    }
  }

  private calculateOptimalOrder(matrix: any, stops: any[]) {
    // Implémentation simplifiée - à améliorer avec un vrai algorithme
    return {
      totalDistance: 0,
      totalDuration: 0,
      stops: stops,
    }
  }
}
```

#### **10:00 - 11:00 | Endpoint d'Optimisation** (1h)

**Ajouter dans TripsController**

```typescript
async optimizeGroup({ request, response }: HttpContext) {
  try {
    const optimizationService = new OptimizationService()
    const { drivers, passengers } = request.body()

    const result = await optimizationService.optimizeGroupCarpool(
      drivers,
      passengers
    )

    return response.ok(result)
  } catch (error) {
    return response.status(500).json({
      message: 'Optimization failed',
      error: error.message
    })
  }
}
```

#### **11:00 - 12:00 | Validators Manquants** (1h)

**1. Créer `app/validators/booking.ts`**

```typescript
import vine from '@vinejs/vine'

export const createBookingValidator = vine.compile(
  vine.object({
    numberOfSeats: vine.number().min(1).max(8),
    passengerComment: vine.string().trim().maxLength(500).optional(),
  })
)
```

**2. Créer `app/validators/user.ts`**

```typescript
import vine from '@vinejs/vine'

export const updateProfileValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2).maxLength(100).optional(),
    lastName: vine.string().trim().minLength(2).maxLength(100).optional(),
    phone: vine.string().trim().minLength(10).maxLength(15).optional(),
    birthDate: vine.date().optional(),
  })
)
```

### 🌇 **APRÈS-MIDI (4h) : 13h00 - 17h00**

#### **13:00 - 14:30 | Tests Fonctionnels** (1.5h)

**Créer `tests/functional/trips.spec.ts`**

```typescript
import { test } from '@japa/runner'
import { createAuthenticatedUser } from '#tests/helpers/auth_helper'

test.group('Trips', () => {
  test('should create a trip with auto-calculated distance', async ({ client, assert }) => {
    const { user, token } = await createAuthenticatedUser()

    // Créer un véhicule d'abord
    const vehicleResponse = await client.post('/api/v1/vehicles').bearerToken(token).json({
      brand: 'Peugeot',
      model: '308',
      color: 'Bleu',
      licensePlate: 'AB-123-CD',
      year: 2020,
      numberOfSeats: 4,
      fuelType: 'Diesel',
      hasAirConditioning: true,
      isVerified: true,
    })

    const vehicle = vehicleResponse.body()

    const response = await client.post('/api/v1/trips').bearerToken(token).json({
      departureCoordinates: '48.8566,2.3522', // Paris
      departureCity: 'Paris',
      arrivalCoordinates: '45.7640,4.8357', // Lyon
      arrivalCity: 'Lyon',
      departureDate: '2024-02-20',
      departureTime: '08:00',
      pricePerSeat: 30,
      totalSeats: 3,
      status: 'PUBLISHED',
      vehicleId: vehicle.id,
      petsAllowed: false,
      luggageAllowed: true,
    })

    response.assertStatus(201)
    assert.properties(response.body(), ['uuid', 'distanceKm', 'estimatedDuration'])
    assert.isAbove(response.body().distanceKm, 0)
    assert.isAbove(response.body().estimatedDuration, 0)
  })

  test('should search trips by city', async ({ client, assert }) => {
    const response = await client.post('/api/v1/trips/search').qs({
      departureCity: 'Paris',
      arrivalCity: 'Lyon',
      seats: 2,
    })

    response.assertStatus(200)
    assert.isArray(response.body().data)
  })
})
```

#### **14:30 - 15:30 | Documentation API** (1h)

**Créer `README.api.md`**

```markdown
# API Documentation - Covoiturage v1.0

## Base URL
```

http://localhost:3333/api/v1

```

## Authentication
Toutes les routes (sauf auth/register et auth/login) nécessitent un Bearer Token.

```

Authorization: Bearer YOUR_TOKEN

````

## Endpoints

### Authentication

#### Register
```http
POST /auth/register
```

Body:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "passwordConfirmation": "password123",
  "phone": "+33612345678",
  "birthDate": "1990-01-01"
}
```

#### Login

```http
POST /auth/login
```

Body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Trips

#### Create Trip

```http
POST /trips
Authorization: Bearer TOKEN
```

Body:

```json
{
  "departureCoordinates": "48.8566,2.3522",
  "departureCity": "Paris",
  "arrivalCoordinates": "45.7640,4.8357",
  "arrivalCity": "Lyon",
  "departureDate": "2024-02-20",
  "departureTime": "08:00",
  "pricePerSeat": 30,
  "totalSeats": 3,
  "status": "PUBLISHED",
  "vehicleId": 1,
  "petsAllowed": false,
  "luggageAllowed": true
}
```

Response:

```json
{
  "uuid": "123e4567-e89b-12d3-a456-426614174000",
  "departureCity": "Paris",
  "arrivalCity": "Lyon",
  "distanceKm": 465.23,
  "estimatedDuration": 275,
  "pricePerSeat": 30,
  "availableSeats": 3,
  "driver": {...},
  "vehicle": {...}
}
```

[... Continuer avec tous les endpoints ...]

````

#### **15:30 - 17:00 | Optimisations & Tests Finaux** (1.5h)

**1. Ajouter des index dans les migrations**

```typescript
// Dans trips migration
table.index(['departureCity', 'arrivalCity', 'departureDate'])
table.index(['status', 'availableSeats'])

// Dans bookings migration
table.index(['tripId', 'passengerId'])
table.index(['status'])
```

**2. Tests manuels complets**

- Créer un utilisateur
- Se connecter
- Créer un véhicule
- Créer un trajet (vérifier calcul auto)
- Rechercher des trajets
- Réserver un trajet
- Vérifier le profil

**3. Collection Postman**
Exporter toutes les requêtes testées dans une collection Postman

---

## 📋 **CHECKLIST FINALE**

### ✅ **Ce qui sera FAIT**

**Jour 1**

- [x] Configuration environment (.env)
- [x] RouteService avec OpenRouteService
- [x] TripsController complet (6 méthodes)
- [x] Routes trips ajoutées
- [x] BookingsController (4 méthodes)
- [x] UsersController profils (4 méthodes)

**Jour 2**

- [x] OptimizationService
- [x] Validators manquants
- [x] Tests fonctionnels de base
- [x] Documentation API
- [x] Collection Postman

### ❌ **Ce qui restera pour PLUS TARD**

- Paiements (PaymentsController)
- Évaluations (ReviewsController)
- Notifications push
- Messagerie temps réel
- Upload de photos
- Statistiques avancées
- Dashboard admin

---

## 🚀 **Résultat Final**

À la fin des 2 jours, vous aurez :

- ✅ **API complète** pour le covoiturage de base
- ✅ **38 endpoints** fonctionnels (Auth: 8, ACL: 14, Vehicles: 5, Trips: 6, Bookings: 4, Users: 4)
- ✅ **Calcul automatique** des distances/durées via OpenRouteService
- ✅ **Optimisation** de base pour groupes
- ✅ **Tests** fonctionnels essentiels
- ✅ **Documentation** complète

L'application sera **prête pour une démo** et pourra servir de base solide pour les développements futurs !
