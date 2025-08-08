import { useTeamStore } from '@/stores/teamStore'
import { useSurveyFirebase } from '@/services/surveyFirebase'

export function useSurveyUseCases() {
  const teamStore = useTeamStore()
  const { getSurveysByTeamId, addVote, addSurveyVote } = useSurveyFirebase()

  const setSurveysListener = (teamId: string) => {
    // Clear existing listener
    if (teamStore.unsubscribeSurveys) {
      teamStore.unsubscribeSurveys()
    }

    // Set up new listener
    const unsubscribe = getSurveysByTeamId(teamId, (surveysList) => {
      teamStore.setSurveys(surveysList)
    })

    // Store unsubscribe function
    teamStore.setSurveysUnsubscribe(unsubscribe)
  }

  const voteOnSurvey = async (surveyId: string, userUid: string, newVote: boolean) => {
    const survey = teamStore.surveys.find((s) => s.id === surveyId)
    if (survey) {
      await addVote(surveyId, userUid, newVote, survey.votes)
    }
  }

  const addSurveyVoteUseCase = async (surveyId: string, userUid: string, newVote: boolean) => {
    const survey = teamStore.surveys.find(s => s.id === surveyId)
    if (survey) {
      const isUserVoteExists = survey.votes.find(v => v.userUid === userUid)
      const votes = survey.votes || []

      await addSurveyVote(surveyId, userUid, newVote, votes, isUserVoteExists)
    }
  }

  return {
    setSurveysListener,
    voteOnSurvey,
    addSurveyVoteUseCase
  }
}