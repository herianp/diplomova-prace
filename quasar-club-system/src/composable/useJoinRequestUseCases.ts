import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useJoinRequestFirebase } from '@/services/joinRequestFirebase'
import { useAuditLogFirebase } from '@/services/auditLogFirebase'
import { IJoinRequest, ITeam } from '@/interfaces/interfaces'
import { notifyError } from '@/services/notificationService'
import { FirestoreError } from '@/errors'
import { createLogger } from 'src/utils/logger'
import { Unsubscribe } from 'firebase/firestore'

const log = createLogger('useJoinRequestUseCases')

export function useJoinRequestUseCases() {
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const joinRequestFirebase = useJoinRequestFirebase()

  /**
   * Send a join request for the current user to a team.
   * Validates: max 5 pending requests, user is not already a member.
   */
  const sendJoinRequest = async (teamId: string, teamName: string): Promise<void> => {
    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    // Check if user is already a member of the team
    const isMember = teamStore.teams.some((t) => t.id === teamId)
    if (isMember) {
      throw new Error('You are already a member of this team')
    }

    // Check max 5 pending requests
    try {
      const pendingCount = await joinRequestFirebase.countPendingRequestsByUser(currentUser.uid)
      if (pendingCount >= 5) {
        throw new Error('You already have 5 pending join requests. Cancel one before sending a new request.')
      }
    } catch (error: unknown) {
      if (error instanceof Error && !((error as { code?: string }).code)) {
        // Re-throw validation errors (not FirestoreErrors)
        throw error
      }
      if (error instanceof FirestoreError) {
        notifyError(error.message)
        throw error
      }
      throw error
    }

    try {
      const joinRequest: Omit<IJoinRequest, 'id'> = {
        userId: currentUser.uid,
        userDisplayName: currentUser.displayName || currentUser.email || currentUser.uid,
        userEmail: currentUser.email || '',
        teamId,
        teamName,
        status: 'pending',
        createdAt: new Date(),
      }
      await joinRequestFirebase.createJoinRequest(joinRequest)
      log.info('Join request sent', { teamId, userId: currentUser.uid })
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  /**
   * Cancel a pending join request (by the requesting user).
   */
  const cancelJoinRequest = async (requestId: string): Promise<void> => {
    try {
      await joinRequestFirebase.cancelJoinRequest(requestId)
      log.info('Join request cancelled', { requestId })
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  /**
   * Approve a join request: add user to team, update request status, write audit log.
   */
  const approveJoinRequest = async (request: IJoinRequest): Promise<void> => {
    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    try {
      await joinRequestFirebase.addMemberToTeam(request.teamId, request.userId)
      await joinRequestFirebase.updateJoinRequestStatus(
        request.id!,
        'approved',
        currentUser.uid,
        currentUser.displayName || currentUser.email || currentUser.uid
      )

      // Non-blocking audit log
      const { writeAuditLog } = useAuditLogFirebase()
      writeAuditLog({
        teamId: request.teamId,
        operation: 'joinRequest.approve',
        actorUid: currentUser.uid,
        actorDisplayName: currentUser.displayName || currentUser.email || currentUser.uid,
        timestamp: new Date(),
        entityId: request.userId,
        entityType: 'member',
      })

      log.info('Join request approved', { requestId: request.id, teamId: request.teamId, userId: request.userId })
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  /**
   * Decline a join request: update request status, write audit log.
   */
  const declineJoinRequest = async (request: IJoinRequest): Promise<void> => {
    const currentUser = authStore.user
    if (!currentUser) {
      throw new Error('User not authenticated')
    }

    try {
      await joinRequestFirebase.updateJoinRequestStatus(
        request.id!,
        'declined',
        currentUser.uid,
        currentUser.displayName || currentUser.email || currentUser.uid
      )

      // Non-blocking audit log
      const { writeAuditLog } = useAuditLogFirebase()
      writeAuditLog({
        teamId: request.teamId,
        operation: 'joinRequest.decline',
        actorUid: currentUser.uid,
        actorDisplayName: currentUser.displayName || currentUser.email || currentUser.uid,
        timestamp: new Date(),
        entityId: request.userId,
        entityType: 'member',
      })

      log.info('Join request declined', { requestId: request.id, teamId: request.teamId, userId: request.userId })
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  /**
   * Real-time listener for all teams (for browse list).
   */
  const setAllTeamsListener = (callback: (teams: ITeam[]) => void): Unsubscribe => {
    return joinRequestFirebase.getAllTeams(callback)
  }

  /**
   * Real-time listener for the current user's join requests.
   */
  const setUserJoinRequestsListener = (callback: (requests: IJoinRequest[]) => void): Unsubscribe => {
    const userId = authStore.user?.uid
    if (!userId) {
      log.error('setUserJoinRequestsListener called without authenticated user')
      callback([])
      return () => {}
    }
    return joinRequestFirebase.getJoinRequestsByUser(userId, callback)
  }

  /**
   * Real-time listener for pending join requests for a given team (power user management).
   */
  const setTeamJoinRequestsListener = (
    teamId: string,
    callback: (requests: IJoinRequest[]) => void
  ): Unsubscribe => {
    return joinRequestFirebase.getJoinRequestsByTeam(teamId, callback)
  }

  return {
    sendJoinRequest,
    cancelJoinRequest,
    approveJoinRequest,
    declineJoinRequest,
    setAllTeamsListener,
    setUserJoinRequestsListener,
    setTeamJoinRequestsListener,
  }
}
