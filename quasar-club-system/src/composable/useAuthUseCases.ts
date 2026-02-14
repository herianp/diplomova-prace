import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthFirebase } from '@/services/authFirebase'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { RouteEnum } from '@/enums/routesEnum'
import { useRouter } from 'vue-router'
import { User } from 'firebase/auth'
import { notifyError } from '@/services/notificationService'
import { AuthError, FirestoreError } from '@/errors'

export function useAuthUseCases() {
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const router = useRouter()
  const { authStateListener, loginUser, logoutUser, registerUser, refreshUser, getCurrentUser } = useAuthFirebase()

  const initializeAuth = () => {
    const unsubscribe = authStateListener(async (user: User | null) => {
      if (user) {
        authStore.setUser(user)

        // Check admin custom claim
        const tokenResult = await user.getIdTokenResult()
        authStore.setAdmin(tokenResult.claims.admin === true)

        authStore.setAuthReady(true)

        try {
          const { setTeamListener } = useTeamUseCases()
          await setTeamListener(user.uid)
        } catch (error: unknown) {
          console.error('Error setting up team listener:', error)
          if (error instanceof FirestoreError) {
            const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
            notifyError(error.message, {
              retry: shouldRetry,
              onRetry: shouldRetry ? async () => {
                const { setTeamListener } = useTeamUseCases()
                await setTeamListener(user.uid)
              } : undefined
            })
          } else {
            notifyError('errors.unexpected')
          }
        }
      } else {
        authStore.setUser(null)
        authStore.setAdmin(false)
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
    } catch (error: unknown) {
      authStore.setUser(null)
      if (error instanceof AuthError) {
        // Show notification with retry only for network errors
        const shouldRetry = error.code === 'auth/network-request-failed'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => signIn(email, password) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
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
    } catch (error: unknown) {
      authStore.setUser(null)
      if (error instanceof AuthError) {
        // Show notification with retry only for network errors
        const shouldRetry = error.code === 'auth/network-request-failed'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => signUp(email, password, name) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
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
    } catch (error: unknown) {
      console.error('Error signing out:', error)
      if (error instanceof AuthError) {
        const shouldRetry = error.code === 'auth/network-request-failed'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => signOut() : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const refreshCurrentUser = async (): Promise<void> => {
    try {
      const user = await refreshUser()
      authStore.setUser(user)
    } catch (error: unknown) {
      if (error instanceof AuthError) {
        const shouldRetry = error.code === 'auth/network-request-failed'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => refreshCurrentUser() : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
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
