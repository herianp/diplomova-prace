import { ref, computed, watch } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthStore } from '@/stores/authStore'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import {
  isSurveyExpired,
  getSurveyStatus,
  getSurveysNeedingVerification,
  needsVerification
} from '@/utils/surveyStatusUtils'
import { ISurvey, SurveyStatus } from '@/interfaces/interfaces'
import { createLogger } from 'src/utils/logger'

/**
 * Composable for managing survey status and automated expiration checks
 */
export function useSurveyStatusManager() {
  const log = createLogger('useSurveyStatusManager')
  const teamStore = useTeamStore()
  const authStore = useAuthStore()
  const { updateSurveyStatus } = useSurveyUseCases()
  
  // State
  const isProcessingExpiration = ref(false)
  const lastExpirationCheck = ref<Date | null>(null)
  
  // Computed
  const currentUser = computed(() => authStore.user)
  const currentTeam = computed(() => teamStore.currentTeam)
  const surveys = computed(() => teamStore.surveys || [])
  const isPowerUser = computed(() => {
    const uid = currentUser.value?.uid
    return uid ? (currentTeam.value?.powerusers?.includes(uid) ?? false) : false
  })
  
  // Get surveys that need verification (for Power Users)
  const surveysNeedingVerification = computed(() => {
    if (!isPowerUser.value) return []
    return getSurveysNeedingVerification(surveys.value)
  })
  
  // Get surveys by status
  const activeSurveys = computed(() => {
    const powerUser = isPowerUser.value
    return surveys.value.filter(survey =>
      getSurveyStatus(survey, powerUser) === SurveyStatus.ACTIVE
    )
  })

  const awaitingVerificationSurveys = computed(() => {
    const powerUser = isPowerUser.value
    return surveys.value.filter(survey =>
      getSurveyStatus(survey, powerUser) === SurveyStatus.AWAITING_VERIFICATION
    )
  })

  const closedSurveys = computed(() => {
    const powerUser = isPowerUser.value
    return surveys.value.filter(survey =>
      getSurveyStatus(survey, powerUser) === SurveyStatus.CLOSED
    )
  })
  
  // Notification counts for Power Users
  const verificationNotificationCount = computed(() => 
    surveysNeedingVerification.value.length
  )
  
  /**
   * Process expired surveys and update their status in the database
   */
  const processExpiredSurveys = async (): Promise<void> => {
    if (isProcessingExpiration.value || !currentUser.value) return
    
    try {
      isProcessingExpiration.value = true
      
      const expiredSurveys = surveys.value.filter(survey => 
        isSurveyExpired(survey) && !survey.status // Only process surveys without explicit status
      )
      
      // Update expired surveys based on user role
      // Note: We set status based on the current user's role when processing
      // In a real application, you might want to set status based on team power users
      for (const survey of expiredSurveys) {
        try {
          if (isPowerUser.value) {
            // For Power Users, set to awaiting verification
            await updateSurveyStatus(survey.id!, SurveyStatus.AWAITING_VERIFICATION)
          } else {
            // For Normal Users, set to closed
            await updateSurveyStatus(survey.id!, SurveyStatus.CLOSED)
          }
        } catch (error) {
          log.error('Failed to update survey status', {
            error: error instanceof Error ? error.message : String(error),
            surveyId: survey.id
          })
        }
      }

      lastExpirationCheck.value = new Date()

    } catch (error) {
      log.error('Failed to process expired surveys', { error: error instanceof Error ? error.message : String(error) })
    } finally {
      isProcessingExpiration.value = false
    }
  }
  
  /**
   * Check for expired surveys and process them if needed
   */
  const checkForExpiredSurveys = async (): Promise<void> => {
    const now = new Date()
    const lastCheck = lastExpirationCheck.value
    
    // Only check every 5 minutes to avoid excessive API calls
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000)
    
    if (!lastCheck || lastCheck < fiveMinutesAgo) {
      await processExpiredSurveys()
    }
  }
  
  /**
   * Force check for expired surveys (useful for manual triggers)
   */
  const forceExpirationCheck = async (): Promise<void> => {
    lastExpirationCheck.value = null
    await processExpiredSurveys()
  }
  
  /**
   * Get survey status for a specific survey
   */
  const getStatusForSurvey = (survey: ISurvey): SurveyStatus => {
    const powerUser = isPowerUser.value
    return getSurveyStatus(survey, powerUser)
  }

  /**
   * Check if a specific survey needs verification
   */
  const surveyNeedsVerification = (survey: ISurvey): boolean => {
    const powerUser = isPowerUser.value
    return powerUser && needsVerification(survey)
  }
  
  /**
   * Initialize the status manager
   */
  const initialize = (): void => {
    // Watch for survey changes and check for expired surveys
    watch(surveys, async (newSurveys) => {
      if (newSurveys.length > 0) {
        await checkForExpiredSurveys()
      }
    }, { deep: true })
    
    // Check for expired surveys when user role changes
    watch(isPowerUser, async () => {
      await checkForExpiredSurveys()
    })
    
    // Periodic check every 10 minutes
    setInterval(async () => {
      await checkForExpiredSurveys()
    }, 10 * 60 * 1000) // 10 minutes
  }
  
  /**
   * Get verification summary for Power Users
   */
  const getVerificationSummary = () => {
    if (!isPowerUser.value) return null
    
    return {
      needingVerification: surveysNeedingVerification.value.length,
      awaitingVerification: awaitingVerificationSurveys.value.length,
      totalExpired: surveys.value.filter(s => isSurveyExpired(s)).length
    }
  }
  
  return {
    // State
    isProcessingExpiration: readonly(isProcessingExpiration),
    lastExpirationCheck: readonly(lastExpirationCheck),
    
    // Computed
    surveysNeedingVerification,
    activeSurveys,
    awaitingVerificationSurveys,
    closedSurveys,
    verificationNotificationCount,
    
    // Methods
    processExpiredSurveys,
    checkForExpiredSurveys,
    forceExpirationCheck,
    getStatusForSurvey,
    surveyNeedsVerification,
    getVerificationSummary,
    initialize
  }
}

// Helper to make refs readonly
import type { Ref, DeepReadonly } from 'vue'
function readonly<T>(ref: Ref<T>): DeepReadonly<Ref<T>> {
  return computed(() => ref.value) as DeepReadonly<Ref<T>>
}