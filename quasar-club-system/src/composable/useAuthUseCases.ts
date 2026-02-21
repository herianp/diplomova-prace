import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthFirebase } from '@/services/authFirebase'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { RouteEnum } from '@/enums/routesEnum'
import { useRouter } from 'vue-router'
import { User } from 'firebase/auth'
import { notifyError } from '@/services/notificationService'
import { AuthError, FirestoreError } from '@/errors'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'

export function useAuthUseCases() {
  const log = createLogger('useAuthUseCases')
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const router = useRouter()
  const { authStateListener, authStateReady, loginUser, logoutUser, registerUser, refreshUser, getCurrentUser } = useAuthFirebase()

  /**
   * Initializes auth state using Promise-based coordination (Phase 2).
   * SEC-04: Auth state is confirmed via authStateReady() BEFORE any team
   * listeners start. The authStateListener callback (line 36) only triggers
   * setTeamListener AFTER auth state is fully resolved, eliminating
   * permission-denied flash on cold start.
   *
   * Verified: 2026-02-15 (Phase 5 planning)
   */
  const initializeAuth = async () => {
    // Step 1: Wait for initial auth state (Promise-based coordination)
    const initialUser = await authStateReady()

    if (initialUser) {
      authStore.setUser(initialUser)

      // Check admin custom claim
      const tokenResult = await initialUser.getIdTokenResult()
      authStore.setAdmin(tokenResult.claims.admin === true)
    }

    // Auth state is now resolved - safe to set ready flag
    authStore.setAuthReady(true)

    // Step 2: Set up continuous auth listener for ongoing changes
    const unsubscribe = authStateListener(async (user: User | null) => {
      if (user) {
        authStore.setUser(user)

        // Check admin custom claim
        const tokenResult = await user.getIdTokenResult()
        authStore.setAdmin(tokenResult.claims.admin === true)

        try {
          const { setTeamListener } = useTeamUseCases()
          await setTeamListener(user.uid)
        } catch (error: unknown) {
          log.error('Failed to setup team listener', {
            error: error instanceof Error ? error.message : String(error),
            userId: user.uid
          })
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
        authStore.setTeamReady(false)
        router.push(RouteEnum.HOME.path)
        teamStore.clearData()

        // Cleanup all listeners on logout (addresses LST-05)
        listenerRegistry.unregisterAll()
      }
    })

    // Register auth listener with centralized registry
    listenerRegistry.register('auth', unsubscribe)
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
          onRetry: shouldRetry ? async () => { await signIn(email, password) } : undefined
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
          onRetry: shouldRetry ? async () => { await signUp(email, password, name) } : undefined
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
      log.error('Failed to sign out', { error: error instanceof Error ? error.message : String(error) })
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
