import { AppError } from './AppError'

/**
 * Error class for Firebase authentication failures
 */
export class AuthError extends AppError {
  public readonly code: string

  constructor(code: string, message: string, context?: Record<string, unknown>) {
    super(message, context)
    this.code = code
  }
}
