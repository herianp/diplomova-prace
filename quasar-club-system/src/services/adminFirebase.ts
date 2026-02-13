import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { ITeam, IUser, ISurvey } from '@/interfaces/interfaces'

export function useAdminFirebase() {
  const getAllTeams = async (): Promise<ITeam[]> => {
    const snapshot = await getDocs(collection(db, 'teams'))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ITeam[]
  }

  const getAllUsers = async (): Promise<IUser[]> => {
    const snapshot = await getDocs(collection(db, 'users'))
    return snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() })) as IUser[]
  }

  const getAllSurveys = async (): Promise<ISurvey[]> => {
    const snapshot = await getDocs(collection(db, 'surveys'))
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ISurvey[]
  }

  return {
    getAllTeams,
    getAllUsers,
    getAllSurveys,
  }
}
