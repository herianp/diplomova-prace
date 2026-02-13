<template>
  <div class="reports-container">
    <!-- Loading Skeleton -->
    <template v-if="!currentTeam">
      <div class="q-mb-md">
        <q-skeleton type="text" width="50%" class="q-mb-xs" />
        <q-skeleton type="text" width="30%" />
      </div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div v-for="n in 4" :key="n" class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <q-skeleton type="text" width="60%" class="q-mb-sm" />
            <q-skeleton type="rect" height="32px" />
          </q-card>
        </div>
      </div>
      <q-card flat bordered class="q-pa-md">
        <q-skeleton type="rect" height="200px" />
      </q-card>
    </template>

    <template v-else>
      <!-- Header Section -->
      <div class="welcome-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ currentTeam?.name }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ $t('reports.teamMetrics') }}
            </div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-chip
              :color="isCurrentUserPowerUser ? 'positive' : 'grey-4'"
              :text-color="isCurrentUserPowerUser ? 'white' : 'grey-8'"
              :icon="isCurrentUserPowerUser ? 'shield' : 'person'"
              :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
              dense
            />
            <q-chip
              color="primary"
              text-color="white"
              icon="poll"
              :label="filteredSurveys.length + ' ' + $t('dashboard.surveys')"
              dense
            />
          </div>
        </div>
      </div>

      <!-- Filter Menu -->
      <SurveyFilterMenu
        v-model="filters"
        @filters-changed="onFiltersChanged"
        class="q-mb-lg"
      />

      <!-- Player Filter (ABOVE stats) -->
      <ReportsPlayerFilter
        v-model:selected-player="selectedPlayer"
        :player-options="playerOptions"
        :get-player-name="getPlayerNameBound"
      />

      <!-- Unified Metrics -->
      <ReportsMetrics
        :team-metrics="teamMetrics"
        :player-metrics="playerMetrics"
        :selected-player="selectedPlayer"
        :get-player-name="getPlayerNameBound"
      />

      <!-- Charts -->
      <ReportsCharts
        :loading="loading"
        :filtered-surveys="filteredSurveys"
        :current-team="currentTeam"
        :team-members="teamMembers"
        :selected-player="selectedPlayer"
      />
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import { useI18n } from 'vue-i18n'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import ReportsPlayerFilter from '@/components/reports/ReportsPlayerFilter.vue'
import ReportsMetrics from '@/components/reports/ReportsMetrics.vue'
import ReportsCharts from '@/components/reports/ReportsCharts.vue'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useReadiness } from '@/composable/useReadiness'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { useSurveyMetrics } from '@/composable/useSurveyMetrics'
import { useTeamMemberUtils } from '@/composable/useTeamMemberUtils'

const teamStore = useTeamStore()
const authStore = useAuthStore()
const { t } = useI18n()
const { isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()

// Composables
const { filters, createFilteredSurveys, updateFilters } = useSurveyFilters()
const { calculateTeamMetrics, calculatePlayerMetrics } = useSurveyMetrics()
const { loadTeamMembers, createPlayerOptions, getPlayerName } = useTeamMemberUtils()

// State
const loading = ref(true)
const teamMembers = ref([])
const selectedPlayer = ref(null)

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys || [])
const teamMemberCount = computed(() => currentTeam.value?.members?.length || 0)

// Filtered surveys using the shared composable
const filteredSurveys = createFilteredSurveys(surveys, filters)

// Reactive computed metrics (replaces imperative watchers)
const teamMetrics = computed(() => calculateTeamMetrics(filteredSurveys.value, teamMemberCount.value))
const playerMetrics = computed(() => calculatePlayerMetrics(filteredSurveys.value, selectedPlayer.value))

// Fix: bound getPlayerName with teamMembers
const getPlayerNameBound = (id) => getPlayerName(id, teamMembers.value)

const playerOptions = computed(() =>
  createPlayerOptions(teamMembers.value, t('reports.allPlayers'))
)

// Filter event handler
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

const loadData = async () => {
  if (!currentTeam.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    const { waitForTeam } = useReadiness()
    await waitForTeam()

    await loadTeamMembersData()

    if (surveys.value.length === 0 && authStore.user?.uid) {
      if (currentTeam.value?.id) {
        await setSurveysListener(currentTeam.value.id)
      }
    }

    loading.value = false
  } catch (error) {
    console.error('Error loading reports data:', error)
    loading.value = false
  }
}

// Watch for team changes only
watch(currentTeam, (newTeam) => {
  if (newTeam) {
    loadData()
  }
}, { immediate: false })

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.reports-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .reports-container {
    padding: 1.5rem;
  }
}
</style>
