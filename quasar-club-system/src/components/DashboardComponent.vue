<template>
  <div class="dashboard-container">
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
      <!-- Welcome Header -->
      <div class="welcome-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ currentTeam?.name || $t('dashboard.noTeamSelected') }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ $t('dashboard.teamOverview') }}
            </div>
          </div>
          <q-chip
            :color="isCurrentUserPowerUser ? 'positive' : 'grey-4'"
            :text-color="isCurrentUserPowerUser ? 'white' : 'grey-8'"
            :icon="isCurrentUserPowerUser ? 'shield' : 'person'"
            :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
            dense
          />
        </div>
      </div>

      <!-- Survey Filters -->
      <div class="q-mb-lg">
        <SurveyFilterMenu
          v-model="filters"
          @filters-changed="onFiltersChanged"
        />
      </div>

      <!-- Metrics Cards -->
      <DashboardMetrics :filtered-surveys="filteredSurveys" />

      <!-- Recent Surveys History -->
<!--      <RecentSurveysGraph-->
<!--        :surveys="filteredRecentSurveys"-->
<!--        :current-user-uid="currentUser?.uid"-->
<!--        :is-loading="isLoading"-->
<!--        @refresh="refreshData"-->
<!--      />-->

      <!-- Charts Section -->
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6" ref="votingContainer">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="bar_chart" size="sm" color="primary" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.votingTrends') }}</div>
              </div>
              <template v-if="votingVisible">
                <VotingChart :surveys="filteredRecentSurveys" :user-uid="currentUser?.uid" />
              </template>
              <q-skeleton v-else type="rect" height="200px" />
            </q-card-section>
          </q-card>
        </div>

        <div class="col-12 col-md-6" ref="typesContainer">
          <q-card flat bordered>
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="donut_large" size="sm" color="primary" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.surveyTypes') }}</div>
              </div>
              <template v-if="typesVisible">
                <SurveyTypesChart :surveys="filteredSurveys" />
              </template>
              <q-skeleton v-else type="rect" height="200px" />
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useReadiness } from '@/composable/useReadiness'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics.vue'
import VotingChart from '@/components/dashboard/VotingChart.vue'
import SurveyTypesChart from '@/components/dashboard/SurveyTypesChart.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useAuthStore } from '@/stores/authStore.js'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { createLogger } from 'src/utils/logger'
import { useChartLazyLoad } from '@/composables/useChartLazyLoad'

const log = createLogger('DashboardComponent')
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { waitForTeam } = useReadiness()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()
const { filters, createFilteredSurveys, createRecentFilteredSurveys, updateFilters } = useSurveyFilters()

// Lazy load chart sections
const { chartContainer: votingContainer, isVisible: votingVisible } = useChartLazyLoad()
const { chartContainer: typesContainer, isVisible: typesVisible } = useChartLazyLoad()

const isLoading = ref(false)

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)

// Use the new composable for filtered surveys
const filteredSurveys = createFilteredSurveys(surveys, filters)
const filteredRecentSurveys = createRecentFilteredSurveys(surveys, 5, filters)

// Methods
const onFiltersChanged = (newFilters) => {
  updateFilters(newFilters)
}

const refreshData = async () => {
  isLoading.value = true
  try {
    if (currentTeam.value?.id && authStore.user?.uid) {
      setSurveysListener(currentTeam.value.id)
    }
  } catch (error) {
    log.error('Failed to refresh dashboard data', {
      error: error instanceof Error ? error.message : String(error),
      teamId: currentTeam.value?.id
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await waitForTeam()
  refreshData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .dashboard-container {
    padding: 1.5rem;
  }
}
</style>
