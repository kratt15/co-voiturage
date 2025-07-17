import axios from 'axios'
import Env from '#start/env'

interface Coordinates {
  longitude: number
  latitude: number
}

interface MatrixOptions {
  annotations?: 'duration' | 'distance' | 'duration,distance'
  approaches?: string // semicolon-separated list of 'unrestricted' or 'curb'
  bearings?: string // semicolon-separated list of {angle,degrees}
  destinations?: string | number[] // 'all' or semicolon-separated indices
  sources?: string | number[] // 'all' or semicolon-separated indices
  fallback_speed?: number // speed in km/h for straight-line estimates
  depart_at?: string // ISO 8601 format: YYYY-MM-DDThh:mm:ssZ
}

interface Waypoint {
  name: string
  location: [number, number] // [longitude, latitude]
  distance: number
}

interface MapboxMatrixResponse {
  code: string
  durations?: number[][] // matrix of durations in seconds
  distances?: number[][] // matrix of distances in meters
  sources: Waypoint[]
  destinations: Waypoint[]
}

type MatrixProfile =
  | 'mapbox/driving'
  | 'mapbox/walking'
  | 'mapbox/cycling'
  | 'mapbox/driving-traffic'

export class MapboxRouteMatrixService {
  public url = Env.get('MAPBOX_BASE_URL')
  public accessToken = Env.get('MAPBOX_ACCESS_TOKEN')

  /**
   * Récupère une matrice de temps de trajet et/ou distances entre plusieurs points
   * @param coordinates Tableau de coordonnées [longitude, latitude]
   * @param profile Profil de routage Mapbox
   * @param options Options additionnelles pour la matrice
   */
  async getMatrix(
    coordinates: Coordinates[],
    profile: MatrixProfile = 'mapbox/driving',
    options: MatrixOptions = {}
  ): Promise<MapboxMatrixResponse> {
    // Validation des coordonnées
    if (coordinates.length < 2) {
      throw new Error('Au moins 2 coordonnées sont requises')
    }

    const maxCoordinates = profile === 'mapbox/driving-traffic' ? 10 : 25
    if (coordinates.length > maxCoordinates) {
      throw new Error(`Maximum ${maxCoordinates} coordonnées autorisées pour le profil ${profile}`)
    }

    // Construction de la chaîne de coordonnées
    const coordinatesString = coordinates
      .map((coord) => `${coord.longitude},${coord.latitude}`)
      .join(';')

    // Construction des paramètres de requête
    const params = new URLSearchParams({
      access_token: this.accessToken,
    })

    // Ajouter les options si présentes
    if (options.annotations) params.append('annotations', options.annotations)
    if (options.approaches) params.append('approaches', options.approaches)
    if (options.bearings) params.append('bearings', options.bearings)
    if (options.destinations) {
      if (Array.isArray(options.destinations)) {
        params.append('destinations', options.destinations.join(';'))
      } else {
        params.append('destinations', options.destinations)
      }
    }
    if (options.sources) {
      if (Array.isArray(options.sources)) {
        params.append('sources', options.sources.join(';'))
      } else {
        params.append('sources', options.sources)
      }
    }
    if (options.fallback_speed) params.append('fallback_speed', options.fallback_speed.toString())
    if (options.depart_at) params.append('depart_at', options.depart_at)

    // Construction de l'URL finale
    const url = `${this.url}/directions-matrix/v1/${profile}/${coordinatesString}?${params}`

    try {
      const response = await axios.get<MapboxMatrixResponse>(url)
      return response.data
    } catch (error) {
      console.error('Erreur lors de la récupération de la matrice:', error)
      throw new Error('Impossible de récupérer la matrice depuis Mapbox')
    }
  }

