import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  writeBatch,
  Unsubscribe,
  DocumentReference,
  CollectionReference,
} from 'firebase/firestore'
import { ITeam, ITeamInvitation } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { FirestoreError } from '@/errors'
import { createLogger } from 'src/utils/logger'

const log = createLogger('teamFirebase')

export function useTeamFirebase() {
  const generateInvitationCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const createTeam = async (teamName: string, userId: string) => {
    try {
      const newTeam = {
        name: teamName,
        creator: userId,
        powerusers: [userId],
        members: [userId],
        invitationCode: generateInvitationCode(),
        surveys: [],
      }
      await addDoc(collection(db, 'teams'), newTeam)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to create team', { teamName, userId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      // Firestore batches are limited to 500 operations, use multiple batches if needed
      const collectionsToClean = ['surveys', 'messages', 'notifications', 'teamInvitations']

      for (const col of collectionsToClean) {
        const q = query(collection(db, col), where('teamId', '==', teamId))
        const snapshot = await getDocs(q)
        // Delete in batches of 499 (leaving room for the team doc in last batch)
        const docs = snapshot.docs
        for (let i = 0; i < docs.length; i += 499) {
          const batch = writeBatch(db)
          const chunk = docs.slice(i, i + 499)
          chunk.forEach((d) => batch.delete(d.ref))
          await batch.commit()
        }
      }

      // Delete cashbox subcollections (fineRules, fines, payments)
      const subcollections = ['fineRules', 'fines', 'payments', 'cashboxTransactions']
      for (const sub of subcollections) {
        const subRef = collection(doc(db, 'teams', teamId), sub)
        const subSnap = await getDocs(subRef)
        if (!subSnap.empty) {
          const batch = writeBatch(db)
          subSnap.docs.forEach((d) => batch.delete(d.ref))
          await batch.commit()
        }
      }

      // Delete the team document itself
      await deleteDoc(doc(db, 'teams', teamId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      log.error('Failed to delete team', { teamId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const getTeamsByUserId = (
    userId: string,
    callback: (teams: ITeam[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

    return onSnapshot(teamsQuery, (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ITeam))
      callback(teams)
    }, (error) => {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Teams listener failed', { userId, code: error.code, error: firestoreError.message })

      if (error.code === 'permission-denied' && onError) {
        onError(firestoreError)
      } else {
        callback([]) // Graceful degradation for transient errors
      }
    })
  }

  const getTeamById = async (teamId: string): Promise<ITeam | null> => {
    try {
      const teamRef = doc(db, 'teams', teamId)
      const teamDoc = await getDoc(teamRef)

      if (!teamDoc.exists()) return null

      const teamData = teamDoc.data()
      return { id: teamDoc.id, ...teamData } as ITeam
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to get team document', { teamId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const loadPendingInvitations = async (teamId: string): Promise<ITeamInvitation[]> => {
    try {
      const invitationsQuery = query(
        collection(db, 'teamInvitations'),
        where('teamId', '==', teamId),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(invitationsQuery)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ITeamInvitation[]
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to load pending invitations', { teamId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const findUserByEmail = async (email: string): Promise<{ id: string; data: Record<string, unknown> } | null> => {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('email', '==', email)
      )
      const snapshot = await getDocs(usersQuery)
      if (snapshot.empty) return null
      const userDoc = snapshot.docs[0]
      return { id: userDoc.id, data: userDoc.data() }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to find user by email', { email, error: firestoreError.message })
      throw firestoreError
    }
  }

  const checkExistingInvitation = async (teamId: string, email: string): Promise<boolean> => {
    try {
      const existingInviteQuery = query(
        collection(db, 'teamInvitations'),
        where('teamId', '==', teamId),
        where('inviteeEmail', '==', email),
        where('status', '==', 'pending')
      )
      const snapshot = await getDocs(existingInviteQuery)
      return !snapshot.empty
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to check existing invitation', { teamId, email, error: firestoreError.message })
      throw firestoreError
    }
  }

  const sendTeamInvitation = async (invitationData: Omit<ITeamInvitation, 'id'>): Promise<DocumentReference> => {
    try {
      return await addDoc(collection(db, 'teamInvitations'), invitationData)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to send team invitation', { teamId: invitationData.teamId, email: invitationData.inviteeEmail, error: firestoreError.message })
      throw firestoreError
    }
  }

  const cancelInvitation = async (invitationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teamInvitations', invitationId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      log.error('Failed to cancel invitation', { invitationId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const removeMember = async (teamId: string, memberUid: string): Promise<void> => {
    try {
      const teamRef = doc(db, 'teams', teamId)
      await updateDoc(teamRef, {
        members: arrayRemove(memberUid),
        powerusers: arrayRemove(memberUid)
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to remove member', { teamId, memberUid, error: firestoreError.message })
      throw firestoreError
    }
  }

  const promoteToPowerUser = async (teamId: string, memberUid: string): Promise<void> => {
    try {
      const teamRef = doc(db, 'teams', teamId)
      await updateDoc(teamRef, {
        powerusers: arrayUnion(memberUid)
      })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to promote to power user', { teamId, memberUid, error: firestoreError.message })
      throw firestoreError
    }
  }

  return {
    createTeam,
    deleteTeam,
    getTeamsByUserId,
    getTeamById,
    loadPendingInvitations,
    findUserByEmail,
    checkExistingInvitation,
    sendTeamInvitation,
    cancelInvitation,
    removeMember,
    promoteToPowerUser,
  }
}