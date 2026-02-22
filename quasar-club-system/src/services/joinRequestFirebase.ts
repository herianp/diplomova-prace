import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore'
import { IJoinRequest, ITeam } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { FirestoreError } from '@/errors'
import { createLogger } from 'src/utils/logger'

const log = createLogger('joinRequestFirebase')

export function useJoinRequestFirebase() {
  /**
   * Real-time listener on all teams (for browse list — no filter).
   */
  const getAllTeams = (
    callback: (teams: ITeam[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    return onSnapshot(collection(db, 'teams'), (snapshot) => {
      const teams = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as ITeam))
      callback(teams)
    }, (error) => {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('getAllTeams listener failed', { code: error.code, error: firestoreError.message })
      if (onError) {
        onError(firestoreError)
      } else {
        callback([])
      }
    })
  }

  /**
   * Real-time listener on join requests for a given user.
   */
  const getJoinRequestsByUser = (
    userId: string,
    callback: (requests: IJoinRequest[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const q = query(collection(db, 'joinRequests'), where('userId', '==', userId))

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as IJoinRequest))
      callback(requests)
    }, (error) => {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('getJoinRequestsByUser listener failed', { userId, code: error.code, error: firestoreError.message })
      if (onError) {
        onError(firestoreError)
      } else {
        callback([])
      }
    })
  }

  /**
   * Real-time listener on pending join requests for a given team (for power user management).
   */
  const getJoinRequestsByTeam = (
    teamId: string,
    callback: (requests: IJoinRequest[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const q = query(
      collection(db, 'joinRequests'),
      where('teamId', '==', teamId),
      where('status', '==', 'pending')
    )

    return onSnapshot(q, (snapshot) => {
      const requests = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as IJoinRequest))
      callback(requests)
    }, (error) => {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('getJoinRequestsByTeam listener failed', { teamId, code: error.code, error: firestoreError.message })
      if (onError) {
        onError(firestoreError)
      } else {
        callback([])
      }
    })
  }

  /**
   * Create a new join request document.
   */
  const createJoinRequest = async (data: Omit<IJoinRequest, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(db, 'joinRequests'), data)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to create join request', { teamId: data.teamId, userId: data.userId, error: firestoreError.message })
      throw firestoreError
    }
  }

  /**
   * Update a join request status (approve or decline by power user).
   */
  const updateJoinRequestStatus = async (
    requestId: string,
    status: 'approved' | 'declined',
    respondedBy: string,
    respondedByName: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'joinRequests', requestId), {
        status,
        respondedAt: new Date(),
        respondedBy,
        respondedByName,
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to update join request status', { requestId, status, error: firestoreError.message })
      throw firestoreError
    }
  }

  /**
   * Cancel a join request (by the requesting user).
   */
  const cancelJoinRequest = async (requestId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'joinRequests', requestId), {
        status: 'cancelled',
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to cancel join request', { requestId, error: firestoreError.message })
      throw firestoreError
    }
  }

  /**
   * Count pending join requests for a user (used for max-5 validation).
   */
  const countPendingRequestsByUser = async (userId: string): Promise<number> => {
    try {
      const q = query(
        collection(db, 'joinRequests'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(q)
      return snapshot.size
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to count pending requests', { userId, error: firestoreError.message })
      throw firestoreError
    }
  }

  /**
   * Add a user to a team's members array (approval action).
   */
  const addMemberToTeam = async (teamId: string, userId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, 'teams', teamId), {
        members: arrayUnion(userId),
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to add member to team', { teamId, userId, error: firestoreError.message })
      throw firestoreError
    }
  }

  return {
    getAllTeams,
    getJoinRequestsByUser,
    getJoinRequestsByTeam,
    createJoinRequest,
    updateJoinRequestStatus,
    cancelJoinRequest,
    countPendingRequestsByUser,
    addMemberToTeam,
  }
}
