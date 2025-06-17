import { Exception } from '@adonisjs/core/exceptions'

export default class PrimaryException extends Exception {
  static status = 400
}