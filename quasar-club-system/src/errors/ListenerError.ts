import { AppError } from './AppError'

/**
 * Error class for real-time listener failures
 */
export class ListenerError extends AppError {
  public readonly listenerType: string

  constructor(
    listenerType: string,
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
    this.listenerType = listenerType
  }
}
