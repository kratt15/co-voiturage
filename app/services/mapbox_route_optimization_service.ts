import axios from 'axios'
import Env from '#start/env'
import Trip from '#models/trip'
// import Booking from '#models/booking'
// import { DateTime } from 'luxon'

// interface Coordinates {
//   longitude: number
//   latitude: number
// }

interface TimeWindow {
  earliest: string
  latest: string
  type?: 'strict' | 'soft_start' | 'soft_end' | 'soft'
}

interface Location {
  name: string
  coordinates: [number, number] // [longitude, latitude]
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
  provides?: string[]
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
  requirements?: string[]
}

interface OptimizationProblem {
  version: number
  locations: Location[]
  vehicles: Vehicle[]
  shipments?: Shipment[]
  services?: any[]
  options?: {
    objectives?: string[]
  }
}

interface OptimizationSolution {
  id?: string
  status?: string
  routes: Array<{
    vehicle: string
    stops: Array<{
      location: string
      eta: string
      type: 'start' | 'pickup' | 'dropoff' | 'end' | 'service'
      duration?: number
      wait?: number
      odometer?: number
      pickups?: string[]
      dropoffs?: string[]
    }>
  }>
  dropped?: {
    services: string[]
    shipments: string[]
  }
}

export class MapboxRouteOptimizationService {
  private baseUrl = 'https://api.mapbox.com/optimized-trips/v2'
  private accessToken = Env.get('MAPBOX_ACCESS_TOKEN')

  /**
   * Optimiser un trajet existant avec ses réservations
   */
  async optimizeTripWithBookings(tripId: number): Promise<OptimizationSolution> {
    const trip = await Trip.query()
      .where('id', tripId)
      .preload('driver')
      .preload('vehicle')
      .preload('bookings', (query) => {
        query.whereIn('status', ['CONFIRMED', 'PAID'])
      })
      .firstOrFail()

    if (trip.bookings.length === 0) {
      // Pas de réservations à optimiser
      return {
        routes: [
          {
            vehicle: `vehicle-${trip.vehicle.id}`,
            stops: [
              {
                location: 'driver-start',
                eta: trip.departureDate.toISO() || new Date().toISOString(),
                type: 'start',
                odometer: 0,
              },
              {
                location: 'driver-end',
                eta:
                  trip.departureDate.plus({ minutes: trip.estimatedDuration }).toISO() ||
                  new Date().toISOString(),
                type: 'end',
                odometer: trip.distanceKm * 1000,
              },
            ],
          },
        ],
      }
    }

    const problem = await this.buildProblemFromTrip(trip)
    const solution = await this.submitAndGetSolution(problem)

    // Sauvegarder la solution optimisée
    await this.updateTripWithSolution(trip, solution)

    return solution
  }

  /**
   * Réoptimiser un trajet après l'ajout/suppression d'une réservation
   */
  async reoptimizeTrip(tripId: number): Promise<OptimizationSolution> {
    return this.optimizeTripWithBookings(tripId)
  }

  /**
   * Construire le problème d'optimisation à partir d'un trajet
   */
  private async buildProblemFromTrip(trip: Trip): Promise<OptimizationProblem> {
    const locations = new Map<string, Location>()

    // Coordonnées de départ et d'arrivée du conducteur
    const departureCoords = trip.departureCoordinates.split(',').map(Number)
    const arrivalCoords = trip.arrivalCoordinates.split(',').map(Number)

    locations.set('driver-start', {
      name: 'driver-start',
      coordinates: [departureCoords[1], departureCoords[0]], // [lon, lat]
    })

    locations.set('driver-end', {
      name: 'driver-end',
      coordinates: [arrivalCoords[1], arrivalCoords[0]],
    })

    // Construire les shipments pour chaque réservation
    const shipments: Shipment[] = []

    for (const booking of trip.bookings) {
      const pickupKey = `pickup-${booking.id}`
      const dropoffKey = `dropoff-${booking.id}`

      // Pour le MVP, on utilise les coordonnées du trajet principal
      // TODO: Ajouter des champs pickup/dropoff coordinates dans le modèle Booking
      locations.set(pickupKey, {
        name: pickupKey,
        coordinates: [departureCoords[1], departureCoords[0]], // Temporaire
      })

      locations.set(dropoffKey, {
        name: dropoffKey,
        coordinates: [arrivalCoords[1], arrivalCoords[0]], // Temporaire
      })

      shipments.push({
        name: `booking-${booking.id}`,
        from: pickupKey,
        to: dropoffKey,
        size: {
          passengers: booking.numberOfSeats,
          bagages: 1, // TODO: Ajouter luggage_count dans Booking
        },
        pickup_duration: 180, // 3 minutes
        dropoff_duration: 120, // 2 minutes
        pickup_times: [
          {
            earliest: trip.departureDate.toISO() || new Date().toISOString(),
            latest: trip.departureDate.plus({ minutes: 30 }).toISO() || new Date().toISOString(),
            type: 'soft',
          },
        ],
      })
    }

    // Construire le véhicule
    const vehicle: Vehicle = {
      name: `vehicle-${trip.vehicleId}`,
      start_location: 'driver-start',
      end_location: 'driver-end',
      earliest_start: trip.departureDate.toISO() || new Date().toISOString(),
      latest_end: trip.departureDate.plus({ hours: 6 }).toISO() || new Date().toISOString(),
      capacities: {
        passengers: trip.totalSeats,
        bagages: trip.totalSeats * 2, // Estimation
      },
    }

    return {
      version: 1,
      locations: Array.from(locations.values()),
      vehicles: [vehicle],
      shipments,
      options: {
        objectives: ['min-schedule-completion-time'],
      },
    }
  }

