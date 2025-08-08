<template>
  <div class="reports-container">
    <!-- Header Component -->
    <ReportsHeader :current-team="currentTeam" />

    <!-- Reports Content -->
    <div v-if="currentTeam" class="reports-content">
      <!-- Filter Menu (same as SurveyPage) -->
      <SurveyFilterMenu
        v-model="filters"
        @filters-changed="onFiltersChanged"
        class="q-mb-lg"
      />

      <!-- Team Statistics Component -->
      <ReportsTeamStats :team-metrics="teamMetrics" />

      <!-- Player Filter Component -->
      <ReportsPlayerFilter
        v-model:selected-player="selectedPlayer"
        :player-options="playerOptions"
        :get-player-name="getPlayerName"
      />

      <!-- Player Statistics Component -->
      <ReportsPlayerStats
        :selected-player="selectedPlayer"
        :player-metrics="playerMetrics"
        :get-player-name="getPlayerName"
      />

      <!-- Charts Component -->
      <ReportsCharts
        :loading="loading"
        :filtered-surveys="filteredSurveys"
        :current-team="currentTeam"
        :team-members="teamMembers"
        :selected-player="selectedPlayer"
        class="q-mr-lg"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { db } from '@/firebase/config.ts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import ReportsHeader from '@/components/reports/ReportsHeader.vue'
import ReportsTeamStats from '@/components/reports/ReportsTeamStats.vue'
import ReportsPlayerFilter from '@/components/reports/ReportsPlayerFilter.vue'
import ReportsPlayerStats from '@/components/reports/ReportsPlayerStats.vue'
import ReportsCharts from '@/components/reports/ReportsCharts.vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.js'

const teamStore = useTeamStore()
const authStore = useAuthStore()
const $q = useQuasar()
const { t } = useI18n()
const { setSurveysListener } = useSurveyUseCases()

// State
const loading = ref(true)
const teamMembers = ref([])
const teamMetrics = ref({
  totalSurveys: 0,
  totalMembers: 0,
  averageParticipation: 0,
  activeSurveys: 0
})
const playerMetrics = ref({
  yesVotes: 0,
  noVotes: 0,
  unvoted: 0,
  averageParticipation: 0
})

// Filter state (same structure as SurveyPage)
const selectedPlayer = ref(null)
const filters = ref({
  searchName: '',
  dateFrom: '2025-07-13', // Season start
  dateTo: DateTime.now().toISODate() // Current date
})


// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys || [])

// Filter computed properties
const playerOptions = computed(() => {
  if (!teamMembers.value.length) return []

  return [
    { label: t('reports.allPlayers'), value: null },
    ...teamMembers.value.map(member => ({
      label: member.displayName || member.email || `Member ${member.uid.substring(0, 8)}...`,
      value: member.uid
    }))
  ]
})

const filteredSurveys = computed(() => {
  let filtered = [...surveys.value]

  // Apply date filter using the unified filter structure
  if (filters.value.dateFrom || filters.value.dateTo) {
    filtered = filtered.filter(survey => {
      const surveyDate = DateTime.fromISO(survey.date)
      const fromDate = filters.value.dateFrom ? DateTime.fromISO(filters.value.dateFrom) : null
      const toDate = filters.value.dateTo ? DateTime.fromISO(filters.value.dateTo) : null

      if (fromDate && surveyDate < fromDate) return false
      return !(toDate && surveyDate > toDate);

    })
  }

  // Apply name search filter
  if (filters.value.searchName?.trim()) {
    const searchTerm = filters.value.searchName.toLowerCase().trim()
    filtered = filtered.filter(survey =>
      survey.title.toLowerCase().includes(searchTerm)
    )
  }

  return filtered
})

// Filter event handler for SurveyFilterMenu
const onFiltersChanged = (newFilters) => {
  filters.value = { ...newFilters }
}

const getPlayerName = (playerId) => {
  const member = teamMembers.value.find(m => m.uid === playerId)
  return member?.displayName || member?.email || `Member ${playerId.substring(0, 8)}...`
}

// Methods
const loadTeamMembers = async () => {
  if (!currentTeam.value?.members?.length) {
    teamMembers.value = []
    return
  }

  try {
    const members = currentTeam.value.members
    const allUsers = []

    // Split members into chunks of 30 (Firestore IN query limit)
    const chunkSize = 30
    for (let i = 0; i < members.length; i += chunkSize) {
      const chunk = members.slice(i, i + chunkSize)

      const usersQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', chunk)
      )
      const usersSnapshot = await getDocs(usersQuery)

      const chunkUsers = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))

      allUsers.push(...chunkUsers)
    }

    teamMembers.value = allUsers
  } catch (error) {
    console.error('Error loading team members:', error)
    teamMembers.value = []
  }
}

