import axios from 'axios'
import Env from '#start/env'

interface Coordinates {
  longitude: number
  latitude: number
}

interface ForwardGeocodingOptions {
  country?: string
  proximity?: Coordinates
  bbox?: [number, number, number, number]
  limit?: number
  language?: string
  types?: string[]
}

interface ReverseGeocodingOptions {
  language?: string
  types?: string[]
}

interface GeocodingFeature {
  id: string
  type: string
  geometry: {
    type: string
    coordinates: [number, number]
  }
  properties: {
    mapbox_id: string
    feature_type: string
    full_address: string
    name: string
    name_preferred: string
    coordinates: {
      longitude: number
      latitude: number
      accuracy?: string
    }
    place_formatted?: string
    context?: any
    [key: string]: any // Pour les propriétés additionnelles
  }
}

interface GeocodingResponse {
  type: string
  query: string[] | [number, number]
  features: GeocodingFeature[]
  attribution: string
}

export class MapboxRouteGeocodingService {
  public url = Env.get('MAPBOX_BASE_URL')
  public accessToken = Env.get('MAPBOX_ACCESS_TOKEN')

  /**
   * Forward Geocoding - Convertir une adresse en coordonnées
   * @param query Texte de recherche (adresse, nom de lieu, etc.)
   * @param options Options de géocodage
   */
  async forwardGeocode(
    query: string,
    options: ForwardGeocodingOptions = {}
  ): Promise<GeocodingResponse> {
    const params = new URLSearchParams({
      q: query,
      access_token: this.accessToken,
    })

    // Ajouter les options si présentes
    if (options.country) params.append('country', options.country)
    if (options.proximity) {
      params.append('proximity', `${options.proximity.longitude},${options.proximity.latitude}`)
    }
    if (options.bbox) {
      params.append('bbox', options.bbox.join(','))
    }
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.language) params.append('language', options.language)
    if (options.types) params.append('types', options.types.join(','))

    const url = `${this.url}/search/geocode/v6/forward?${params}`

    try {
      const response = await axios.get<GeocodingResponse>(url)
      return response.data
    } catch (error) {
      console.error('Erreur lors du géocodage direct:', error)
      throw new Error("Impossible de convertir l'adresse en coordonnées")
    }
  }

  /**
   * Reverse Geocoding - Convertir des coordonnées en adresse
   * @param coordinates Coordonnées GPS
   * @param options Options de géocodage inverse
   */
  async reverseGeocode(
    coordinates: Coordinates,
    options: ReverseGeocodingOptions = {}
  ): Promise<GeocodingResponse> {
    const params = new URLSearchParams({
      longitude: coordinates.longitude.toString(),
      latitude: coordinates.latitude.toString(),
      access_token: this.accessToken,
    })

    // Ajouter les options si présentes
    if (options.language) params.append('language', options.language)
    if (options.types) params.append('types', options.types.join(','))

    const url = `${this.url}/search/geocode/v6/reverse?${params}`

    try {
      const response = await axios.get<GeocodingResponse>(url)
      return response.data
    } catch (error) {
      console.error('Erreur lors du géocodage inverse:', error)
      throw new Error('Impossible de convertir les coordonnées en adresse')
    }
  }

  /**
   * Méthode simplifiée pour obtenir les coordonnées d'une adresse
   * @param address Adresse à géocoder
   */
  async getCoordinates(address: string): Promise<Coordinates | null> {
    try {
      const result = await this.forwardGeocode(address, {
        limit: 1,
        language: 'fr',
        country: 'fr',
      })

      if (result.features && result.features.length > 0) {
        const { longitude, latitude } = result.features[0].properties.coordinates
        return { longitude, latitude }
      }

      return null
    } catch (error) {
      console.error('Erreur lors de la récupération des coordonnées:', error)
      return null
    }
  }

  /**
   * Méthode simplifiée pour obtenir l'adresse à partir de coordonnées
   * @param coordinates Coordonnées GPS
   */
  async getAddress(coordinates: Coordinates): Promise<{} | null> {
    try {
      const result = await this.reverseGeocode(coordinates, {
        language: 'fr',
      })

      if (result.features && result.features.length > 0) {
        // Utilise full_address qui contient l'adresse complète formatée dans la v6
        return result.features[0].properties
      }

      return null
    } catch (error) {
      console.error("Erreur lors de la récupération de l'adresse:", error)
      return null
    }
  }

  /**
   * Méthode de géocodage compatible avec l'ancienne API (pour rétrocompatibilité)
   * @deprecated Utilisez forwardGeocode à la place
   */
  async getGeocoding(query: string) {
    return this.forwardGeocode(query)
  }
}
