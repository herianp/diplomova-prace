import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useTeamFirebase } from '@/services/teamFirebase'
import { useJoinRequestFirebase } from '@/services/joinRequestFirebase'
import { IJoinRequest, ITeam } from '@/interfaces/interfaces'
import { notifyError } from '@/services/notificationService'
import { FirestoreError } from '@/errors'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'
import { useRateLimiter } from '@/composable/useRateLimiter'

export function useTeamUseCases() {
  const log = createLogger('useTeamUseCases')
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const teamFirebase = useTeamFirebase()
  const { checkLimit, incrementUsage } = useRateLimiter()

  const setTeamListener = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      let isFirstCallback = true

      // Set up new listener
      const unsubscribe = teamFirebase.getTeamsByUserId(userId, (teamsList) => {
        teamStore.setTeams(teamsList)

        // Only auto-select on first load when no team is selected
        if (!teamStore.currentTeam && teamsList.length > 0) {
          teamStore.setCurrentTeam(teamsList[0])
        }

        // Set up join request listeners for all power-user teams
        if (isFirstCallback) {
          setPendingJoinRequestsListener()
        }

        if (isFirstCallback) {
          isFirstCallback = false
          authStore.setTeamReady(true)
          resolve()
        }
      }, (error) => {
        // Permission-denied: show user-visible notification (SEC-02)
        log.error('Team listener permission denied', { userId, error: error.message })
        notifyError('errors.firestore.permissionDenied', {
          retry: false
        })
        // Still resolve the promise so app doesn't hang
        if (isFirstCallback) {
          isFirstCallback = false
          authStore.setTeamReady(true)
          resolve()
        }
      })

      // Register with listener registry
      listenerRegistry.register('teams', unsubscribe, { userId })
    })
  }

  const createTeam = async (teamName: string, userId: string): Promise<void> => {
    // Rate limit check before reaching Firestore
    const limitResult = await checkLimit('teamCreation')
    if (!limitResult.allowed) {
      notifyError('rateLimits.teamCreationExceeded', {
        context: { limit: limitResult.limit }
      })
      throw new Error('rateLimits.teamCreationExceeded')
    }

    try {
      await teamFirebase.createTeam(teamName, userId)
      // Increment usage counter after successful creation
      void incrementUsage('teamCreation')
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => createTeam(teamName, userId) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const deleteTeam = async (teamId: string): Promise<void> => {
    try {
      await teamFirebase.deleteTeam(teamId)
      // Clear currentTeam if the deleted team was selected
      if (teamStore.currentTeam?.id === teamId) {
        const remaining = teamStore.teams.filter(t => t.id !== teamId)
        teamStore.setCurrentTeam(remaining.length > 0 ? remaining[0] : null)
      }
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        // NO retry for destructive operations
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const getTeamById = async (teamId: string): Promise<ITeam | null> => {
    return teamFirebase.getTeamById(teamId)
  }

  const getTeamByIdAndSetCurrentTeam = async (teamId: string): Promise<void> => {
    try {
      const team = await teamFirebase.getTeamById(teamId)
      teamStore.setCurrentTeam(team)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => getTeamByIdAndSetCurrentTeam(teamId) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const clearTeamData = () => {
    teamStore.clearData()
  }

  /**
   * Set up real-time listeners for pending join requests across all teams
   * where the current user is a power user. Merges results into one list.
   */
  const setPendingJoinRequestsListener = (): void => {
    const joinRequestFirebase = useJoinRequestFirebase()
    const currentUserId = authStore.user?.uid
    if (!currentUserId) return

    // Unregister previous listeners
    listenerRegistry.unregister('pendingJoinRequests')

    // Find all teams where user is a power user
    const powerUserTeams = teamStore.teams.filter(t => t.powerusers?.includes(currentUserId))
    if (powerUserTeams.length === 0) {
      teamStore.setPendingJoinRequests([])
      return
    }

    // Track requests per team and merge
    const requestsByTeam: Record<string, IJoinRequest[]> = {}
    const unsubscribes: (() => void)[] = []

    for (const team of powerUserTeams) {
      if (!team.id) continue
      const unsubscribe = joinRequestFirebase.getJoinRequestsByTeam(team.id, (requests) => {
        requestsByTeam[team.id!] = requests
        // Merge all teams' requests into a single list
        const allRequests = Object.values(requestsByTeam).flat()
        teamStore.setPendingJoinRequests(allRequests)
      })
      unsubscribes.push(unsubscribe)
    }

    // Register a single cleanup that unsubscribes all
    listenerRegistry.register('pendingJoinRequests', () => {
      unsubscribes.forEach(unsub => unsub())
    })
  }

  return {
    setTeamListener,
    createTeam,
    deleteTeam,
    getTeamById,
    getTeamByIdAndSetCurrentTeam,
    clearTeamData,
    setPendingJoinRequestsListener
  }
}
