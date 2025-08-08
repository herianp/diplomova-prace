import { useTeamStore } from '@/stores/teamStore'
import { useTeamFirebase } from '@/services/teamFirebase'

export function useTeamUseCases() {
  const teamStore = useTeamStore()
  const teamFirebase = useTeamFirebase()

  const setTeamListener = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Clear existing listener
      if (teamStore.unsubscribeTeams) {
        teamStore.unsubscribeTeams()
      }

      // Set up new listener
      const unsubscribe = teamFirebase.getTeamsByUserId(userId, (teamsList) => {
        teamStore.setTeams(teamsList)
        console.log("Teams updated: ", teamsList)

        // Set first team as current if available
        if (teamsList.length > 0) {
          teamStore.setCurrentTeam(teamsList[0])
          console.log("Current team set to: ", teamsList[0])
        }

        resolve()
      })

      // Store unsubscribe function
      teamStore.setTeamsUnsubscribe(unsubscribe)
    })
  }

  const createTeam = async (teamName: string, userId: string): Promise<void> => {
    return teamFirebase.createTeam(teamName, userId)
  }

  const deleteTeam = async (teamId: string): Promise<void> => {
    return teamFirebase.deleteTeam(teamId)
  }

  const getTeamById = async (teamId: string) => {
    return teamFirebase.getTeamById(teamId)
  }

  const getTeamByIdAndSetCurrentTeam = async (teamId: string) => {
    const team = await teamFirebase.getTeamById(teamId)
    teamStore.setCurrentTeam(team)
  }

  const addCashboxTransaction = async (teamId: string, transactionData: any): Promise<void> => {
    return teamFirebase.addCashboxTransaction(teamId, transactionData)
  }

  const clearTeamData = () => {
    teamStore.clearData()
  }

  return {
    setTeamListener,
    createTeam,
    deleteTeam,
    getTeamById,
    getTeamByIdAndSetCurrentTeam,
    addCashboxTransaction,
    clearTeamData
  }
}