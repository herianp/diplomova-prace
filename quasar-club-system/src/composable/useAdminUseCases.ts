import { useAdminFirebase } from '@/services/adminFirebase'
import { useTeamFirebase } from '@/services/teamFirebase'
import { ITeam, IUser, ISurvey } from '@/interfaces/interfaces'

export interface IAdminOverviewStats {
  totalUsers: number
  totalTeams: number
  totalSurveys: number
  avgTeamSize: number
}

export function useAdminUseCases() {
  const adminFirebase = useAdminFirebase()
  const teamFirebase = useTeamFirebase()

  const loadAllTeams = async (): Promise<ITeam[]> => {
    return await adminFirebase.getAllTeams()
  }

  const loadAllUsers = async (): Promise<IUser[]> => {
    return await adminFirebase.getAllUsers()
  }

  const loadAllSurveys = async (): Promise<ISurvey[]> => {
    return await adminFirebase.getAllSurveys()
  }

  const computeOverviewStats = (teams: ITeam[], users: IUser[], surveys: ISurvey[]): IAdminOverviewStats => {
    const totalTeams = teams.length
    const totalUsers = users.length
    const totalSurveys = surveys.length
    const avgTeamSize = totalTeams > 0
      ? Math.round((teams.reduce((sum, t) => sum + (t.members?.length || 0), 0) / totalTeams) * 10) / 10
      : 0

    return { totalUsers, totalTeams, totalSurveys, avgTeamSize }
  }

  const deleteTeamAsAdmin = async (teamId: string): Promise<void> => {
    await teamFirebase.deleteTeam(teamId)
  }

  return {
    loadAllTeams,
    loadAllUsers,
    loadAllSurveys,
    computeOverviewStats,
    deleteTeamAsAdmin,
  }
}
