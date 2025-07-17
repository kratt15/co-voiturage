# Guide Complet - API Mapbox Optimization v2 pour Covoiturage

## 🚀 Introduction

L'API Mapbox Optimization v2 est conçue pour résoudre des **problèmes de routage de véhicules** (Vehicle Routing Problems - VRP). Elle calcule les itinéraires les plus efficaces pour plusieurs véhicules devant visiter plusieurs endroits.

### Différence avec la v1
- ✅ Fenêtres horaires (time windows)
- ✅ Capacité des véhicules 
- ✅ Horaires de travail des conducteurs
- ✅ Contraintes de pickup/dropoff
- ✅ Pauses obligatoires

## 📋 Le processus en 3 étapes

### 1️⃣ Soumettre un problème (POST)
```
POST https://api.mapbox.com/optimized-trips/v2?access_token=YOUR_TOKEN
```

### 2️⃣ Récupérer la solution (GET)
```
GET https://api.mapbox.com/optimized-trips/v2/{id}?access_token=YOUR_TOKEN
```

### 3️⃣ Lister vos soumissions (GET)
```
GET https://api.mapbox.com/optimized-trips/v2?access_token=YOUR_TOKEN
```

## 🏗️ Structure d'un problème de routage

### 1. Version (obligatoire)
```json
{
  "version": 1
}
```

### 2. Locations (obligatoire)
```json
{
  "locations": [
    {
      "name": "gare-lyon",
      "coordinates": [2.373451, 48.844509]
    },
    {
      "name": "aeroport-cdg", 
      "coordinates": [2.547924, 49.009683]
    }
  ]
}
```

### 3. Vehicles (obligatoire)
```json
{
  "vehicles": [
    {
      "name": "voiture-marie",
      "start_location": "domicile-paul",
      "end_location": "domicile-paul",
      "earliest_start": "2024-02-10T08:00:00Z",
      "latest_end": "2024-02-10T18:00:00Z",
      "capacities": {
        "passengers": 4,
        "bagages": 3
      }
    }
  ]
}
```

### 4. Shipments (trajets passagers)
```json
{
  "shipments": [
    {
      "name": "trajet-sophie",
      "from": "gare-lyon",
      "to": "aeroport-cdg",
      "size": {
        "passengers": 1,
        "bagages": 2
      },
      "pickup_duration": 300,
      "dropoff_duration": 300,
      "pickup_times": [
        {
          "earliest": "2024-02-10T09:00:00Z",
          "latest": "2024-02-10T09:30:00Z",
          "type": "strict"
        }
      ]
    }
  ]
}
```

## 🎯 Applications dans votre projet de covoiturage

### Problème 1 : Trajets avec arrêts multiples

**❌ Situation actuelle :**
```typescript
// Votre service ne gère que 2 points
async getOptimization(origin: Coordinates, destination: Coordinates) {
  // Pas d'arrêts intermédiaires
}
```

**✅ Avec Optimization v2 :**
- Marie : Paris → Lyon
- Paul monte à Melun  
- Sophie descend à Auxerre
- **Route optimisée automatiquement : Paris → Melun → Auxerre → Lyon**

### Problème 2 : Gestion des réservations multiples

L'API calcule l'ordre optimal en considérant :
- Géographie (plus court chemin)
- Horaires de pickup
- Capacité du véhicule
- Préférences des passagers

### Problème 3 : Contraintes horaires

**❌ Votre structure actuelle :**
```typescript
const booking = {
  // Pas de gestion des créneaux de pickup
  // Pas de contraintes "j'ai un train à prendre"
}
```

**✅ Avec Optimization v2 :**
```json
{
  "pickup_times": [{
    "earliest": "2024-02-10T08:15:00Z",
    "latest": "2024-02-10T08:30:00Z",
    "type": "strict"
  }]
}
```

## 💻 Service d'optimisation pour votre projet

