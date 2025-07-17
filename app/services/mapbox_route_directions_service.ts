import axios from 'axios'
import Env from '#start/env'

interface Coordinates {
  longitude: number
  latitude: number
}

interface DirectionsOptions {
  alternatives?: boolean
  geometries?: 'geojson' | 'polyline' | 'polyline6'
  language?: string
  overview?: 'full' | 'simplified' | 'false'
  steps?: boolean
  exclude?: string
  approaches?: string
  waypoint_snapping?: string
}

interface MapboxDirectionsResponse {
  routes: any[]
  waypoints: any[]
  code: string
  uuid?: string
}

export class MapboxRouteDirectionsService {
  public url = Env.get('MAPBOX_BASE_URL')
  public accessToken = Env.get('MAPBOX_ACCESS_TOKEN')

  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    options: DirectionsOptions = {}
  ): Promise<MapboxDirectionsResponse> {
    // Paramètres par défaut
    const defaultOptions: DirectionsOptions = {
      alternatives: true,
      geometries: 'polyline',
      language: 'fr',
      overview: 'full',
      steps: true,
    }

    // Fusion des options par défaut avec les options fournies
    const finalOptions = { ...defaultOptions, ...options }

    // Construction des paramètres de requête
    const params = new URLSearchParams({
      access_token: this.accessToken,
      ...Object.fromEntries(
        Object.entries(finalOptions).map(([key, value]) => [key, String(value)])
      ),
    })

    // Construction de l'URL complète
    const fullUrl = `${this.url}/directions/v5/mapbox/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?${params}`

    try {
      const response = await axios.get<MapboxDirectionsResponse>(fullUrl)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération des directions Mapbox:', error)
      throw new Error('Impossible de récupérer les directions depuis Mapbox')
    }
  }

  /**
   * Méthode simplifiée pour obtenir juste la route principale
   */
  async getSimpleRoute(origin: Coordinates, destination: Coordinates) {
    const result = await this.getDirections(origin, destination, {
      alternatives: false,
      steps: true,
      overview: 'simplified',
    })

    return result.routes[0] || null
  }

  /**
   * Méthode pour obtenir plusieurs alternatives de routes
   */
  async getRouteAlternatives(origin: Coordinates, destination: Coordinates) {
    const result = await this.getDirections(origin, destination, {
      alternatives: true,
      steps: true,
      overview: 'full',
    })

    return result.routes
  }
}
