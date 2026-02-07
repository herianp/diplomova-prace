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
  Unsubscribe,
  DocumentReference,
} from 'firebase/firestore'
import { ITeam, ICashboxTransaction, ITeamInvitation } from '@/interfaces/interfaces'

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
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
    } catch (error) {
      console.error("Error deleting team:", error);
      throw error;
    }
  }

  const getTeamsByUserId = (userId: string, callback: (teams: ITeam[]) => void): Unsubscribe => {
    const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

    return onSnapshot(teamsQuery, (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(teams)
    })
  }

  const getTeamById = async (teamId: string): Promise<ITeam | null> => {
    try {
      const teamRef = doc(db, 'teams', teamId)
      const teamDoc = await getDoc(teamRef)

      if (!teamDoc.exists()) return null

      const teamData = teamDoc.data()
      const cashboxTransactionsRef = collection(teamRef, 'cashboxTransactions')
      const cashboxTransactionsSnap = await getDocs(cashboxTransactionsRef)

      const cashboxTransactions = cashboxTransactionsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      return { ...teamData, cashboxTransactions }
    } catch (error) {
      console.error('Error getting team document:', error)
      throw error
    }
  }

  const addCashboxTransaction = async (teamId: string, transactionData: ICashboxTransaction): Promise<void> => {
    try {
      const cashboxTransactionsRef = collection(doc(db, 'teams', teamId), 'cashboxTransactions')
      await addDoc(cashboxTransactionsRef, transactionData)
    } catch (error) {
      console.error('Error adding cashbox transaction:', error)
      throw error
    }
  }

  const loadPendingInvitations = async (teamId: string): Promise<ITeamInvitation[]> => {
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
  }

  const findUserByEmail = async (email: string): Promise<{ id: string; data: Record<string, unknown> } | null> => {
    const usersQuery = query(
      collection(db, 'users'),
      where('email', '==', email)
    )
    const snapshot = await getDocs(usersQuery)
    if (snapshot.empty) return null
    const userDoc = snapshot.docs[0]
    return { id: userDoc.id, data: userDoc.data() }
  }

  const checkExistingInvitation = async (teamId: string, email: string): Promise<boolean> => {
    const existingInviteQuery = query(
      collection(db, 'teamInvitations'),
      where('teamId', '==', teamId),
      where('inviteeEmail', '==', email),
      where('status', '==', 'pending')
    )
    const snapshot = await getDocs(existingInviteQuery)
    return !snapshot.empty
  }

  const sendTeamInvitation = async (invitationData: Omit<ITeamInvitation, 'id'>): Promise<DocumentReference> => {
    return await addDoc(collection(db, 'teamInvitations'), invitationData)
  }

  const cancelInvitation = async (invitationId: string): Promise<void> => {
    await deleteDoc(doc(db, 'teamInvitations', invitationId))
  }

  const removeMember = async (teamId: string, memberUid: string): Promise<void> => {
    const teamRef = doc(db, 'teams', teamId)
    await updateDoc(teamRef, {
      members: arrayRemove(memberUid),
      powerusers: arrayRemove(memberUid)
    })
  }

  const promoteToPowerUser = async (teamId: string, memberUid: string): Promise<void> => {
    const teamRef = doc(db, 'teams', teamId)
    await updateDoc(teamRef, {
      powerusers: arrayUnion(memberUid)
    })
  }

  return {
    createTeam,
    deleteTeam,
    getTeamsByUserId,
    getTeamById,
    addCashboxTransaction,
    loadPendingInvitations,
    findUserByEmail,
    checkExistingInvitation,
    sendTeamInvitation,
    cancelInvitation,
    removeMember,
    promoteToPowerUser,
  }
}