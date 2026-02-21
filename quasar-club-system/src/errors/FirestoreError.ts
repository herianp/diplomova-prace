import { AppError } from './AppError'

/**
 * Error class for Firestore database failures
 */
export class FirestoreError extends AppError {
  public readonly code: string
  public readonly operation: 'read' | 'write' | 'delete'

  constructor(
    code: string,
    operation: 'read' | 'write' | 'delete',
    message: string,
    context?: Record<string, unknown>
  ) {
    super(message, context)
    this.code = code
    this.operation = operation
  }
}
