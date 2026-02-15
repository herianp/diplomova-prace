import { useTeamStore } from '@/stores/teamStore'
import { useSurveyFirebase } from '@/services/surveyFirebase'
import { useNotifications } from '@/composable/useNotificationsComposable'
import { ISurvey, IVote, SurveyStatus } from '@/interfaces/interfaces'
import { getDoc, doc } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { notifyError } from '@/services/notificationService'
import { FirestoreError } from '@/errors'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'

export function useSurveyUseCases() {
  const log = createLogger('useSurveyUseCases')
  const teamStore = useTeamStore()
  const { createSurveyNotification } = useNotifications()
  const surveyFirebase = useSurveyFirebase()

  const setSurveysListener = (teamId: string) => {
    // Set up new listener
    const unsubscribe = surveyFirebase.getSurveysByTeamId(teamId, (surveysList) => {
      teamStore.setSurveys(surveysList)
    })

    // Register with listener registry
    listenerRegistry.register('surveys', unsubscribe, { teamId })
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    return surveyFirebase.getSurveyById(surveyId)
  }

  const deleteSurvey = async (surveyId: string): Promise<void> => {
    try {
      return await surveyFirebase.deleteSurvey(surveyId)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        // NO retry for destructive operations
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
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
    } catch (error: unknown) {
      log.error('Failed to add survey', {
        error: error instanceof Error ? error.message : String(error),
        teamId: newSurvey.teamId,
        title: newSurvey.title
      })
      if (error instanceof FirestoreError) {
        // Retry for transient errors only
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => addSurvey(newSurvey) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>): Promise<void> => {
    try {
      return await surveyFirebase.updateSurvey(surveyId, updatedSurvey)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => updateSurvey(surveyId, updatedSurvey) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const voteOnSurvey = async (surveyId: string, userUid: string, newVote: boolean) => {
    const survey = teamStore.surveys.find((s) => s.id === surveyId)
    if (survey) {
      try {
        await surveyFirebase.addOrUpdateVote(surveyId, userUid, newVote, survey.votes)
      } catch (error: unknown) {
        if (error instanceof FirestoreError) {
          const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
          notifyError(error.message, {
            retry: shouldRetry,
            onRetry: shouldRetry ? () => voteOnSurvey(surveyId, userUid, newVote) : undefined
          })
        } else {
          notifyError('errors.unexpected')
        }
        throw error
      }
    }
  }


  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string): Promise<void> => {
    try {
      return await surveyFirebase.updateSurveyStatus(surveyId, status, verifiedBy)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => updateSurveyStatus(surveyId, status, verifiedBy) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const verifySurvey = async (surveyId: string, verifiedBy: string, updatedVotes?: IVote[]): Promise<void> => {
    try {
      return await surveyFirebase.verifySurvey(surveyId, verifiedBy, updatedVotes)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => verifySurvey(surveyId, verifiedBy, updatedVotes) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]): Promise<void> => {
    try {
      return await surveyFirebase.updateSurveyVotes(surveyId, votes)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => updateSurveyVotes(surveyId, votes) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  return {
    setSurveysListener,
    getSurveyById,
    deleteSurvey,
    addSurvey,
    updateSurvey,
    voteOnSurvey,
    updateSurveyStatus,
    verifySurvey,
    updateSurveyVotes
  }
}