const calculateTeamMetrics = () => {
  const surveysToUse = filteredSurveys.value

  if (!currentTeam.value || !surveysToUse.length) {
    teamMetrics.value = {
      totalSurveys: 0,
      totalMembers: currentTeam.value?.members?.length || 0,
      averageParticipation: 0,
      activeSurveys: 0
    }
    return
  }

  const now = DateTime.now()
  const activeSurveys = surveysToUse.filter(survey => {
    const surveyDate = DateTime.fromISO(survey.date + 'T' + survey.time)
    return surveyDate > now
  })

  // Calculate team average attendance based on "Yes" votes only
  const totalYesVotes = surveysToUse.reduce((sum, survey) => {
    const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
    return sum + yesVotes
  }, 0)
  const totalPossibleVotes = surveysToUse.length * (currentTeam.value?.members?.length || 1)
  const averageParticipation = totalPossibleVotes > 0 ? Math.round((totalYesVotes / totalPossibleVotes) * 100) : 0

  teamMetrics.value = {
    totalSurveys: surveysToUse.length,
    totalMembers: currentTeam.value?.members?.length || 0,
    averageParticipation,
    activeSurveys: activeSurveys.length
  }
}

const calculatePlayerMetrics = () => {
  if (!selectedPlayer.value) {
    playerMetrics.value = {
      yesVotes: 0,
      noVotes: 0,
      unvoted: 0,
      averageParticipation: 0
    }
    return
  }

  const surveysToUse = filteredSurveys.value

  if (!surveysToUse.length) {
    playerMetrics.value = {
      yesVotes: 0,
      noVotes: 0,
      unvoted: 0,
      averageParticipation: 0
    }
    return
  }

  let yesVotes = 0
  let noVotes = 0
  let unvoted = 0

  surveysToUse.forEach(survey => {
    const playerVote = survey.votes?.find(vote => vote.userUid === selectedPlayer.value)

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
  const averageParticipation = surveysToUse.length > 0 ? Math.round((yesVotes / surveysToUse.length) * 100) : 0

  playerMetrics.value = {
    yesVotes,
    noVotes,
    unvoted,
    averageParticipation
  }
}


const loadData = async () => {
  if (!currentTeam.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    // Load team members first
    await loadTeamMembers()

    // Only load surveys if they're not already loaded for this team
    if (surveys.value.length === 0 && authStore.user?.uid) {
      // Add delay to ensure Firebase auth is ready
      setTimeout(async () => {
        if (currentTeam.value?.id && authStore.user?.uid) {
          await setSurveysListener(currentTeam.value.id)

          // Wait a bit for surveys to load
          setTimeout(() => {
            calculateTeamMetrics()
            calculatePlayerMetrics()
            loading.value = false
          }, 500)
        }
      }, 300)
    } else {
      // Surveys already loaded, just calculate metrics
      calculateTeamMetrics()
      calculatePlayerMetrics()
      loading.value = false
    }
  } catch (error) {
    console.error('Error loading reports data:', error)
    $q.notify({
      type: 'negative',
      message: t('reports.loadError'),
      icon: 'error'
    })
    loading.value = false
  }
}

// Watch for team changes only
watch(currentTeam, (newTeam) => {
  if (newTeam) {
    loadData()
  }
}, { immediate: false })

// Watch for surveys changes to update metrics without reloading
watch(surveys, (newSurveys) => {
  if (newSurveys.length > 0 && !loading.value) {
    calculateTeamMetrics()
    calculatePlayerMetrics()
  }
}, { deep: true })

// Watch for filter changes (affects team metrics and player metrics)
watch(filters, () => {
  if (!loading.value) {
    calculateTeamMetrics()
    calculatePlayerMetrics()
  }
}, { deep: true })

// Watch for player filter changes (affects player metrics)
watch(selectedPlayer, () => {
  if (!loading.value) {
    calculatePlayerMetrics()
  }
})

onMounted(() => {
  loadData()
})

</script>

<style scoped>
.reports-container {
  width: 100%;
  padding: 1rem;
}

@media (max-width: 768px) {
  .reports-container {
    padding: 1rem;
  }
}
</style>