```typescript
import axios from 'axios'
import Env from '#start/env'
import Trip from '#models/trip'
import Booking from '#models/booking'

interface Coordinates {
  longitude: number
  latitude: number
}

interface TimeWindow {
  earliest: string
  latest: string
  type?: 'strict' | 'soft_start' | 'soft_end' | 'soft'
}

interface Vehicle {
  name: string
  start_location: string
  end_location?: string
  earliest_start?: string
  latest_end?: string
  capacities?: {
    passengers: number
    bagages?: number
  }
}

interface Shipment {
  name: string
  from: string
  to: string
  size: {
    passengers: number
    bagages?: number
  }
  pickup_duration?: number
  dropoff_duration?: number
  pickup_times?: TimeWindow[]
  dropoff_times?: TimeWindow[]
}

export class MapboxRouteOptimizationService {
  private baseUrl = 'https://api.mapbox.com/optimized-trips/v2'
  private accessToken = Env.get('MAPBOX_ACCESS_TOKEN')

  /**
   * Optimiser un trajet existant avec ses réservations
   */
  async optimizeTripWithBookings(tripId: number) {
    const trip = await Trip.query()
      .where('id', tripId)
      .preload('driver', query => query.preload('vehicle'))
      .preload('bookings', query => query.preload('passenger'))
      .firstOrFail()
    
    const problem = await this.buildProblemFromTrip(trip)
    const solution = await this.submitAndGetSolution(problem)
    await this.updateTripWithSolution(trip, solution)
    
    return solution
  }

  private async buildProblemFromTrip(trip: Trip) {
    const locations = new Map()
    
    // Point de départ du conducteur
    locations.set('driver-start', {
      name: 'driver-start',
      coordinates: JSON.parse(trip.departureCoordinates)
    })
    
    // Point d'arrivée du conducteur
    locations.set('driver-end', {
      name: 'driver-end',
      coordinates: JSON.parse(trip.arrivalCoordinates)
    })
    
    // Points de pickup/dropoff des passagers
    const shipments = []
    
    for (const booking of trip.bookings) {
      const pickupKey = `pickup-${booking.id}`
      const dropoffKey = `dropoff-${booking.id}`
      
      locations.set(pickupKey, {
        name: pickupKey,
        coordinates: [booking.pickupLocation.longitude, booking.pickupLocation.latitude]
      })
      
      locations.set(dropoffKey, {
        name: dropoffKey,
        coordinates: [booking.dropoffLocation.longitude, booking.dropoffLocation.latitude]
      })
      
      shipments.push({
        name: `booking-${booking.id}`,
        from: pickupKey,
        to: dropoffKey,
        size: {
          passengers: booking.numberOfSeats,
          bagages: booking.luggageCount || 0
        },
        pickup_duration: 180,
        dropoff_duration: 120
      })
    }
    
    return {
      version: 1,
      locations: Array.from(locations.values()),
      vehicles: [{
        name: `vehicle-${trip.vehicle.id}`,
        start_location: 'driver-start',
        end_location: 'driver-end',
        earliest_start: trip.departureDate.toISOString(),
        capacities: {
          passengers: trip.totalSeats,
          bagages: trip.vehicle.luggageCapacity || 10
        }
      }],
      shipments
    }
  }

  async submitProblem(problem: any) {
    const response = await axios.post(
      `${this.baseUrl}?access_token=${this.accessToken}`,
      problem
    )
    return response.data
  }

  async getSolution(problemId: string) {
    const response = await axios.get(
      `${this.baseUrl}/${problemId}?access_token=${this.accessToken}`
    )
    return response.data
  }

  async pollForSolution(problemId: string, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getSolution(problemId)
      
      if (result.routes) {
        return result
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
    
    throw new Error('Timeout: solution non trouvée')
  }

  async submitAndGetSolution(problem: any) {
    const submission = await this.submitProblem(problem)
    return await this.pollForSolution(submission.id)
  }

  private async updateTripWithSolution(trip: Trip, solution: any) {
    const route = solution.routes[0]
    
    const optimizedStops = route.stops.map((stop: any) => ({
      location: stop.location,
      arrivalTime: stop.eta,
      type: stop.type,
      duration: stop.duration || 0,
      odometer: stop.odometer,
      bookingId: this.extractBookingId(stop)
    }))
    
    await trip.merge({
      optimizedRoute: optimizedStops,
      totalDistance: route.distance,
      estimatedDuration: route.duration,
      lastOptimizedAt: new Date()
    }).save()
  }

  private extractBookingId(stop: any): number | null {
    if (stop.shipments && stop.shipments[0]) {
      const match = stop.shipments[0].match(/booking-(\d+)/)
      return match ? parseInt(match[1]) : null
    }
    return null
  }
}
```

