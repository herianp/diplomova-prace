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
    // Set up auth state listener
    const unsubscribe = authStateListener(async (user: User | null) => {
      if (user) {
        console.log(`User signed in: ${user.uid}`)
        authStore.setUser(user)
        
        // Set up team listener after user is authenticated
        try {
          // Add a small delay to ensure Firebase auth is fully ready
          setTimeout(async () => {
            try {
              const { setTeamListener } = useTeamUseCases()
              await setTeamListener(user.uid)
              console.log('Team listener set up successfully')
            } catch (error) {
              console.error('Error setting up team listener:', error)
              // If there's still an error, it might be a permissions issue
              // Log it but don't crash the app
            }
          }, 100)
        } catch (error) {
          console.error('Error in team setup timeout:', error)
        }
      } else {
        console.log("User signed out.")
        authStore.setUser(null)
        router.push(RouteEnum.HOME.path)
        teamStore.clearData()
      }
    })

    // Store unsubscribe function for cleanup
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