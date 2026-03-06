import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { ITeam, IUser, ISurvey } from '@/interfaces/interfaces'

export interface ICreatorResolution {
  teamId: string
  action: 'delete' | 'reassign'
  newCreatorUid?: string
}

export function useAdminFirebase() {
  const functions = getFunctions(undefined, 'europe-west1')

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

  const deleteUserAccount = async (data: { uid: string; creatorResolutions?: ICreatorResolution[] }): Promise<void> => {
    const callable = httpsCallable(functions, 'deleteUserAccount')
    await callable(data)
  }

  return {
    getAllTeams,
    getAllUsers,
    getAllSurveys,
    deleteUserAccount,
  }
}