## 📊 Exemple de réponse optimisée

```json
{
  "routes": [
    {
      "vehicle": "voiture-jean",
      "stops": [
        {
          "location": "driver-start",
          "eta": "2024-02-10T07:00:00Z",
          "type": "start",
          "odometer": 0
        },
        {
          "location": "pickup-1",
          "eta": "2024-02-10T07:25:00Z",
          "type": "pickup",
          "shipments": ["booking-1"],
          "duration": 180,
          "odometer": 1200
        },
        {
          "location": "dropoff-1",
          "eta": "2024-02-10T08:35:00Z",
          "type": "dropoff",
          "shipments": ["booking-1"],
          "duration": 120,
          "odometer": 15400
        },
        {
          "location": "driver-end",
          "eta": "2024-02-10T09:30:00Z",
          "type": "end",
          "odometer": 28600
        }
      ],
      "distance": 28600,
      "duration": 9000
    }
  ],
  "dropped": {
    "services": [],
    "shipments": []
  }
}
```

## 💰 Avantages business

### Exemple de rentabilité

**Sans optimisation :**
- Trajet Paris-Lyon : 1 conducteur, 2 passagers
- Distance : 460 km
- Temps : 4h30
- Revenus : 60€

**Avec optimisation :**
- Même trajet + 3 arrêts optimisés : 3 passagers  
- Distance : 485 km (+25 km)
- Temps : 4h45 (+15 min)
- Revenus : 90€
- **+50% de revenus pour +5% de temps !**

### Bénéfices
1. **Plus de passagers par trajet** = Plus de revenus
2. **Trajets plus courts** = Économies d'essence  
3. **Horaires respectés** = Clients satisfaits
4. **Gestion automatique** = Moins de support client

## 🔧 Types de fenêtres horaires

- **`strict`** : Doit absolument être dans la fenêtre
- **`soft`** : Préférence mais flexible
- **`soft_start`** : Peut commencer tard mais doit finir à temps
- **`soft_end`** : Peut finir tard mais doit commencer à temps

## 🚀 Intégration dans votre code existant

### 1. Améliorer votre TripsController

```typescript
// Remplacer votre méthode createTrip actuelle (lignes 79-147)
async createTripWithOptimization({ request, response, auth }: HttpContext) {
  const tripData = await request.validateUsing(createTripValidator)
  const user = auth.getUserOrFail()
  
  const trip = await Trip.create({
    ...tripData,
    driverId: user.id,
    status: 'PUBLISHED',
    departureDate: DateTime.fromJSDate(tripData.departureDate)
  })
  
  // Si des réservations existent déjà, optimiser
  if (trip.bookings.length > 0) {
    await this.optimizationService.optimizeTripWithBookings(trip.id)
  }
  
  return response.created(trip)
}
```

### 2. Compléter votre BookingsController

