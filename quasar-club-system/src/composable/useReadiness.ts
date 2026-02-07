import { computed, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore'

export function useReadiness() {
  const authStore = useAuthStore()

  const waitForAuth = (): Promise<void> => {
    if (authStore.isAuthReady) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = watch(
        () => authStore.isAuthReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        }
      )
    })
  }

  const waitForTeam = (): Promise<void> => {
    if (authStore.isTeamReady) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = watch(
        () => authStore.isTeamReady,
        (ready) => {
          if (ready) {
            stop()
            resolve()
          }
        }
      )
    })
  }

  return {
    waitForAuth,
    waitForTeam,
    isAuthReady: computed(() => authStore.isAuthReady),
    isTeamReady: computed(() => authStore.isTeamReady)
  }
}
