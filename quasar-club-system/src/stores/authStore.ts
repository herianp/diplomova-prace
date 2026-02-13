import { defineStore } from 'pinia'
import { ref } from 'vue'
import { User } from 'firebase/auth'

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(null)
  const isLoading = ref(false)
  const isAdmin = ref(false)

  // Readiness flags
  const isAuthReady = ref(false)
  const isTeamReady = ref(false)

  // Auth state listener unsubscribe function
  const authUnsubscribe = ref<(() => void) | null>(null)

  // Pure state mutations (no business logic)
  const setUser = (newUser: User | null) => {
    user.value = newUser
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setAdmin = (admin: boolean) => {
    isAdmin.value = admin
  }

  const setAuthReady = (ready: boolean) => {
    isAuthReady.value = ready
  }

  const setTeamReady = (ready: boolean) => {
    isTeamReady.value = ready
  }

  const setAuthUnsubscribe = (unsubscribeFn: (() => void) | null) => {
    authUnsubscribe.value = unsubscribeFn
  }

  const cleanup = () => {
    if (authUnsubscribe.value) {
      authUnsubscribe.value()
      authUnsubscribe.value = null
    }
    user.value = null
    isLoading.value = false
    isAdmin.value = false
    isAuthReady.value = false
    isTeamReady.value = false
  }

  return {
    // State
    user,
    isLoading,
    isAdmin,
    isAuthReady,
    isTeamReady,
    authUnsubscribe,
    // Pure state mutations
    setUser,
    setLoading,
    setAdmin,
    setAuthReady,
    setTeamReady,
    setAuthUnsubscribe,
    cleanup
  }
})
