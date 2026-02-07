import { ref, computed, Ref } from 'vue'
import { db } from '@/firebase/config.ts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { ITeamMember, ITeam, IPlayerOption, ISurvey, IVote, IMemberStats } from '@/interfaces/interfaces'

export function useTeamMemberUtils() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load team members with Firestore IN query limit handling
   * Firestore IN query limit is 30, so we need to chunk the requests
   */
  const loadTeamMembers = async (memberIds: string[]): Promise<ITeamMember[]> => {
    if (!memberIds?.length) {
      return []
    }

    loading.value = true
    error.value = null

    try {
      const allUsers: ITeamMember[] = []
      const chunkSize = 30 // Firestore IN query limit

      // Split members into chunks of 30
      for (let i = 0; i < memberIds.length; i += chunkSize) {
        const chunk = memberIds.slice(i, i + chunkSize)

        const usersQuery = query(
          collection(db, 'users'),
          where('__name__', 'in', chunk)
        )
        const usersSnapshot = await getDocs(usersQuery)

        const chunkUsers = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as ITeamMember[]

        allUsers.push(...chunkUsers)
      }

      return allUsers
    } catch (err) {
      error.value = 'Error loading team members'
      console.error('Error loading team members:', err)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get display name for a team member
   */
  const getMemberDisplayName = (member: ITeamMember): string => {
    return member.displayName || member.email || `Member ${member.uid.substring(0, 8)}...`
  }

  /**
   * Get display name for a member by UID from a list of members
   */
  const getPlayerName = (playerId: string, members: ITeamMember[]): string => {
    const member = members.find(m => m.uid === playerId)
    return member ? getMemberDisplayName(member) : `Member ${playerId.substring(0, 8)}...`
  }

  /**
   * Create player options for select dropdown
   */
  const createPlayerOptions = (members: ITeamMember[], allPlayersLabel = 'All Players'): IPlayerOption[] => {
    if (!members.length) return []

    return [
      { label: allPlayersLabel, value: null },
      ...members.map(member => ({
        label: getMemberDisplayName(member),
        value: member.uid
      }))
    ]
  }

  /**
   * Filter team members by search term
   */
  const filterMembers = (members: ITeamMember[], searchTerm: string): ITeamMember[] => {
    if (!searchTerm.trim()) return members

    const term = searchTerm.toLowerCase().trim()
    
    return members.filter(member => {
      const displayName = member.displayName?.toLowerCase() || ''
      const email = member.email?.toLowerCase() || ''
      
      return displayName.includes(term) || email.includes(term)
    })
  }

  /**
   * Sort team members by display name
   */
  const sortMembersByName = (members: ITeamMember[]): ITeamMember[] => {
    return [...members].sort((a, b) => {
      const nameA = getMemberDisplayName(a).toLowerCase()
      const nameB = getMemberDisplayName(b).toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }

  /**
   * Get active team members (members who have participated in surveys)
   */
  const getActiveMembers = (allMembers: ITeamMember[], surveys: ISurvey[]): ITeamMember[] => {
    if (!surveys.length) return []

    const activeUserIds = new Set<string>()

    surveys.forEach(survey => {
      survey.votes?.forEach((vote: IVote) => {
        activeUserIds.add(vote.userUid)
      })
    })

    return allMembers.filter(member => activeUserIds.has(member.uid))
  }

  /**
   * Create computed properties for team members
   */
  const createMemberComputeds = (members: Ref<ITeamMember[]>) => {
    const sortedMembers = computed(() => 
      sortMembersByName(members.value || [])
    )

    const memberCount = computed(() => 
      (members.value || []).length
    )

    const memberOptions = computed(() => 
      createPlayerOptions(members.value || [])
    )

    return {
      sortedMembers,
      memberCount,
      memberOptions
    }
  }

  /**
   * Validate team member data
   */
  const validateMember = (member: Partial<ITeamMember>): boolean => {
    return !!(member.uid && (member.displayName || member.email))
  }

  /**
   * Check if a member is in the team
   */
  const isMemberInTeam = (memberId: string, team: ITeam): boolean => {
    return team.members?.includes(memberId) || false
  }

  /**
   * Get member statistics from surveys
   */
  const getMemberStats = (memberId: string, surveys: ISurvey[]): IMemberStats => {
    let totalSurveys = 0
    let yesVotes = 0
    let noVotes = 0
    let unvoted = 0

    surveys.forEach(survey => {
      const vote = survey.votes?.find((v: IVote) => v.userUid === memberId)
      totalSurveys++
      
      if (vote) {
        if (vote.vote === true) yesVotes++
        else if (vote.vote === false) noVotes++
      } else {
        unvoted++
      }
    })

    const participationRate = totalSurveys > 0 
      ? Math.round(((yesVotes + noVotes) / totalSurveys) * 100)
      : 0

    const attendanceRate = totalSurveys > 0
      ? Math.round((yesVotes / totalSurveys) * 100)
      : 0

    return {
      totalSurveys,
      yesVotes,
      noVotes,
      unvoted,
      participationRate,
      attendanceRate
    }
  }

  /**
   * Search team members with debounce-ready function
   */
  const searchMembers = (members: ITeamMember[], searchQuery: string, limit?: number) => {
    const filtered = filterMembers(members, searchQuery)
    const sorted = sortMembersByName(filtered)
    
    return limit ? sorted.slice(0, limit) : sorted
  }

  return {
    loading,
    error,
    loadTeamMembers,
    getMemberDisplayName,
    getPlayerName,
    createPlayerOptions,
    filterMembers,
    sortMembersByName,
    getActiveMembers,
    createMemberComputeds,
    validateMember,
    isMemberInTeam,
    getMemberStats,
    searchMembers
  }
}

// Re-export types for convenience
export type { ITeamMember, ITeam, IPlayerOption } from '@/interfaces/interfaces'