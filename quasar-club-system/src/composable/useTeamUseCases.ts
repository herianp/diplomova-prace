import { useAuthStore } from '@/stores/authStore'
import { useTeamStore } from '@/stores/teamStore'
import { useTeamFirebase } from '@/services/teamFirebase'
import { ITeam, ICashboxTransaction } from '@/interfaces/interfaces'

export function useTeamUseCases() {
  const authStore = useAuthStore()
  const teamStore = useTeamStore()
  const teamFirebase = useTeamFirebase()

  const setTeamListener = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Clear existing listener
      if (teamStore.unsubscribeTeams) {
        teamStore.unsubscribeTeams()
      }

      let isFirstCallback = true

      // Set up new listener
      const unsubscribe = teamFirebase.getTeamsByUserId(userId, (teamsList) => {
        teamStore.setTeams(teamsList)

        // Only auto-select on first load when no team is selected
        if (!teamStore.currentTeam && teamsList.length > 0) {
          teamStore.setCurrentTeam(teamsList[0])
        }

        if (isFirstCallback) {
          isFirstCallback = false
          authStore.setTeamReady(true)
          resolve()
        }
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

  const getTeamById = async (teamId: string): Promise<ITeam | null> => {
    return teamFirebase.getTeamById(teamId)
  }

  const getTeamByIdAndSetCurrentTeam = async (teamId: string): Promise<void> => {
    const team = await teamFirebase.getTeamById(teamId)
    teamStore.setCurrentTeam(team)
  }

  const addCashboxTransaction = async (teamId: string, transactionData: ICashboxTransaction): Promise<void> => {
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
