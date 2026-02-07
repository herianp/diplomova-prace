import { defineStore } from 'pinia'
import { ref } from 'vue'
import { User } from 'firebase/auth'

const getInitialUser = () => ({
  uid: '1',
});

export const useAuthStore = defineStore("auth", () => {
  const user = ref<User | null>(getInitialUser())
  const isLoading = ref(false)
  const isAdmin = ref(false)

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
  }

  return {
    // State
    user,
    isLoading,
    isAdmin,
    authUnsubscribe,
    // Pure state mutations
    setUser,
    setLoading,
    setAdmin,
    setAuthUnsubscribe,
    cleanup
  }
})
