import { useAdminFirebase, ICreatorResolution } from '@/services/adminFirebase'
import { useTeamFirebase } from '@/services/teamFirebase'
import { useAuditLogFirebase } from '@/services/auditLogFirebase'
import { useAuthStore } from '@/stores/authStore'
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
  const { writeAuditLog } = useAuditLogFirebase()
  const authStore = useAuthStore()

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

  const getTeamsWhereUserIsCreator = (uid: string, teams: ITeam[]): ITeam[] => {
    return teams.filter((t) => t.creator === uid)
  }

  const deleteUserAsAdmin = async (uid: string, creatorResolutions: ICreatorResolution[]): Promise<void> => {
    // Step 1: Delete teams client-side for 'delete' resolutions (full cascade)
    const deleteResolutions = creatorResolutions.filter((r) => r.action === 'delete')
    for (const resolution of deleteResolutions) {
      await teamFirebase.deleteTeam(resolution.teamId)
    }

    // Step 2: Call Cloud Function with only 'reassign' resolutions
    const reassignResolutions = creatorResolutions.filter((r) => r.action === 'reassign')
    await adminFirebase.deleteUserAccount({
      uid,
      creatorResolutions: reassignResolutions.length > 0 ? reassignResolutions : undefined,
    })

    // Step 3: Audit logging (fire-and-forget)
    const actorUid = authStore.user?.uid || ''
    const actorDisplayName = authStore.user?.displayName || authStore.user?.email || 'Unknown'

    for (const resolution of reassignResolutions) {
      void writeAuditLog({
        teamId: resolution.teamId,
        operation: 'team.reassignCreator',
        actorUid,
        actorDisplayName,
        timestamp: new Date(),
        entityId: resolution.newCreatorUid || '',
        entityType: 'user',
        after: { previousCreator: uid, newCreator: resolution.newCreatorUid },
      })
    }

    void writeAuditLog({
      teamId: '',
      operation: 'user.delete',
      actorUid,
      actorDisplayName,
      timestamp: new Date(),
      entityId: uid,
      entityType: 'user',
      after: { deletedUserUid: uid },
    })
  }

  return {
    loadAllTeams,
    loadAllUsers,
    loadAllSurveys,
    computeOverviewStats,
    deleteTeamAsAdmin,
    getTeamsWhereUserIsCreator,
    deleteUserAsAdmin,
  }
}
