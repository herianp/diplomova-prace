import { boot } from 'quasar/wrappers'
import { notifyError } from 'src/services/notificationService'
import { AppError, AuthError, FirestoreError } from 'src/errors'

/**
 * Vue global error handler boot file
 * Catches all unhandled errors in Vue lifecycle and displays user-friendly notifications
 */
export default boot(({ app }) => {
  app.config.errorHandler = (err: unknown, instance, info) => {
    console.error('Global error handler:', err, info)

    // Check error type and show appropriate notification
    if (err instanceof AuthError || err instanceof FirestoreError) {
      // Recoverable errors - show with context but no retry in global handler
      // Retry only makes sense when called from specific operation context
      notifyError(err.message, {
        context: err.context,
        retry: false
      })
    } else if (err instanceof AppError) {
      // Application errors (ValidationError, ListenerError)
      notifyError(err.message, {
        context: err.context,
        retry: false
      })
    } else {
      // Unknown errors - show generic message
      notifyError('errors.unexpected', {
        retry: false
      })
    }
  }
})
