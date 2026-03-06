import { db } from '@/firebase/config'
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { ITeam, IUser, ISurvey } from '@/interfaces/interfaces'

export interface ICreatorResolution {
  teamId: string
  action: 'delete' | 'reassign'
  newCreatorUid?: string
}

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

  const softDeleteUser = async (uid: string, deletedByUid: string): Promise<void> => {
    await updateDoc(doc(db, 'users', uid), {
      status: 'deleted',
      deletedAt: new Date(),
      deletedBy: deletedByUid,
    })
  }

  const reassignTeamCreator = async (teamId: string, newCreatorUid: string): Promise<void> => {
    await updateDoc(doc(db, 'teams', teamId), {
      creator: newCreatorUid,
      powerusers: arrayUnion(newCreatorUid),
    })
  }

  return {
    getAllTeams,
    getAllUsers,
    getAllSurveys,
    softDeleteUser,
    reassignTeamCreator,
  }
}
