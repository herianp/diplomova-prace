import { boot } from 'quasar/wrappers'
import { notifyError } from 'src/services/notificationService'
import { AppError, AuthError, FirestoreError } from 'src/errors'
import { createLogger } from 'src/utils/logger'

const log = createLogger('errorHandler')

/**
 * Vue global error handler boot file
 * Catches all unhandled errors in Vue lifecycle and displays user-friendly notifications
 */
export default boot(({ app }) => {
  app.config.errorHandler = (err: unknown, instance, info) => {
    log.error('Global error handler caught error', {
      error: err instanceof Error ? err.message : String(err),
      info,
      errorType: err instanceof AppError ? err.constructor.name : 'Unknown'
    })

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