  /**
   * Calcule une matrice symétrique simple (tous les points comme sources et destinations)
   * @param coordinates Points pour lesquels calculer la matrice
   * @param profile Profil de routage
   */
  async getSymmetricMatrix(
    coordinates: Coordinates[],
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<MapboxMatrixResponse> {
    return this.getMatrix(coordinates, profile, {
      annotations: 'duration,distance',
      sources: 'all',
      destinations: 'all',
    })
  }

  /**
   * Calcule les temps de trajet d'un point vers plusieurs destinations (1 vers N)
   * @param origin Point d'origine
   * @param destinations Points de destination
   * @param profile Profil de routage
   */
  async getOneToManyMatrix(
    origin: Coordinates,
    destinations: Coordinates[],
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<MapboxMatrixResponse> {
    const allCoordinates = [origin, ...destinations]

    return this.getMatrix(allCoordinates, profile, {
      annotations: 'duration,distance',
      sources: '0', // Seulement le premier point (origine) comme source
      destinations: 'all',
    })
  }

  /**
   * Calcule les temps de trajet de plusieurs points vers une destination (N vers 1)
   * @param sources Points d'origine
   * @param destination Point de destination
   * @param profile Profil de routage
   */
  async getManyToOneMatrix(
    sources: Coordinates[],
    destination: Coordinates,
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<MapboxMatrixResponse> {
    const allCoordinates = [...sources, destination]
    const destinationIndex = sources.length // Index de la destination

    return this.getMatrix(allCoordinates, profile, {
      annotations: 'duration,distance',
      sources: 'all',
      destinations: destinationIndex.toString(),
    })
  }

  /**
   * Calcule la matrice avec gestion du trafic en temps réel
   * @param coordinates Points pour la matrice
   * @param departureTime Heure de départ (ISO 8601)
   */
  async getTrafficMatrix(
    coordinates: Coordinates[],
    departureTime?: string
  ): Promise<MapboxMatrixResponse> {
    const options: MatrixOptions = {
      annotations: 'duration,distance',
    }

    if (departureTime) {
      options.depart_at = departureTime
    }

    return this.getMatrix(coordinates, 'mapbox/driving-traffic', options)
  }

  /**
   * Trouve le point le plus proche d'une origine parmi plusieurs destinations
   * @param origin Point d'origine
   * @param destinations Points candidates
   * @param profile Profil de routage
   */
  async findNearestDestination(
    origin: Coordinates,
    destinations: Coordinates[],
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<{
    destination: Coordinates
    duration: number
    distance: number
    index: number
  } | null> {
    const matrix = await this.getOneToManyMatrix(origin, destinations, profile)

    if (!matrix.durations || !matrix.distances || !matrix.durations[0]) {
      return null
    }

    let nearestIndex = -1
    let shortestDuration = Infinity

    // Parcourir les durées pour trouver la plus courte (en ignorant l'index 0 qui est l'origine)
    for (let i = 1; i < matrix.durations[0].length; i++) {
      const duration = matrix.durations[0][i]
      if (duration !== null && duration < shortestDuration) {
        shortestDuration = duration
        nearestIndex = i - 1 // Ajuster pour l'index dans le tableau destinations
      }
    }

    if (nearestIndex === -1) {
      return null
    }

    return {
      destination: destinations[nearestIndex],
      duration: shortestDuration,
      distance: matrix.distances[0][nearestIndex + 1], // +1 car l'origine est à l'index 0
      index: nearestIndex,
    }
  }

  /**
   * Créé une matrice avec approche depuis le trottoir (utile pour les livraisons)
   * @param coordinates Points pour la matrice
   * @param profile Profil de routage
   */
  async getCurbsideMatrix(
    coordinates: Coordinates[],
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<MapboxMatrixResponse> {
    const approaches = Array(coordinates.length).fill('curb').join(';')

    return this.getMatrix(coordinates, profile, {
      annotations: 'duration,distance',
      approaches: approaches,
    })
  }

  /**
   * Calcule une matrice avec vitesse de secours pour les routes impossibles
   * @param coordinates Points pour la matrice
   * @param fallbackSpeed Vitesse en km/h pour les estimations en ligne droite
   * @param profile Profil de routage
   */
  async getMatrixWithFallback(
    coordinates: Coordinates[],
    fallbackSpeed: number = 50,
    profile: MatrixProfile = 'mapbox/driving'
  ): Promise<MapboxMatrixResponse> {
    return this.getMatrix(coordinates, profile, {
      annotations: 'duration,distance',
      fallback_speed: fallbackSpeed,
    })
  }
}
