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

export function useSurveyFirebase() {
  const getSurveysByTeamId = (teamId: string, callback: (surveys: ISurvey[]) => void): Unsubscribe => {
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))

    return onSnapshot(surveysQuery, (snapshot) => {
      const surveys = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(surveys)
    }, (error) => {
      console.error('Error in surveys listener:', error)
      // If there's a permission error, call callback with empty array
      // This prevents the app from crashing and allows it to continue functioning
      if (error.code === 'permission-denied') {
        console.warn('Permission denied for surveys - calling callback with empty array')
        callback([])
      }
    })
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      const surveyDoc = await getDoc(surveyRef)

      if (!surveyDoc.exists()) return null

      return { id: surveyDoc.id, ...surveyDoc.data() } as ISurvey
    } catch (error) {
      console.error('Error getting survey:', error)
      throw error
    }
  }

  const deleteSurvey = async (surveyId: string) => {
    try {
      await deleteDoc(doc(db, 'surveys', surveyId))
      console.log(`Survey ${surveyId} deleted.`)
    } catch (error) {
      console.error('Error deleting survey:', error)
      throw error
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
    } catch (error) {
      console.error('Error adding survey:', error)
      throw error
    }
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), updatedSurvey)
      console.log(`Survey ${surveyId} updated.`)
    } catch (error) {
      console.error('Error updating survey:', error)
      throw error
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
    } catch (error) {
      console.error('Error adding/updating vote:', error)
      throw error
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
    isUserVoteExists: IVote,
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
      console.log(`Survey ${surveyId} status updated to ${status}`)
    } catch (error) {
      console.error('Error updating survey status:', error)
      throw error
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
      console.log(`Survey ${surveyId} verified by ${verifiedBy}`)
    } catch (error) {
      console.error('Error verifying survey:', error)
      throw error
    }
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), { votes })
      console.log(`Survey ${surveyId} votes updated`)
    } catch (error) {
      console.error('Error updating survey votes:', error)
      throw error
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