```typescript
// Dans votre app/controllers/bookings_controller.ts (actuellement vide)
import { inject } from '@adonisjs/core'
import { MapboxRouteOptimizationService } from '#services/mapbox_route_optimization_service'

@inject()
export default class BookingsController {
  constructor(
    private optimizationService: MapboxRouteOptimizationService
  ) {}

  async createBooking({ request, response, auth }: HttpContext) {
    const bookingData = request.body()
    const user = auth.getUserOrFail()
    
    const booking = await Booking.create({
      ...bookingData,
      passengerId: user.id,
      status: 'CONFIRMED'
    })
    
    // Re-optimiser automatiquement le trajet
    await this.optimizationService.reoptimizeTrip(booking.tripId)
    
    return response.created(booking)
  }

  async getMyBookings({ response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    
    const bookings = await Booking.query()
      .where('passengerId', user.id)
      .preload('trip', query => query.preload('driver'))
    
    return response.ok(bookings)
  }

  async cancelBooking({ params, response, auth }: HttpContext) {
    const user = auth.getUserOrFail()
    const booking = await Booking.findOrFail(params.id)
    
    if (booking.passengerId !== user.id) {
      return response.forbidden({ message: 'Non autorisé' })
    }
    
    await booking.merge({ status: 'CANCELLED' }).save()
    
    // Re-optimiser le trajet sans cette réservation
    await this.optimizationService.reoptimizeTrip(booking.tripId)
    
    return response.ok({ message: 'Réservation annulée' })
  }
}
```

### 3. Ajouter des routes dans start/routes.ts

```typescript
// Ajouter ces routes à votre fichier routes.ts
router.group(() => {
  // Réservations
  router.post('/trips/:uuid/bookings', [BookingsController, 'createBooking'])
  router.get('/bookings', [BookingsController, 'getMyBookings'])
  router.delete('/bookings/:id', [BookingsController, 'cancelBooking'])
  
  // Optimisation
  router.post('/trips/:uuid/optimize', [TripsController, 'optimizeTrip'])
  router.get('/trips/:uuid/optimized-route', [TripsController, 'getOptimizedRoute'])
}).prefix('/api/v1').middleware('auth')
```

## 🎯 Cas d'usage avancés

### 1. Covoiturage avec plusieurs conducteurs

```typescript
async optimizeMultipleDrivers() {
  const problem = {
    version: 1,
    vehicles: [
      {
        name: "alice-peugeot",
        start_location: "paris-nord",
        end_location: "lyon-centre",
        capacities: { passengers: 3 }
      },
      {
        name: "bob-tesla",
        start_location: "paris-est", 
        end_location: "lyon-centre",
        capacities: { passengers: 4 }
      }
    ],
    shipments: [
      { name: "passager-1", from: "chatelet", to: "lyon-centre" },
      { name: "passager-2", from: "republique", to: "lyon-centre" },
      { name: "passager-3", from: "bastille", to: "lyon-centre" }
    ]
  }
  
  // L'API assigne automatiquement les passagers aux conducteurs optimaux
}
```

### 2. Gestion des horaires stricts

```typescript
const problemWithTimeConstraints = {
  shipments: [
    {
      name: "marie-train",
      from: "gare-nord",
      to: "aeroport-cdg",
      pickup_times: [{
        earliest: "2024-02-10T08:00:00Z",
        latest: "2024-02-10T08:15:00Z",
        type: "strict" // Marie a un train à prendre !
      }],
      dropoff_times: [{
        earliest: "2024-02-10T09:30:00Z",
        latest: "2024-02-10T10:00:00Z",
        type: "soft_end" // Vol peut attendre un peu
      }]
    }
  ]
}
```

## 🔄 Gestion des erreurs

```typescript
async handleOptimizationErrors(problem: any) {
  try {
    const solution = await this.submitAndGetSolution(problem)
    
    // Vérifier les trajets abandonnés
    if (solution.dropped && solution.dropped.shipments.length > 0) {
      console.warn('⚠️ Certains trajets n\'ont pas pu être optimisés:')
      
      solution.dropped.shipments.forEach(shipment => {
        console.warn(`- Trajet abandonné: ${shipment}`)
      })
      
      // Essayer avec des contraintes relâchées
      const relaxedProblem = this.relaxConstraints(problem)
      return await this.submitAndGetSolution(relaxedProblem)
    }
    
    return solution
    
  } catch (error) {
    if (error.response?.status === 422) {
      throw new Error('Configuration du trajet invalide')
    }
    
    if (error.response?.status === 401) {
      throw new Error('Erreur d\'authentification Mapbox')
    }
    
    throw error
  }
}
```

