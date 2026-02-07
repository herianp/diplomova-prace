import { ISurvey, IVote, SurveyStatus, ICashboxTransaction } from '@/interfaces/interfaces'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'

// UI-focused composable that delegates business logic to use cases
export function useTeamComposable() {
  const teamUseCases = useTeamUseCases()
  const surveyUseCases = useSurveyUseCases()

  // Team operations - delegate to team use cases
  const createTeam = async (teamName: string, userId: string) => {
    return teamUseCases.createTeam(teamName, userId)
  }

  const deleteTeam = async (teamId: string) => {
    return teamUseCases.deleteTeam(teamId)
  }

  const getTeamById = async (teamId: string) => {
    return teamUseCases.getTeamById(teamId)
  }

  const addCashboxTransaction = async (teamId: string, transactionData: ICashboxTransaction) => {
    return teamUseCases.addCashboxTransaction(teamId, transactionData)
  }

  // Survey operations - delegate to survey use cases
  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    return surveyUseCases.getSurveyById(surveyId)
  }

  const deleteSurvey = async (surveyId: string) => {
    return surveyUseCases.deleteSurvey(surveyId)
  }

  const addSurvey = async (newSurvey: ISurvey) => {
    return surveyUseCases.addSurvey(newSurvey)
  }

  const updateSurvey = async (surveyId: string, updatedSurvey: Partial<ISurvey>) => {
    return surveyUseCases.updateSurvey(surveyId, updatedSurvey)
  }

  const addVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    return surveyUseCases.voteOnSurvey(surveyId, userUid, newVote)
  }

  const addSurveyVote = async (
    surveyId: string,
    userUid: string,
    newVote: boolean,
    votes: IVote[],
    isUserVoteExists: IVote,
  ) => {
    return surveyUseCases.addSurveyVoteUseCase(surveyId, userUid, newVote)
  }

  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string) => {
    return surveyUseCases.updateSurveyStatus(surveyId, status, verifiedBy)
  }

  const verifySurvey = async (surveyId: string, verifiedBy: string, updatedVotes?: IVote[]) => {
    return surveyUseCases.verifySurvey(surveyId, verifiedBy, updatedVotes)
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
    return surveyUseCases.updateSurveyVotes(surveyId, votes)
  }

  return {
    // Team operations
    createTeam,
    deleteTeam,
    getTeamById,
    addCashboxTransaction,
    // Survey operations
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
