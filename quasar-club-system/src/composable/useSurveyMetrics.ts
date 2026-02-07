import { computed, Ref } from 'vue'
import { DateTime } from 'luxon'
import { ISurvey, IVote, ITeamMetrics, IPlayerMetrics, IPersonalMetrics } from '@/interfaces/interfaces'

export function useSurveyMetrics() {

  /**
   * Calculate total number of surveys
   */
  const calculateTotalSurveys = (surveys: ISurvey[]): number => {
    return surveys.length
  }

  /**
   * Calculate number of active team members who have voted
   */
  const calculateActiveTeamMembers = (surveys: ISurvey[]): number => {
    if (!surveys.length) return 0

    const participatingMembers = new Set<string>()

    surveys.forEach(survey => {
      survey.votes?.forEach(vote => {
        participatingMembers.add(vote.userUid)
      })
    })

    return participatingMembers.size
  }

  /**
   * Calculate personal voting metrics for a specific user
   */
  const calculatePersonalMetrics = (surveys: ISurvey[], userUid?: string): IPersonalMetrics => {
    if (!userUid || !surveys.length) {
      return {
        myTotalVotes: 0,
        myYesVotes: 0,
        personalParticipationRate: 0
      }
    }

    const myTotalVotes = surveys.reduce((total, survey) => {
      const userVote = survey.votes?.find(vote => vote.userUid === userUid)
      return userVote ? total + 1 : total
    }, 0)

    const myYesVotes = surveys.reduce((total, survey) => {
      const userVote = survey.votes?.find(vote => vote.userUid === userUid)
      return (userVote && userVote.vote === true) ? total + 1 : total
    }, 0)

    const personalParticipationRate = surveys.length > 0
      ? Math.round((myYesVotes / surveys.length) * 100)
      : 0

    return {
      myTotalVotes,
      myYesVotes,
      personalParticipationRate
    }
  }

  /**
   * Calculate team participation rate based on "Yes" votes only
   */
  const calculateTeamParticipationRate = (surveys: ISurvey[], totalTeamMembers: number): number => {
    if (!surveys.length || !totalTeamMembers) return 0

    const activeMembers = calculateActiveTeamMembers(surveys)
    const totalYesVotes = surveys.reduce((total, survey) => {
      const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
      return total + yesVotes
    }, 0)

    return Math.round((totalYesVotes / (activeMembers * surveys.length)) * 100)
  }

  /**
   * Calculate comprehensive team metrics
   */
  const calculateTeamMetrics = (surveys: ISurvey[], teamMembersCount?: number): ITeamMetrics => {
    if (!surveys.length) {
      return {
        totalSurveys: 0,
        totalMembers: teamMembersCount || 0,
        averageParticipation: 0,
        activeSurveys: 0
      }
    }

    const now = DateTime.now()
    const activeSurveys = surveys.filter(survey => {
      const surveyDate = DateTime.fromISO(survey.date + 'T' + survey.time)
      return surveyDate > now
    })

    // Calculate team average attendance based on "Yes" votes only
    const totalYesVotes = surveys.reduce((sum, survey) => {
      const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
      return sum + yesVotes
    }, 0)

    const totalMembers = teamMembersCount || 1
    const totalPossibleVotes = surveys.length * totalMembers
    const averageParticipation = totalPossibleVotes > 0
      ? Math.round((totalYesVotes / totalPossibleVotes) * 100)
      : 0

    return {
      totalSurveys: surveys.length,
      totalMembers,
      averageParticipation,
      activeSurveys: activeSurveys.length
    }
  }

  /**
   * Calculate player-specific metrics
   */
  const calculatePlayerMetrics = (surveys: ISurvey[], playerId: string | null): IPlayerMetrics => {
    if (!playerId || !surveys.length) {
      return {
        yesVotes: 0,
        noVotes: 0,
        unvoted: 0,
        averageParticipation: 0
      }
    }

    let yesVotes = 0
    let noVotes = 0
    let unvoted = 0

    surveys.forEach(survey => {
      const playerVote = survey.votes?.find(vote => vote.userUid === playerId)

      if (playerVote) {
        if (playerVote.vote === true) {
          yesVotes++
        } else if (playerVote.vote === false) {
          noVotes++
        }
      } else {
        unvoted++
      }
    })

    // Calculate player's attendance rate based on "Yes" votes only
    const averageParticipation = surveys.length > 0
      ? Math.round((yesVotes / surveys.length) * 100)
      : 0

    return {
      yesVotes,
      noVotes,
      unvoted,
      averageParticipation
    }
  }

  /**
   * Get survey type distribution
   */
  const getSurveyTypeDistribution = (surveys: ISurvey[]): Record<string, number> => {
    const distribution: Record<string, number> = {}

    surveys.forEach(survey => {
      const type = survey.type || 'unknown'
      distribution[type] = (distribution[type] || 0) + 1
    })

    return distribution
  }

  /**
   * Get vote statistics for a survey
   */
  const getSurveyVoteStats = (survey: ISurvey) => {
    if (!survey.votes) {
      return { yesCount: 0, noCount: 0, totalVotes: 0 }
    }

    const yesCount = survey.votes.filter(vote => vote.vote === true).length
    const noCount = survey.votes.filter(vote => vote.vote === false).length
    const totalVotes = survey.votes.length

    return { yesCount, noCount, totalVotes }
  }

  /**
   * Create computed properties for metrics
   */
  const createMetricsComputeds = (surveys: Ref<ISurvey[]>, userUid?: Ref<string | undefined>, teamMembersCount?: Ref<number>) => {
    const totalSurveys = computed(() => calculateTotalSurveys(surveys.value || []))

    const activeTeamMembers = computed(() => calculateActiveTeamMembers(surveys.value || []))

    const personalMetrics = computed(() => {
      return calculatePersonalMetrics(surveys.value || [], userUid?.value)
    })

    const teamMetrics = computed(() => {
      return calculateTeamMetrics(surveys.value || [], teamMembersCount?.value)
    })

    const teamParticipationRate = computed(() => {
      return calculateTeamParticipationRate(surveys.value || [], teamMembersCount?.value || 0)
    })

    const surveyTypeDistribution = computed(() => getSurveyTypeDistribution(surveys.value || []))

    return {
      totalSurveys,
      activeTeamMembers,
      personalMetrics,
      teamMetrics,
      teamParticipationRate,
      surveyTypeDistribution
    }
  }

  return {
    calculateTotalSurveys,
    calculateActiveTeamMembers,
    calculatePersonalMetrics,
    calculateTeamParticipationRate,
    calculateTeamMetrics,
    calculatePlayerMetrics,
    getSurveyTypeDistribution,
    getSurveyVoteStats,
    createMetricsComputeds
  }
}

// Re-export types for convenience
export type { ITeamMetrics, IPlayerMetrics, IPersonalMetrics } from '@/interfaces/interfaces'
