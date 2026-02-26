import { DateTime } from 'luxon'
import { ISurvey, SurveyStatus } from '@/interfaces/interfaces'

/**
 * Utility functions for managing survey status and expiration logic
 */

/**
 * Check if a survey has expired based on its date and time
 */
export const isSurveyExpired = (survey: ISurvey): boolean => {
  if (!survey.date || !survey.time) return false
  
  const surveyDateTime = DateTime.fromISO(`${survey.date}T${survey.time}`)
  const now = DateTime.now()
  
  return surveyDateTime < now
}

/**
 * Get the current status of a survey based on expiration and user role
 */
export const getSurveyStatus = (survey: ISurvey, isPowerUser: boolean): SurveyStatus => {
  // If survey has an explicit status, respect it (for verified surveys)
  if (survey.status) {
    return survey.status
  }
  
  // If survey is not expired, it's active
  if (!isSurveyExpired(survey)) {
    return SurveyStatus.ACTIVE
  }
  
  // Survey is expired - determine status based on user role
  if (isPowerUser) {
    return SurveyStatus.AWAITING_VERIFICATION
  } else {
    return SurveyStatus.CLOSED
  }
}

/**
 * Get the display status for a survey
 */
export const getSurveyStatusDisplay = (survey: ISurvey, isPowerUser: boolean): {
  status: SurveyStatus
  label: string
  color: string
  icon: string
} => {
  const status = getSurveyStatus(survey, isPowerUser)
  
  switch (status) {
    case SurveyStatus.ACTIVE:
      return {
        status,
        label: 'survey.status.active',
        color: 'positive',
        icon: 'schedule'
      }
    case SurveyStatus.AWAITING_VERIFICATION:
      return {
        status,
        label: 'survey.status.awaitingVerification',
        color: 'deep-orange',
        icon: 'pending_actions'
      }
    case SurveyStatus.CLOSED:
      return {
        status,
        label: 'survey.status.closed',
        color: 'grey-6',
        icon: 'check_circle'
      }
    default:
      return {
        status: SurveyStatus.ACTIVE,
        label: 'survey.status.active',
        color: 'positive',
        icon: 'schedule'
      }
  }
}

/**
 * Check if a Power User can modify votes for a survey
 */
export const canModifyVotes = (survey: ISurvey, isPowerUser: boolean): boolean => {
  if (!isPowerUser) return false
  
  const status = getSurveyStatus(survey, isPowerUser)
  
  // Power Users can modify votes for awaiting verification or closed surveys
  return status === SurveyStatus.AWAITING_VERIFICATION || status === SurveyStatus.CLOSED
}

/**
 * Check if a survey needs verification by Power Users
 */
export const needsVerification = (survey: ISurvey): boolean => {
  return isSurveyExpired(survey) && !survey.status
}

/**
 * Get surveys that need verification
 */
export const getSurveysNeedingVerification = (surveys: ISurvey[]): ISurvey[] => {
  return surveys.filter(survey => needsVerification(survey))
}

/**
 * Get the verification status text for Power Users
 */
export const getVerificationText = (survey: ISurvey): string => {
  if (!isSurveyExpired(survey)) {
    return 'survey.verification.notExpired'
  }
  
  if (survey.status === SurveyStatus.CLOSED && survey.verifiedAt) {
    return 'survey.verification.verified'
  }
  
  if (needsVerification(survey)) {
    return 'survey.verification.readyToCheck'
  }
  
  return 'survey.verification.unknown'
}

/**
 * Returns a display title for a survey.
 * For match/friendly-match with opponent: "Zápas (Sparta)"
 * For training or no opponent: just the translated type name
 */
export const getSurveyDisplayTitle = (
  survey: { type: string; opponent?: string },
  t: (key: string) => string
): string => {
  const typeLabel = t(`survey.type.${survey.type}`)
  if ((survey.type === 'match' || survey.type === 'friendly-match') && survey.opponent) {
    return `${typeLabel} (${survey.opponent})`
  }
  return typeLabel
}