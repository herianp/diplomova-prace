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
} from 'firebase/firestore'
import { ITeam, ITeamInvitation } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { ListenerError } from '@/errors'

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
      console.error('Error creating team:', firestoreError.message)
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
      console.error('Error deleting team:', firestoreError.message)
      throw firestoreError
    }
  }

  const getTeamsByUserId = (userId: string, callback: (teams: ITeam[]) => void): Unsubscribe => {
    const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

    return onSnapshot(teamsQuery, (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(teams)
    }, (error) => {
      const listenerError = new ListenerError('teams', 'errors.listener.failed', { originalError: error.message })
      console.error('Team listener error:', listenerError.message)
      callback([]) // Graceful degradation
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
      console.error('Error getting team document:', firestoreError.message)
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
      console.error('Error loading pending invitations:', firestoreError.message)
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
      console.error('Error finding user by email:', firestoreError.message)
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
      console.error('Error checking existing invitation:', firestoreError.message)
      throw firestoreError
    }
  }

  const sendTeamInvitation = async (invitationData: Omit<ITeamInvitation, 'id'>): Promise<DocumentReference> => {
    try {
      return await addDoc(collection(db, 'teamInvitations'), invitationData)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error sending team invitation:', firestoreError.message)
      throw firestoreError
    }
  }

  const cancelInvitation = async (invitationId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teamInvitations', invitationId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error canceling invitation:', firestoreError.message)
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
      console.error('Error removing member:', firestoreError.message)
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
      console.error('Error promoting to power user:', firestoreError.message)
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