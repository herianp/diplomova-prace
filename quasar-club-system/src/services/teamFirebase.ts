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
  Unsubscribe,
} from 'firebase/firestore'
import { ITeam, ICashboxTransaction } from '@/interfaces/interfaces'

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
      console.log('Team created:', newTeam)
    } catch (error) {
      console.error('Error creating team:', error)
      throw error
    }
  }

  const deleteTeam = async (teamId: string) => {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      console.log(`Team ${teamId} deleted.`);
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

  return {
    createTeam,
    deleteTeam,
    getTeamsByUserId,
    getTeamById,
    addCashboxTransaction,
  }
}