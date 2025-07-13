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
  getDocs,
} from 'firebase/firestore'
import { ISurvey, IVote, SurveyStatus } from '@/interfaces/interfaces'
import { useDateHelpers } from '@/composable/useDateHelpers'
import { useNotifications } from '@/composable/useNotifications'

export function useTeamComposable(locale = 'en') {
  const { getDayName, getDateByDateAndTime, getFormatDate } = useDateHelpers(locale)
  const { createSurveyNotification } = useNotifications()
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

  async function deleteTeam(teamId: string) {
    try {
      await deleteDoc(doc(db, "teams", teamId));
      console.log(`Team ${teamId} deleted.`);
    } catch (error) {
      console.error("Error deleting survey:", error);
      throw error;
    }
  }

  const getTeamsByUserId = (userId: string, callback: (teams: any[]) => void) => {
    const teamsQuery = query(collection(db, 'teams'), where('members', 'array-contains', userId))

    return onSnapshot(teamsQuery, (snapshot) => {
      const teams = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(teams)
    })
  }

  const getSurveysByTeamId = (teamId: string, callback: (surveys: any[]) => void) => {
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))

    return onSnapshot(surveysQuery, (snapshot) => {
      const surveys = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      callback(surveys)
    })
  }

  const getTeamById = async (teamId: string) => {
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

  const deleteSurvey = async (surveyId: string) => {
    try {
      await deleteDoc(doc(db, 'surveys', surveyId))
      console.log(`Survey ${surveyId} deleted.`)
    } catch (error) {
      console.error('Error deleting survey:', error)
      throw error
    }
  }

  const addSurvey = async (newSurvey: ISurvey) => {
    try {
      // Create the survey
      const surveyRef = await addDoc(collection(db, 'surveys'), {
        ...newSurvey,
        createdDate: new Date().getTime().toString(),
        votes: [],
      })
      
      // Get team data to access members
      const teamDoc = await getDoc(doc(db, 'teams', newSurvey.teamId))
      if (teamDoc.exists()) {
        const teamData = teamDoc.data()
        const teamMembers = teamData.members || []
        
        // Create survey data for notifications
        const surveyData = {
          id: surveyRef.id,
          title: newSurvey.title,
          teamId: newSurvey.teamId
        }
        
        // Create notifications for all team members
        await createSurveyNotification(surveyData, teamMembers)
        console.log('Survey notifications created for', teamMembers.length, 'members')
      }
      
      console.log('Survey added:', newSurvey)
    } catch (error) {
      console.error('Error adding survey:', error)
      throw error
    }
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>) => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), updatedSurvey)
      console.log(`Survey ${surveyId} updated.`)
    } catch (error) {
      console.error('Error updating survey:', error)
      throw error
    }
  }

  const addVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      const existingVote = votes.find((vote) => vote.userUid === userUid)

      let updatedVotes = votes

      if (existingVote) {
        if (existingVote.vote === newVote) return
        updatedVotes = votes.map((vote) =>
          vote.userUid === userUid ? { ...vote, vote: newVote } : vote,
        )
      } else {
        updatedVotes.push({ userUid, vote: newVote })
      }

      await updateDoc(surveyRef, { votes: updatedVotes })
    } catch (error) {
      console.error('Error adding vote:', error)
      throw error
    }
  }

  const addSurveyVote = async (
    surveyId: string,
    userUid: string,
    newVote: boolean,
    votes: IVote[],
    isUserVoteExists: IVote,
  ) => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)

      if (isUserVoteExists) {
        if (isUserVoteExists.vote === newVote) return

        const updatedVotes = votes.map((vote) =>
          vote.userUid === userUid ? { ...vote, vote: newVote } : vote,
        )
        await updateDoc(surveyRef, { votes: updatedVotes })
      } else {
        const updatedVotes = [...votes, { userUid, vote: newVote }]
        await updateDoc(surveyRef, { votes: updatedVotes })
      }
    } catch (error) {
      console.error('Error updating survey vote:', error)
      throw error
    }
  }

  const addCashboxTransaction = async (teamId: string, transactionData: any) => {
    try {
      const cashboxTransactionsRef = collection(doc(db, 'teams', teamId), 'cashboxTransactions')
      await addDoc(cashboxTransactionsRef, transactionData)
    } catch (error) {
      console.error('Error adding cashbox transaction:', error)
      throw error
    }
  }

  const getDisplayedDateTime = (date: string, time: string): string => {
    console.log(`date ${date}, time ${time}`)
    const dateTime = getDateByDateAndTime(date, time)
    const dayName = getDayName(dateTime)
    const formatDate = getFormatDate(dateTime)
    return `${dayName}, ${formatDate}`
  }

  // Survey Status Management Functions
  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string) => {
    try {
      const updateData: any = { status }
      
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
      const updateData: any = {
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

  return {
    createTeam,
    getTeamsByUserId,
    getSurveysByTeamId,
    getTeamById,
    deleteSurvey,
    addSurvey,
    updateSurvey,
    addVote,
    addSurveyVote,
    addCashboxTransaction,
    getDisplayedDateTime,
    deleteTeam,
    // Survey Status Management
    updateSurveyStatus,
    verifySurvey,
    updateSurveyVotes,
    getSurveyById,
  }
}