## 📈 Monitoring et métriques

```typescript
interface OptimizationMetrics {
  problemId: string
  submittedAt: Date
  completedAt: Date
  processingTime: number
  vehicleCount: number
  shipmentCount: number
  droppedCount: number
  totalDistance: number
  totalDuration: number
}

async trackOptimizationMetrics(problem: any) {
  const startTime = new Date()
  
  const submission = await this.submitProblem(problem)
  const solution = await this.pollForSolution(submission.id)
  
  const endTime = new Date()
  
  const metrics: OptimizationMetrics = {
    problemId: submission.id,
    submittedAt: startTime,
    completedAt: endTime,
    processingTime: endTime.getTime() - startTime.getTime(),
    vehicleCount: problem.vehicles.length,
    shipmentCount: problem.shipments?.length || 0,
    droppedCount: solution.dropped?.shipments?.length || 0,
    totalDistance: solution.routes.reduce((sum, route) => sum + route.distance, 0),
    totalDuration: solution.routes.reduce((sum, route) => sum + route.duration, 0)
  }
  
  // Alerter si trop de trajets abandonnés
  if (metrics.droppedCount > metrics.shipmentCount * 0.1) {
    console.error(`⚠️ ${metrics.droppedCount} trajets abandonnés sur ${metrics.shipmentCount}`)
  }
  
  return metrics
}
```

## 🎯 Prochaines étapes pour votre projet

### Phase 1 : Intégration de base
1. ✅ Remplacer votre `MapboxRouteOptimizationService` actuel
2. ✅ Compléter le `BookingsController` vide
3. ✅ Ajouter les routes manquantes
4. ✅ Tester avec un trajet simple

### Phase 2 : Fonctionnalités avancées
1. Ajouter les champs `pickup_time_window` au modèle `Booking`
2. Modifier `Trip` pour stocker `optimized_route`
3. Créer la recherche intelligente de trajets
4. Implémenter le monitoring

### Phase 3 : Optimisations business
1. Covoiturage multiple (plusieurs conducteurs)
2. Suggestions automatiques de trajets
3. Optimisation des coûts en temps réel
4. Analytics avancées

## 💡 Conseils d'optimisation

1. **Commencez simple** : Testez avec 1 véhicule et 2-3 locations
2. **Ajoutez progressivement** : Fenêtres horaires, capacités, etc.
3. **Utilisez `soft`** pour plus de flexibilité que `strict`
4. **Cachez les solutions** pour trajets récurrents
5. **Surveillez les métriques** de performance et d'échec
6. **Ayez un plan B** si l'optimisation échoue

## 📚 Ressources et documentation

- [Documentation officielle Mapbox Optimization v2](https://docs.mapbox.com/api/navigation/optimization/)
- [Playground interactif](https://docs.mapbox.com/playground/optimization-api/)
- [Guide des Vehicle Routing Problems](https://developers.google.com/optimization/routing)

---

## 🏁 Conclusion

L'API Mapbox Optimization v2 transformera votre plateforme de covoiturage en permettant :

- **Trajets multi-arrêts optimisés** : Plus de passagers, plus de revenus
- **Gestion automatique des horaires** : Moins de stress pour conducteurs et passagers  
- **Optimisation globale** : Coordination intelligente de plusieurs conducteurs
- **Expérience utilisateur améliorée** : Trajets plus courts, horaires respectés

L'investissement en développement sera rapidement rentabilisé par l'augmentation du taux d'occupation des véhicules et la satisfaction client.
 