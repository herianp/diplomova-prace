import { Notify, QNotifyCreateOptions } from 'quasar'
import { useI18n } from 'vue-i18n'

interface NotifyErrorOptions {
  context?: Record<string, unknown>
  retry?: boolean
  onRetry?: () => Promise<void>
  retryCount?: number
}

/**
 * Display error notification using Quasar Notify with optional retry support
 * @param messageKey - i18n translation key for the error message
 * @param options - Optional configuration for context, retry behavior, and retry handler
 */
export const notifyError = (
  messageKey: string,
  options: NotifyErrorOptions = {}
): void => {
  const { t } = useI18n()
  const maxRetries = 3
  const currentRetryCount = options.retryCount || 0

  const notifyConfig: QNotifyCreateOptions = {
    type: 'negative',
    message: t(messageKey, options.context || {}),
    position: 'top',
    timeout: options.retry ? 0 : 5000
  }

  if (options.retry && options.onRetry) {
    notifyConfig.actions = [
      {
        label: t('common.retry'),
        color: 'white',
        handler: async () => {
          try {
            await options.onRetry!()
            Notify.create({
              type: 'positive',
              message: t('common.retrySuccess'),
              position: 'top',
              timeout: 2000
            })
          } catch (err) {
            if (currentRetryCount < maxRetries) {
              notifyError(messageKey, {
                ...options,
                retryCount: currentRetryCount + 1
              })
            } else {
              Notify.create({
                type: 'negative',
                message: t('errors.maxRetriesReached'),
                position: 'top',
                timeout: 5000
              })
            }
          }
        }
      },
      { label: t('common.dismiss'), color: 'white' }
    ]
  }

  Notify.create(notifyConfig)
}

/**
 * Display success notification using Quasar Notify
 * @param messageKey - i18n translation key for the success message
 * @param context - Optional context data for i18n interpolation
 */
export const notifySuccess = (
  messageKey: string,
  context?: Record<string, unknown>
): void => {
  const { t } = useI18n()
  Notify.create({
    type: 'positive',
    message: t(messageKey, context || {}),
    position: 'top',
    timeout: 3000
  })
}
