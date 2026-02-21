/**
 * Base error class for the application
 * Extends Error with proper prototype chain for instanceof checks
 */
export class AppError extends Error {
  public readonly timestamp: Date
  public readonly context?: Record<string, unknown>

  constructor(message: string, context?: Record<string, unknown>) {
    super(message)
    this.name = this.constructor.name
    this.timestamp = new Date()
    this.context = context

    // Fix prototype chain for proper instanceof checks in ES5/ES6
    Object.setPrototypeOf(this, new.target.prototype)
  }
}
