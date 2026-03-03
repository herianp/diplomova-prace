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
 * Check if voting is closed for a survey based on the team's cutoff setting.
 * Voting closes X hours before the survey time.
 * Returns false if cutoff is not configured (null) or survey is already expired.
 */
export const isVotingClosed = (survey: ISurvey, cutoffHours: number | null): boolean => {
  if (!cutoffHours || !survey.date || !survey.time) return false

  const surveyDateTime = DateTime.fromISO(`${survey.date}T${survey.time}`)
  const cutoffTime = surveyDateTime.minus({ hours: cutoffHours })
  const now = DateTime.now()

  // Only applies when cutoff has passed but survey hasn't started yet
  return now >= cutoffTime && now < surveyDateTime
}

/**
 * Get hours remaining until voting closes. Returns null if:
 * - No cutoff configured
 * - Voting already closed
 * - Survey expired
 * Only returns a value when voting is still open AND within the cutoff window
 * (i.e. the survey is less than 2*cutoffHours away).
 */
export const getTimeUntilVotingCloses = (survey: ISurvey, cutoffHours: number | null): number | null => {
  if (!cutoffHours || !survey.date || !survey.time) return null

  const surveyDateTime = DateTime.fromISO(`${survey.date}T${survey.time}`)
  const cutoffTime = surveyDateTime.minus({ hours: cutoffHours })
  const now = DateTime.now()

  // Only show warning when voting is still open but approaching cutoff
  if (now < cutoffTime) {
    const hoursLeft = cutoffTime.diff(now, 'hours').hours
    if (hoursLeft <= cutoffHours) {
      return Math.ceil(hoursLeft)
    }
  }
  return null
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