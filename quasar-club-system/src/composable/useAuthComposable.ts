import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouteEnum } from '@/enums/routesEnum'
import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthUseCases } from '@/composable/useAuthUseCases'

export function useAuthComposable() {
  const router = useRouter()
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const authUseCases = useAuthUseCases()

  const currentUser = computed(() => authStore.user)
  const isLoading = computed(() => authStore.isLoading)
  const isAdmin = computed(() => authStore.isAdmin)

  const isCurrentUserPowerUser = computed(() => {
    return teamStore.currentTeam?.powerusers?.includes(currentUser.value?.uid) || false
  })

  // Delegate to use cases with navigation logic
  const loginUser = async (email: string, password: string) => {
    try {
      await authUseCases.signIn(email, password)
      router.push(RouteEnum.DASHBOARD.path)
    } catch (error: unknown) {
      console.error('Login Error:', error)
      // Error notification already shown by use case
      // Composable just logs and re-throws for component
      throw error
    }
  }

  const logoutUser = async () => {
    try {
      await authUseCases.signOut()
      router.push(RouteEnum.LOGIN.path)
    } catch (error: unknown) {
      console.error('Logout Error:', error)
      // Error notification already shown by use case
      throw error
    }
  }

  const registerUser = async (email: string, password: string, name?: string) => {
    try {
      await authUseCases.signUp(email, password, name)
      router.push(RouteEnum.DASHBOARD.path)
    } catch (error: unknown) {
      console.error('Registration Error:', error)
      // Error notification already shown by use case
      throw error
    }
  }

  const initializeAuth = () => {
    authUseCases.initializeAuth()
  }

  const refreshUser = async () => {
    await authUseCases.refreshCurrentUser()
  }

  return {
    currentUser,
    isLoading,
    isAdmin,
    isCurrentUserPowerUser,
    loginUser,
    logoutUser,
    registerUser,
    initializeAuth,
    refreshUser,
  }
}
