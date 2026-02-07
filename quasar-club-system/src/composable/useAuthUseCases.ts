import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthFirebase } from '@/services/authFirebase'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { RouteEnum } from '@/enums/routesEnum'
import { useRouter } from 'vue-router'
import { User } from 'firebase/auth'

export function useAuthUseCases() {
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const router = useRouter()
  const { authStateListener, loginUser, logoutUser, registerUser, refreshUser, getCurrentUser } = useAuthFirebase()

  const initializeAuth = () => {
    const unsubscribe = authStateListener(async (user: User | null) => {
      if (user) {
        authStore.setUser(user)
        authStore.setAuthReady(true)

        try {
          const { setTeamListener } = useTeamUseCases()
          await setTeamListener(user.uid)
        } catch (error: any) {
          console.error('Error setting up team listener:', error)
        }
      } else {
        authStore.setUser(null)
        authStore.setAuthReady(true)
        router.push(RouteEnum.HOME.path)
        teamStore.clearData()
      }
    })

    authStore.setAuthUnsubscribe(unsubscribe)
  }

  const signIn = async (email: string, password: string): Promise<User> => {
    authStore.setLoading(true)
    try {
      const user = await loginUser(email, password)
      authStore.setUser(user)
      return user
    } catch (error) {
      authStore.setUser(null)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, name?: string): Promise<User> => {
    authStore.setLoading(true)
    try {
      const user = await registerUser(email, password, name)
      authStore.setUser(user)
      return user
    } catch (error) {
      authStore.setUser(null)
      throw error
    } finally {
      authStore.setLoading(false)
    }
  }

  const signOut = async (): Promise<void> => {
    try {
      await logoutUser()
      authStore.setUser(null)
      teamStore.clearData()
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const refreshCurrentUser = async (): Promise<void> => {
    const user = await refreshUser()
    authStore.setUser(user)
  }

  const getCurrentAuthUser = (): User | null => {
    return getCurrentUser()
  }

  const cleanup = (): void => {
    authStore.cleanup()
  }

  return {
    initializeAuth,
    signIn,
    signUp,
    signOut,
    refreshCurrentUser,
    getCurrentAuthUser,
    cleanup
  }
}
