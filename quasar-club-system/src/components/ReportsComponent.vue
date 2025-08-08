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
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import ReportsHeader from '@/components/reports/ReportsHeader.vue'
import ReportsTeamStats from '@/components/reports/ReportsTeamStats.vue'
import ReportsPlayerFilter from '@/components/reports/ReportsPlayerFilter.vue'
import ReportsPlayerStats from '@/components/reports/ReportsPlayerStats.vue'
import ReportsCharts from '@/components/reports/ReportsCharts.vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { useSurveyMetrics } from '@/composable/useSurveyMetrics'
import { useTeamMemberUtils } from '@/composable/useTeamMemberUtils'

const teamStore = useTeamStore()
const authStore = useAuthStore()
const $q = useQuasar()
const { t } = useI18n()
const { setSurveysListener } = useSurveyUseCases()

// New composables
const { filters, createFilteredSurveys, updateFilters } = useSurveyFilters()
const { calculateTeamMetrics, calculatePlayerMetrics } = useSurveyMetrics()
const { loadTeamMembers, createPlayerOptions, getPlayerName } = useTeamMemberUtils()

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

const selectedPlayer = ref(null)

// Set current date as dateTo for reports
filters.value.dateTo = DateTime.now().toISODate()


// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys || [])

// Use the new composables for computed properties
const filteredSurveys = createFilteredSurveys(surveys, filters)

const playerOptions = computed(() =>
  createPlayerOptions(teamMembers.value, t('reports.allPlayers'))
)

// Filter event handler for SurveyFilterMenu
const onFiltersChanged = (newFilters) => {
  updateFilters(newFilters)
}

// Methods
const loadTeamMembersData = async () => {
  if (!currentTeam.value?.members?.length) {
    teamMembers.value = []
    return
  }

  try {
    teamMembers.value = await loadTeamMembers(currentTeam.value.members)
  } catch (error) {
    console.error('Error loading team members:', error)
    teamMembers.value = []
  }
}

const updateTeamMetrics = () => {
  const surveys = filteredSurveys.value
  const membersCount = currentTeam.value?.members?.length || 0
  teamMetrics.value = calculateTeamMetrics(surveys, membersCount)
}

const updatePlayerMetrics = () => {
  const surveys = filteredSurveys.value
  playerMetrics.value = calculatePlayerMetrics(surveys, selectedPlayer.value)
}


const loadData = async () => {
  if (!currentTeam.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    // Load team members first
    await loadTeamMembersData()

    // Only load surveys if they're not already loaded for this team
    if (surveys.value.length === 0 && authStore.user?.uid) {
      // Add delay to ensure Firebase auth is ready
      setTimeout(async () => {
        if (currentTeam.value?.id && authStore.user?.uid) {
          await setSurveysListener(currentTeam.value.id)

          // Wait a bit for surveys to load
          setTimeout(() => {
            updateTeamMetrics()
            updatePlayerMetrics()
            loading.value = false
          }, 500)
        }
      }, 300)
    } else {
      // Surveys already loaded, just calculate metrics
      updateTeamMetrics()
      updatePlayerMetrics()
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
    updateTeamMetrics()
    updatePlayerMetrics()
  }
}, { deep: true })

// Watch for filter changes (affects team metrics and player metrics)
watch(filters, () => {
  if (!loading.value) {
    updateTeamMetrics()
    updatePlayerMetrics()
  }
}, { deep: true })

// Watch for player filter changes (affects player metrics)
watch(selectedPlayer, () => {
  if (!loading.value) {
    updatePlayerMetrics()
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
