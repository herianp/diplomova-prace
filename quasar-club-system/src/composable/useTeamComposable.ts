import { ISurvey, IVote, SurveyStatus } from '@/interfaces/interfaces'
import { useDateHelpers } from '@/composable/useDateHelpers'
import { useNotifications } from '@/composable/useNotifications'
import { useTeamFirebase } from '@/services/teamFirebase'
import { useSurveyFirebase } from '@/services/surveyFirebase'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useTeamComposable(locale = 'en') {
  const { getDayName, getDateByDateAndTime, getFormatDate } = useDateHelpers(locale)
  const { createSurveyNotification } = useNotifications()
  const teamFirebase = useTeamFirebase()
  const surveyFirebase = useSurveyFirebase()

  const createTeam = async (teamName: string, userId: string) => {
    return teamFirebase.createTeam(teamName, userId)
  }

  const deleteTeam = async (teamId: string) => {
    return teamFirebase.deleteTeam(teamId)
  }

  const getTeamsByUserId = (userId: string, callback: (teams: any[]) => void) => {
    return teamFirebase.getTeamsByUserId(userId, callback)
  }

  const getTeamById = async (teamId: string) => {
    return teamFirebase.getTeamById(teamId)
  }

  const addCashboxTransaction = async (teamId: string, transactionData: any) => {
    return teamFirebase.addCashboxTransaction(teamId, transactionData)
  }

  // Survey operations - delegate to survey firebase with business logic
  const getSurveysByTeamId = (teamId: string, callback: (surveys: any[]) => void) => {
    return surveyFirebase.getSurveysByTeamId(teamId, callback)
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    return surveyFirebase.getSurveyById(surveyId)
  }

  const deleteSurvey = async (surveyId: string) => {
    return surveyFirebase.deleteSurvey(surveyId)
  }

  const addSurvey = async (newSurvey: ISurvey) => {
    try {
      // Get team data to access members for notifications
      const teamDoc = await getDoc(doc(db, 'teams', newSurvey.teamId))
      let teamMembers: string[] = []

      if (teamDoc.exists()) {
        const teamData = teamDoc.data()
        teamMembers = teamData.members || []
      }

      // Add survey via firebase
      const surveyData = await surveyFirebase.addSurvey(newSurvey, teamMembers)

      // Create notifications for all team members (business logic)
      if (teamMembers.length > 0) {
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
    return surveyFirebase.updateSurvey(surveyId, updatedSurvey)
  }

  const addVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    return surveyFirebase.addVote(surveyId, userUid, newVote, votes)
  }

  const addSurveyVote = async (
    surveyId: string,
    userUid: string,
    newVote: boolean,
    votes: IVote[],
    isUserVoteExists: IVote,
  ) => {
    return surveyFirebase.addSurveyVote(surveyId, userUid, newVote, votes, isUserVoteExists)
  }

  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string) => {
    return surveyFirebase.updateSurveyStatus(surveyId, status, verifiedBy)
  }

  const verifySurvey = async (surveyId: string, verifiedBy: string, updatedVotes?: IVote[]) => {
    return surveyFirebase.verifySurvey(surveyId, verifiedBy, updatedVotes)
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
    return surveyFirebase.updateSurveyVotes(surveyId, votes)
  }

  // UI/Business logic functions (keep here as they combine multiple concerns)
  const getDisplayedDateTime = (date: string, time: string): string => {
    console.log(`date ${date}, time ${time}`)
    const dateTime = getDateByDateAndTime(date, time)
    const dayName = getDayName(dateTime)
    const formatDate = getFormatDate(dateTime)
    return `${dayName}, ${formatDate}`
  }

  return {
    // Team operations
    createTeam,
    deleteTeam,
    getTeamsByUserId,
    getTeamById,
    addCashboxTransaction,
    // Survey operations
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
    // UI/Business logic
    getDisplayedDateTime,
  }
}
