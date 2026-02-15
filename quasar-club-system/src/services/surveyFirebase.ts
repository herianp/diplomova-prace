import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  getDoc,
  Unsubscribe,
} from 'firebase/firestore'
import { ISurvey, IVote, SurveyStatus, ISurveyNotificationData } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { ListenerError } from '@/errors'

export function useSurveyFirebase() {
  const getSurveysByTeamId = (teamId: string, callback: (surveys: ISurvey[]) => void): Unsubscribe => {
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))

    return onSnapshot(surveysQuery, (snapshot) => {
      const surveys = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISurvey))
      callback(surveys)
    }, (error) => {
      const listenerError = new ListenerError('surveys', 'errors.listener.failed', { code: error.code })
      console.warn('Survey listener error:', listenerError.message)
      callback([]) // Graceful degradation
    })
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      const surveyDoc = await getDoc(surveyRef)

      if (!surveyDoc.exists()) return null

      return { id: surveyDoc.id, ...surveyDoc.data() } as ISurvey
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      console.error('Error getting survey:', firestoreError.message)
      throw firestoreError
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    try {
      await deleteDoc(doc(db, 'surveys', surveyId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting survey:', firestoreError.message)
      throw firestoreError
    }
  }

  const addSurvey = async (newSurvey: ISurvey, teamMembers: string[] = []): Promise<ISurveyNotificationData> => {
    try {
      // Create the survey
      const surveyRef = await addDoc(collection(db, 'surveys'), {
        ...newSurvey,
        createdDate: new Date().getTime().toString(),
        votes: [],
      })

      // Return survey data for notifications (to be handled by composable)
      return {
        id: surveyRef.id,
        title: newSurvey.title,
        teamId: newSurvey.teamId,
        teamMembers
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding survey:', firestoreError.message)
      throw firestoreError
    }
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), updatedSurvey)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error updating survey:', firestoreError.message)
      throw firestoreError
    }
  }

  // Unified voting function - handles both new votes and vote updates
  const addOrUpdateVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      const existingVote = votes.find((vote) => vote.userUid === userUid)

      // If user already voted with the same value, no need to update
      if (existingVote && existingVote.vote === newVote) {
        return
      }

      let updatedVotes: IVote[]

      if (existingVote) {
        // Update existing vote
        updatedVotes = votes.map((vote) =>
          vote.userUid === userUid ? { ...vote, vote: newVote } : vote,
        )
      } else {
        // Add new vote
        updatedVotes = [...votes, { userUid, vote: newVote }]
      }

      await updateDoc(surveyRef, { votes: updatedVotes })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding/updating vote:', firestoreError.message)
      throw firestoreError
    }
  }

  // Legacy function names for backward compatibility (can be removed later)
  const addVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    return addOrUpdateVote(surveyId, userUid, newVote, votes)
  }

  const addSurveyVote = async (
    surveyId: string,
    userUid: string,
    newVote: boolean,
    votes: IVote[],
    _isUserVoteExists: IVote | undefined,
  ) => {
    // Convert legacy parameter to standard format and delegate to unified function
    return addOrUpdateVote(surveyId, userUid, newVote, votes)
  }

  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string) => {
    try {
      const updateData: Partial<ISurvey> = { status }

      if (status === SurveyStatus.CLOSED && verifiedBy) {
        updateData.verifiedAt = new Date()
        updateData.verifiedBy = verifiedBy
      }

      await updateDoc(doc(db, 'surveys', surveyId), updateData)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error updating survey status:', firestoreError.message)
      throw firestoreError
    }
  }

  const verifySurvey = async (surveyId: string, verifiedBy: string, updatedVotes?: IVote[]) => {
    try {
      const updateData: Partial<ISurvey> = {
        status: SurveyStatus.CLOSED,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy
      }

      if (updatedVotes) {
        updateData.votes = updatedVotes
      }

      await updateDoc(doc(db, 'surveys', surveyId), updateData)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error verifying survey:', firestoreError.message)
      throw firestoreError
    }
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), { votes })
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error updating survey votes:', firestoreError.message)
      throw firestoreError
    }
  }

  return {
    getSurveysByTeamId,
    getSurveyById,
    deleteSurvey,
    addSurvey,
    updateSurvey,
    addVote,
    addSurveyVote,
    updateSurveyStatus,
    verifySurvey,
    updateSurveyVotes,
  }
}