  /**
   * Soumettre un problème d'optimisation
   */
  async submitProblem(problem: OptimizationProblem): Promise<{ id: string; status: string }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}?access_token=${this.accessToken}`,
        problem,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      return response.data
    } catch (error: any) {
      console.error(
        'Erreur lors de la soumission du problème:',
        error.response?.data || error.message
      )
      throw new Error(
        `Erreur Mapbox Optimization: ${error.response?.data?.message || error.message}`
      )
    }
  }

  /**
   * Récupérer la solution d'un problème
   */
  async getSolution(problemId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/${problemId}?access_token=${this.accessToken}`
      )
      return response.data
    } catch (error: any) {
      if (error.response?.status === 202) {
        // Solution pas encore prête
        return { status: 'processing' }
      }
      throw error
    }
  }

  /**
   * Attendre que la solution soit prête
   */
  async pollForSolution(problemId: string, maxAttempts = 30): Promise<OptimizationSolution> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.getSolution(problemId)

      // Vérifier si la solution est prête
      if (result.routes) {
        return result as OptimizationSolution
      }

      // Attendre 2 secondes avant de réessayer
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }

    throw new Error('Timeout: solution non trouvée après 60 secondes')
  }

  /**
   * Soumettre et obtenir la solution en une seule méthode
   */
  async submitAndGetSolution(problem: OptimizationProblem): Promise<OptimizationSolution> {
    const submission = await this.submitProblem(problem)
    return await this.pollForSolution(submission.id)
  }

  /**
   * Mettre à jour le trajet avec la solution optimisée
   */
  private async updateTripWithSolution(trip: Trip, solution: OptimizationSolution): Promise<void> {
    if (!solution.routes || solution.routes.length === 0) {
      console.warn('Aucune route optimisée trouvée')
      return
    }

    const route = solution.routes[0]

    // Extraire les informations optimisées
    const optimizedRoute = {
      stops: route.stops.map((stop) => ({
        location: stop.location,
        arrivalTime: stop.eta,
        type: stop.type,
        duration: stop.duration || 0,
        odometer: stop.odometer || 0,
        bookingIds: this.extractBookingIds(stop),
      })),
      totalDistance: route.stops[route.stops.length - 1]?.odometer || 0,
      totalDuration: this.calculateTotalDuration(route.stops),
      droppedBookings: solution.dropped?.shipments || [],
    }

    // Sauvegarder dans le trajet (nécessite d'ajouter un champ JSON dans la DB)
    // Pour l'instant, on log juste le résultat
    console.log('Route optimisée:', JSON.stringify(optimizedRoute, null, 2))

    // TODO: Ajouter un champ 'optimized_route' dans la table trips
    // await trip.merge({ optimizedRoute }).save()

    // Notifier les passagers des horaires de pickup mis à jour
    for (const stop of route.stops) {
      if (stop.type === 'pickup') {
        const bookingIds = this.extractBookingIds(stop)
        for (const bookingId of bookingIds) {
          const booking = trip.bookings.find((b) => b.id === bookingId)
          if (booking) {
            // TODO: Envoyer notification avec l'heure de pickup
            console.log(`Booking ${bookingId}: pickup prévu à ${stop.eta}`)
          }
        }
      }
    }
  }

  /**
   * Extraire les IDs de réservation d'un arrêt
   */
  private extractBookingIds(stop: any): number[] {
    const ids: number[] = []

    const shipments = [...(stop.pickups || []), ...(stop.dropoffs || [])]
    for (const shipment of shipments) {
      const match = shipment.match(/booking-(\d+)/)
      if (match) {
        ids.push(parseInt(match[1]))
      }
    }

    return ids
  }

  /**
   * Calculer la durée totale du trajet
   */
  private calculateTotalDuration(stops: any[]): number {
    if (stops.length < 2) return 0

    const start = new Date(stops[0].eta)
    const end = new Date(stops[stops.length - 1].eta)

    return Math.round((end.getTime() - start.getTime()) / 1000) // en secondes
  }
}
