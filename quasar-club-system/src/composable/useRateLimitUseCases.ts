import { useRateLimitFirebase } from '@/services/rateLimitFirebase'
import { useRateLimitStore } from '@/stores/rateLimitStore'
import { listenerRegistry } from '@/services/listenerRegistry'
import { IRateLimitConfig } from '@/interfaces/interfaces'

export function useRateLimitUseCases() {
  const rateLimitFirebase = useRateLimitFirebase()
  const rateLimitStore = useRateLimitStore()

  /**
   * Load the rate limit config from Firestore and set it in the store.
   */
  const loadConfig = async (): Promise<void> => {
    const config = await rateLimitFirebase.getRateLimitConfig()
    rateLimitStore.setConfig(config)
  }

  /**
   * Set up a real-time listener on the rate limit config document.
   * Registers the listener in the registry under 'rateLimits'.
   */
  const startConfigListener = (): void => {
    const unsubscribe = rateLimitFirebase.setRateLimitListener((config) => {
      rateLimitStore.setConfig(config)
    })

    listenerRegistry.register('rateLimits', unsubscribe, { scope: 'global' })
  }

  /**
   * Update a single rate limit field in Firestore.
   * Validates that value is greater than 0.
   * The store updates automatically via the real-time listener.
   */
  const updateLimit = async (field: keyof IRateLimitConfig, value: number): Promise<void> => {
    if (value <= 0) {
      throw new Error(`Rate limit value must be greater than 0 (got ${value})`)
    }
    await rateLimitFirebase.updateRateLimitConfig(field, value)
  }

  /**
   * Return the default rate limit configuration values.
   */
  const getDefaults = (): IRateLimitConfig => {
    return {
      teamCreation: 5,
      messages: 50,
      joinRequests: 5,
      surveys: 10,
      fines: 500,
    }
  }

  return {
    loadConfig,
    startConfigListener,
    updateLimit,
    getDefaults,
  }
}
