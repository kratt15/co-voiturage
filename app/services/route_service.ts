import axios from 'axios'
import Env from '#start/env'
interface Coordinates {
  longitude: number
  latitude: number
}

export class RouteService {
  // Your code here
  public url = Env.get('ROUTE_SERVICE_URL')
  public key = Env.get('ROUTE_SERVICE_API_KEY')

  async getDirections(origin: Coordinates, destination: Coordinates) {
    try {
      const data = {
        coordinates: [
          [origin.longitude, origin.latitude], // OpenRouteService attend [longitude, latitude]
          [destination.longitude, destination.latitude],
        ],
      }

      console.log('Données envoyées à OpenRouteService:', JSON.stringify(data, null, 2))

      const response = await axios.post(`${this.url}/v2/directions/driving-car`, data, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.key,
        },
      })
      const route = response.data
      return {
        distance: Math.round((route.routes[0].summary.distance / 1000) * 100) / 100, // km
        duration: Math.round(route.routes[0].summary.duration / 60), // minutes
        geometry: route.routes[0].geometry,
        steps: route.routes[0].segments[0].steps,
        bbox: route.routes[0].bbox,
        coordinates: route.routes[0].coordinates,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Erreur Axios:', {
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          },
        })

        switch (error.response?.status) {
          case 400:
            console.error('Données invalides - Vérifiez le format des coordonnées')
            break
          case 401:
            console.error('Non autorisé - Vérifiez votre clé API')
            break
          case 404:
            console.error('Ressource non trouvée')
            break
          case 500:
            console.error('Erreur serveur')
            break
          default:
            console.error('Erreur inconnue')
        }
      }
      throw error
    }
  }

  async getOptimization(coordinates: Coordinates[]) {
    try {
      // Préparer les jobs à partir des coordonnées (sauf le premier qui sera le point de départ du véhicule)
      const jobs = coordinates.slice(1).map((coord, index) => ({
        id: index + 2, // Commencer à 2 car 1 sera le point de départ
        service: 300, // Temps de service en secondes
        delivery: [1],
        location: [coord.longitude, coord.latitude],
        skills: [1],
      }))

      // Le premier point devient le point de départ/arrivée du véhicule
      const startLocation = coordinates[0]
      const endLocation = coordinates[coordinates.length - 1] // Dernier point comme arrivée

      const vehicle = {
        id: 1,
        profile: 'driving-car',
        start: [startLocation.longitude, startLocation.latitude],
        end: [endLocation.longitude, endLocation.latitude], // Point d'arrivée différent
        capacity: [coordinates.length], // Capacité suffisante pour tous les points
        skills: [1],
        time_window: [0, 86400], // Fenêtre de 24h pour plus de flexibilité
      }

      const requestData = {
        jobs: jobs,
        vehicles: [vehicle],
      }

      console.log(
        "Données d'optimisation envoyées à OpenRouteService:",
        JSON.stringify(requestData, null, 2)
      )

      const response = await axios.post(`${this.url}/optimization`, requestData, {
        headers: {
          'Accept':
            'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
          'Authorization': this.key,
          'Content-Type': 'application/json; charset=utf-8',
        },
      })

      const optimization = response.data
      return {
        status: optimization.status,
        summary: optimization.summary,
        routes: optimization.routes,
        unassigned: optimization.unassigned,
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erreur Axios lors de l'optimisation:", {
          status: error.response?.status,
          data: error.response?.data,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            data: error.config?.data,
          },
        })

        switch (error.response?.status) {
          case 400:
            console.error("Données d'optimisation invalides - Vérifiez le format des coordonnées")
            break
          case 401:
            console.error('Non autorisé - Vérifiez votre clé API')
            break
          case 404:
            console.error("Service d'optimisation non trouvé")
            break
          case 500:
            console.error("Erreur serveur lors de l'optimisation")
            break
          default:
            console.error("Erreur inconnue lors de l'optimisation")
        }
      }
      throw error
    }
  }

  
}
