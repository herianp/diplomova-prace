import { useTeamStore } from '@/stores/teamStore'
import { useSurveyFirebase } from '@/services/surveyFirebase'
import { useNotifications } from '@/composable/useNotificationsComposable'
import { ISurvey, IVote, SurveyStatus } from '@/interfaces/interfaces'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'

export function useSurveyUseCases() {
  const teamStore = useTeamStore()
  const { createSurveyNotification } = useNotifications()
  const surveyFirebase = useSurveyFirebase()

  const setSurveysListener = (teamId: string) => {
    // Clear existing listener
    if (teamStore.unsubscribeSurveys) {
      teamStore.unsubscribeSurveys()
    }

    // Set up new listener
    const unsubscribe = surveyFirebase.getSurveysByTeamId(teamId, (surveysList) => {
      teamStore.setSurveys(surveysList)
    })

    // Store unsubscribe function
    teamStore.setSurveysUnsubscribe(unsubscribe)
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    return surveyFirebase.getSurveyById(surveyId)
  }

  const deleteSurvey = async (surveyId: string): Promise<void> => {
    return surveyFirebase.deleteSurvey(surveyId)
  }

  const addSurvey = async (newSurvey: ISurvey): Promise<void> => {
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
      }
    } catch (error) {
      console.error('Error adding survey:', error)
      throw error
    }
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>): Promise<void> => {
    return surveyFirebase.updateSurvey(surveyId, updatedSurvey)
  }

  const voteOnSurvey = async (surveyId: string, userUid: string, newVote: boolean) => {
    const survey = teamStore.surveys.find((s) => s.id === surveyId)
    if (survey) {
      await surveyFirebase.addVote(surveyId, userUid, newVote, survey.votes)
    }
  }

  const addSurveyVoteUseCase = async (surveyId: string, userUid: string, newVote: boolean) => {
    const survey = teamStore.surveys.find(s => s.id === surveyId)
    if (survey) {
      const isUserVoteExists = survey.votes.find(v => v.userUid === userUid)
      const votes = survey.votes || []

      await surveyFirebase.addSurveyVote(surveyId, userUid, newVote, votes, isUserVoteExists)
    }
  }

  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string): Promise<void> => {
    return surveyFirebase.updateSurveyStatus(surveyId, status, verifiedBy)
  }

  const verifySurvey = async (surveyId: string, verifiedBy: string, updatedVotes?: IVote[]): Promise<void> => {
    return surveyFirebase.verifySurvey(surveyId, verifiedBy, updatedVotes)
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]): Promise<void> => {
    return surveyFirebase.updateSurveyVotes(surveyId, votes)
  }

  return {
    setSurveysListener,
    getSurveyById,
    deleteSurvey,
    addSurvey,
    updateSurvey,
    voteOnSurvey,
    addSurveyVoteUseCase,
    updateSurveyStatus,
    verifySurvey,
    updateSurveyVotes
  }
}