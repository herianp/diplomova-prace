import { defineStore } from 'pinia'
import { ref } from 'vue'
import { IRateLimitConfig } from '@/interfaces/interfaces'

export const useRateLimitStore = defineStore('rateLimit', () => {
  // State
  const config = ref<IRateLimitConfig | null>(null)
  const isLoaded = ref(false)

  // Pure state mutations (no business logic)
  const setConfig = (newConfig: IRateLimitConfig) => {
    config.value = newConfig
    isLoaded.value = true
  }

  const clearConfig = () => {
    config.value = null
    isLoaded.value = false
  }

  return {
    // State
    config,
    isLoaded,
    // Pure state mutations
    setConfig,
    clearConfig,
  }
})
