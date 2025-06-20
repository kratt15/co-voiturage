/**
 * Helpers spécifiques pour les tests API fonctionnels
 */

import { ApiClient } from '@japa/api-client'
import User from '#models/user'

/**
 * Headers par défaut pour les requêtes API
 */
export const defaultHeaders = {
  'Accept': 'application/json',
  'Content-Type': 'application/json',
}

/**
 * Préfixe des routes API
 */
export const API_PREFIX = '/api/v1'

/**
 * Helper pour construire les URLs d'API
 */
export function apiUrl(path: string): string {
  return `${API_PREFIX}${path}`
}

/**
 * Helper pour les assertions de réponse API standard
 */
export async function assertApiResponse(
  response: any,
  expectedStatus: number,
  expectedMessage?: string
) {
  response.assertStatus(expectedStatus)

  if (expectedMessage) {
    response.assertBodyContains({
      message: expectedMessage,
    })
  }
}

/**
 * Helper pour les assertions d'erreur de validation
 */
export async function assertValidationError(response: any, expectedFields?: string[]) {
  response.assertStatus(422)
  response.assertBodyContains({
    errors: response.body().errors,
  })

  if (expectedFields) {
    const errors = response.body().errors
    expectedFields.forEach((field) => {
      response.assert.property(errors, field)
    })
  }
}

/**
 * Helper pour créer et authentifier un client API
 */
export function createAuthenticatedClient(user: User): ApiClient {
  return new ApiClient()
    .header('Accept', 'application/json')
    .loginAs(user)
}
