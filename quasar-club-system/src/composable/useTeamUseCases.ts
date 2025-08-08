import { useTeamStore } from '@/stores/teamStore'
import { useTeamFirebase } from '@/services/teamFirebase'

export function useTeamUseCases() {
  const teamStore = useTeamStore()
  const { getTeamsByUserId, getTeamById } = useTeamFirebase()

  const setTeamListener = (userId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Clear existing listener
      if (teamStore.unsubscribeTeams) {
        teamStore.unsubscribeTeams()
      }

      // Set up new listener
      const unsubscribe = getTeamsByUserId(userId, (teamsList) => {
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

  const getTeamByIdAndSetCurrentTeam = async (teamId: string) => {
    const team = await getTeamById(teamId)
    teamStore.setCurrentTeam(team)
  }

  const clearTeamData = () => {
    teamStore.clearData()
  }

  return {
    setTeamListener,
    getTeamByIdAndSetCurrentTeam,
    clearTeamData
  }
}