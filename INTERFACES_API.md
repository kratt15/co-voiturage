# Documentation des Interfaces API

Ce document décrit les interfaces TypeScript pour les entités principales du système de covoiturage : Trip, Booking et Vehicle.

## 🚗 Trip (Trajet)

### Types et Énumérations

```typescript
export type TripStatus = 'DRAFT' | 'PUBLISHED' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'

export type Coordinates = {
  latitude: number
  longitude: number
}
```

### Interface CreateTrip

```typescript
interface CreateTrip {
  departureCoordinates: {
    latitude: number    // -90 à 90
    longitude: number   // -180 à 180
  }
  departureCity: string                // 3-255 caractères
  arrivalCity: string                  // 3-255 caractères
  arrivalCoordinates: {
    latitude: number    // -90 à 90
    longitude: number   // -180 à 180
  }
  departureDate: string               // Format Date ISO
  departureTime: string               // Format HH:MM (00:00-23:59)
  estimatedDuration: number           // 1-100 minutes
  distanceKm: number                  // 1-200 km
  pricePerSeat: number               // Min 1
  availableSeats: number             // 1-100
  totalSeats: number                 // 1-100
  comments?: string                   // 3-255 caractères (optionnel)
  petsAllowed: boolean
  luggageAllowed: boolean
  possibleStops?: {                   // Optionnel
    stop_1: string                    // 3-255 caractères
    stop_2: string                    // 3-255 caractères
  }
  vehicleId: number                   // Min 1
}
```

### Interface UpdateTrip

```typescript
interface UpdateTrip {
  departureCoordinates?: {
    latitude: number
    longitude: number
  }
  departureCity?: string
  arrivalCity?: string
  arrivalCoordinates?: {
    latitude: number
    longitude: number
  }
  departureDate?: string
  departureTime?: string
  estimatedDuration?: number
  distanceKm?: number
  pricePerSeat?: number
  availableSeats?: number
  totalSeats?: number
  comments?: string
  petsAllowed?: boolean
  luggageAllowed?: boolean
  possibleStops?: {
    stop_1: string
    stop_2: string
  }
  vehicleId?: number
}
```

### Interface TripResponse

```typescript
interface TripResponse {
  id: number
  uuid: string
  driverId: number
  vehicleId: number
  departureCoordinates: Coordinates
  departureCity: string
  arrivalCity: string
  arrivalCoordinates: Coordinates
  departureDate: string               // DateTime ISO
  departureTime: string
  estimatedDuration: number
  distanceKm: number
  pricePerSeat: number
  availableSeats: number
  totalSeats: number
  status: TripStatus
  comments: string | null
  petsAllowed: boolean
  luggageAllowed: boolean
  possibleStops: {
    stop_1: string
    stop_2: string
  } | null
  createdAt: string                   // DateTime ISO
  updatedAt: string                   // DateTime ISO
  
  // Relations (optionnelles selon les includes)
  driver?: UserResponse
  vehicle?: VehicleResponse
  bookings?: BookingResponse[]
  reviews?: ReviewResponse[]
}
```

### Exemples d'utilisation

#### Création d'un trajet complet
```json
{
  "departureCoordinates": {
    "latitude": 6.172674,
    "longitude": 1.349101
  },
  "departureCity": "Lomé Centre",
  "arrivalCoordinates": {
    "latitude": 6.182674,
    "longitude": 1.359101
  },
  "arrivalCity": "Tokoin",
  "departureDate": "2025-01-20",
  "departureTime": "08:00",
  "estimatedDuration": 45,
  "distanceKm": 12.5,
  "pricePerSeat": 1500,
  "availableSeats": 3,
  "totalSeats": 4,
  "status": "PUBLISHED",
  "comments": "Trajet confortable, climatisation disponible",
  "petsAllowed": false,
  "luggageAllowed": true,
  "possibleStops": {
    "stop_1": "Marché central",
    "stop_2": "Université de Lomé"
  },
  "vehicleId": 3
}
```

#### Mise à jour d'un trajet
```json
{
  "pricePerSeat": 2000,
  "comments": "Prix mis à jour - Trajet premium",
  "availableSeats": 2,
  "possibleStops": {
    "stop_1": "Nouveau Marché",
    "stop_2": "Centre Commercial"
  }
}
```

## 📋 Booking (Réservation)

### Types et Énumérations

```typescript
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'PAID' | 'CANCELLED' | 'COMPLETED'
```

### Interface CreateBooking

```typescript
interface CreateBooking {
  numberOfSeats: number        // 1-8
  passengerComment?: string    // Optionnel
}
```

### Interface UpdateBooking

```typescript
interface UpdateBooking {
  numberOfSeats?: number       // 1-8
  passengerComment?: string    // Optionnel
}
```

### Interface BookingResponse

