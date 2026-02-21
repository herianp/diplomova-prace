import { AppError } from './AppError'

/**
 * Error class for validation failures
 */
export class ValidationError extends AppError {
  public readonly field: string

  constructor(field: string, message: string) {
    super(message, { field })
    this.field = field
  }
}
