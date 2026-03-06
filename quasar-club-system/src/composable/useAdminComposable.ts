import { ref, computed } from 'vue'
import { useAdminUseCases, IAdminOverviewStats } from '@/composable/useAdminUseCases'
import { ICreatorResolution } from '@/services/adminFirebase'
import { ITeam, IUser, ISurvey } from '@/interfaces/interfaces'
import { createLogger } from 'src/utils/logger'

export function useAdminComposable() {
  const log = createLogger('useAdminComposable')
  const adminUseCases = useAdminUseCases()

  const allTeams = ref<ITeam[]>([])
  const allUsers = ref<IUser[]>([])
  const allSurveys = ref<ISurvey[]>([])
  const isLoading = ref(false)
  const loadError = ref<string | null>(null)
  const showDeletedUsers = ref(false)

  const teamSearchQuery = ref('')
  const userSearchQuery = ref('')

  // Build a lookup map: userId -> user
  const usersMap = computed(() => {
    const map = new Map<string, IUser>()
    allUsers.value.forEach((u) => map.set(u.uid, u))
    return map
  })

  // Build a lookup map: userId -> number of teams they belong to
  const userTeamsCount = computed(() => {
    const map = new Map<string, number>()
    allTeams.value.forEach((team) => {
      team.members?.forEach((uid) => {
        map.set(uid, (map.get(uid) || 0) + 1)
      })
    })
    return map
  })

  // Build a lookup map: teamId -> number of surveys
  const teamSurveysCount = computed(() => {
    const map = new Map<string, number>()
    allSurveys.value.forEach((s) => {
      if (s.teamId) {
        map.set(s.teamId, (map.get(s.teamId) || 0) + 1)
      }
    })
    return map
  })

  const filteredTeams = computed(() => {
    const q = teamSearchQuery.value.toLowerCase().trim()
    if (!q) return allTeams.value
    return allTeams.value.filter((team) =>
      team.name?.toLowerCase().includes(q)
    )
  })

  const filteredUsers = computed(() => {
    // First filter by deleted status
    let users = allUsers.value
    if (!showDeletedUsers.value) {
      users = users.filter((user) => user.status !== 'deleted')
    }

    // Then filter by search query
    const q = userSearchQuery.value.toLowerCase().trim()
    if (!q) return users
    return users.filter((user) =>
      (user.displayName || user.name || '').toLowerCase().includes(q) ||
      (user.email || '').toLowerCase().includes(q)
    )
  })

  const overviewStats = computed<IAdminOverviewStats>(() => {
    return adminUseCases.computeOverviewStats(allTeams.value, allUsers.value, allSurveys.value)
  })

  const loadAdminData = async () => {
    isLoading.value = true
    loadError.value = null
    try {
      const [teams, users, surveys] = await Promise.all([
        adminUseCases.loadAllTeams(),
        adminUseCases.loadAllUsers(),
        adminUseCases.loadAllSurveys(),
      ])
      allTeams.value = teams
      allUsers.value = users
      allSurveys.value = surveys
    } catch (error) {
      log.error('Failed to load admin data', { error: error instanceof Error ? error.message : String(error) })
      loadError.value = (error as Error).message
    } finally {
      isLoading.value = false
    }
  }

  const deleteTeam = async (teamId: string) => {
    await adminUseCases.deleteTeamAsAdmin(teamId)
    allTeams.value = allTeams.value.filter((t) => t.id !== teamId)
    // Also remove surveys for deleted team
    allSurveys.value = allSurveys.value.filter((s) => s.teamId !== teamId)
  }

  const deleteUser = async (uid: string, creatorResolutions: ICreatorResolution[]) => {
    await adminUseCases.deleteUserAsAdmin(uid, creatorResolutions)

    // Update local state: mark user as deleted
    const userIndex = allUsers.value.findIndex((u) => u.uid === uid)
    if (userIndex !== -1) {
      allUsers.value[userIndex] = {
        ...allUsers.value[userIndex],
        status: 'deleted',
        deletedAt: new Date(),
      }
    }

    // Remove teams that were chosen for deletion
    const deletedTeamIds = creatorResolutions
      .filter((r) => r.action === 'delete')
      .map((r) => r.teamId)
    if (deletedTeamIds.length > 0) {
      allTeams.value = allTeams.value.filter((t) => !deletedTeamIds.includes(t.id || ''))
      allSurveys.value = allSurveys.value.filter((s) => !deletedTeamIds.includes(s.teamId))
    }
  }

  const getTeamsWhereUserIsCreator = (uid: string, teams: ITeam[]): ITeam[] => {
    return adminUseCases.getTeamsWhereUserIsCreator(uid, teams)
  }

  const getCreatorName = (creatorUid: string): string => {
    const user = usersMap.value.get(creatorUid)
    return user?.displayName || user?.name || user?.email || creatorUid
  }

  return {
    allTeams,
    allUsers,
    allSurveys,
    isLoading,
    loadError,
    showDeletedUsers,
    teamSearchQuery,
    userSearchQuery,
    usersMap,
    userTeamsCount,
    teamSurveysCount,
    filteredTeams,
    filteredUsers,
    overviewStats,
    loadAdminData,
    deleteTeam,
    deleteUser,
    getTeamsWhereUserIsCreator,
    getCreatorName,
  }
}
