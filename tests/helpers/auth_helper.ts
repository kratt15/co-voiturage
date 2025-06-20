import User from '#models/user'
import { ApiClient } from '@japa/api-client'
import { DateTime } from 'luxon'

/**
 * Helper pour créer un utilisateur admin de test
 */
export async function createTestAdmin(overrides: Partial<any> = {}): Promise<User> {
  return await User.create({
    firstName: 'Test',
    lastName: 'Admin',
    email: 'test@admin.com',
    phone: '0123456789',
    birthDate: DateTime.fromISO('1990-01-01'),
    password: 'password123',
    isAdmin: true,
    isVerified: true,
    emailVerified: true,
    isActive: true,
    logCount: 0,
    ...overrides,
  })
}

/**
 * Helper pour créer un utilisateur normal de test
 */
export async function createTestUser(overrides: Partial<any> = {}): Promise<User> {
  return await User.create({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@user.com',
    phone: '0123456788',
    birthDate: DateTime.fromISO('1995-01-01'),
    password: 'password123',
    isAdmin: false,
    isVerified: true,
    emailVerified: true,
    isActive: true,
    logCount: 0,
    ...overrides,
  })
}

/**
 * Helper pour authentifier un utilisateur dans les tests API
 * Note: Cette fonction est utilisée directement dans les tests avec client.loginAs(user)
 */
export function authenticateAs(client: any, user: User): any {
  return client.loginAs(user)
}