```typescript
interface BookingResponse {
  id: number
  uuid: string
  tripId: number
  passengerId: number
  bookingDate: string          // DateTime ISO
  numberOfSeats: number
  totalAmount: number
  status: BookingStatus
  passengerComment: string | null
  createdAt: string           // DateTime ISO
  updatedAt: string           // DateTime ISO
  
  // Relations (optionnelles selon les includes)
  trip?: TripResponse
  passenger?: UserResponse
  payment?: PaymentResponse
  reviews?: ReviewResponse[]
}
```

### Exemples d'utilisation

#### Création d'une réservation
```json
{
  "numberOfSeats": 2,
  "passengerComment": "Je serai à la gare principale"
}
```

#### Mise à jour d'une réservation
```json
{
  "numberOfSeats": 3,
  "passengerComment": "Finalement nous serons 3"
}
```

## 🚙 Vehicle (Véhicule)

### Interface CreateVehicle

```typescript
interface CreateVehicle {
  brand: string                    // 3-255 caractères
  model: string                    // 3-255 caractères
  color: string                    // 3-255 caractères
  licensePlate: string             // 3-255 caractères
  year: number                     // 1900-2025
  numberOfSeats: number            // 1-100
  fuelType: string                 // 3-255 caractères
  hasAirConditioning: boolean
  isVerified: boolean
}
```

### Interface UpdateVehicle

```typescript
interface UpdateVehicle {
  brand?: string
  model?: string
  color?: string
  licensePlate?: string
  year?: number
  numberOfSeats?: number
  fuelType?: string
  hasAirConditioning?: boolean
  isVerified?: boolean
}
```

### Interface VehicleResponse

```typescript
interface VehicleResponse {
  id: number
  uuid: string
  driverId: number
  brand: string
  model: string
  color: string
  licensePlate: string
  year: number
  numberOfSeats: number
  fuelType: string
  hasAirConditioning: boolean
  isVerified: boolean
  createdAt: string               // DateTime ISO
  updatedAt: string               // DateTime ISO
  
  // Relations (optionnelles selon les includes)
  driver?: UserResponse
  trips?: TripResponse[]
}
```

### Exemples d'utilisation

#### Création d'un véhicule
```json
{
  "brand": "Toyota",
  "model": "Corolla",
  "color": "Red",
  "licensePlate": "ABC123",
  "year": 2020,
  "numberOfSeats": 5,
  "fuelType": "Gasoline",
  "hasAirConditioning": true,
  "isVerified": true
}
```

#### Mise à jour d'un véhicule
```json
{
  "brand": "Tesla",
  "model": "Model S",
  "color": "Black",
  "licensePlate": "ABC1234",
  "year": 2025,
  "numberOfSeats": 5,
  "fuelType": "Electric",
  "hasAirConditioning": true,
  "isVerified": true
}
```

## 🔗 Routes API

### Trip Routes
- `GET /api/v1/trips` - Récupérer tous les trajets
- `GET /api/v1/trips/:uuid` - Récupérer un trajet spécifique
- `POST /api/v1/trips` - Créer un trajet
- `PUT /api/v1/trips/:uuid` - Mettre à jour un trajet
- `POST /api/v1/trips/optimization` - Créer un trajet avec optimisation

### Booking Routes
- `GET /api/v1/bookings` - Récupérer mes réservations
- `GET /api/v1/bookings/:uuid` - Récupérer une réservation spécifique
- `POST /api/v1/bookings/trips/:tripUuid` - Créer une réservation
- `PUT /api/v1/bookings/:uuid` - Mettre à jour une réservation
- `DELETE /api/v1/bookings/:uuid` - Annuler une réservation
- `PUT /api/v1/bookings/:uuid/confirm` - Confirmer une réservation (conducteur)
- `PUT /api/v1/bookings/:uuid/reject` - Rejeter une réservation (conducteur)

### Vehicle Routes
- `GET /api/v1/vehicles` - Récupérer tous mes véhicules
- `GET /api/v1/vehicles/:uuid` - Récupérer un véhicule spécifique
- `POST /api/v1/vehicles` - Créer un véhicule
- `PUT /api/v1/vehicles/:uuid` - Mettre à jour un véhicule
- `DELETE /api/v1/vehicles/:uuid` - Supprimer un véhicule

## 📝 Notes importantes

1. **Authentification** : Toutes les routes nécessitent un token Bearer d'authentification
2. **UUID** : Les entités utilisent des UUID pour l'identification publique
3. **Validation** : Toutes les données d'entrée sont validées selon les règles spécifiées
4. **Relations** : Les relations sont chargées optionnellement selon les besoins
5. **Status** : Les changements de statut suivent des règles métier spécifiques
6. **Optimisation** : Le système supporte l'optimisation des itinéraires via Mapbox 
