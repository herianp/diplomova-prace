<template>
  <div class="dashboard-container">
    <!-- Loading Skeleton -->
    <template v-if="!currentTeam">
      <div class="q-mb-lg">
        <q-card flat bordered class="q-pa-md">
          <q-skeleton type="text" width="40%" class="q-mb-sm" />
          <q-skeleton type="text" width="25%" />
        </q-card>
      </div>
      <div class="row q-col-gutter-md q-mb-lg">
        <div v-for="n in 4" :key="n" class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <q-skeleton type="text" width="60%" class="q-mb-sm" />
            <q-skeleton type="rect" height="40px" />
          </q-card>
        </div>
      </div>
      <q-card flat bordered class="q-pa-md">
        <q-skeleton type="rect" height="200px" />
      </q-card>
    </template>

    <template v-else>
    <!-- Team Header -->
    <div class="team-header q-mb-lg">
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center">
          <div class="col">
            <h4 class="q-ma-none text-warning">{{ currentTeam?.name || 'No Team Selected' }}</h4>
            <h6 class="text-grey-7 q-ma-none">{{ $t('dashboard.teamOverview') }}</h6>
          </div>
          <div class="col-auto">
            <q-chip
              :color="isCurrentUserPowerUser ? 'positive' : 'info'"
              text-color="white"
              :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
              icon="person"
              size="lg"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Survey Filters -->
    <div class="survey-filters q-mb-lg">
      <SurveyFilterMenu
        v-model="filters"
        @filters-changed="onFiltersChanged"
      />
    </div>

    <!-- Metrics Cards -->
    <DashboardMetrics :filtered-surveys="filteredSurveys" />

    <!-- Recent Surveys History -->
    <RecentSurveysGraph
      :surveys="filteredRecentSurveys"
      :current-user-uid="currentUser?.uid"
      :is-loading="isLoading"
      @refresh="refreshData"
    />

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="row q-col-gutter-md">
        <!-- Graph: Trends -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <h6 class="q-ma-none q-mb-md">{{ $t('dashboard.votingTrends') }}</h6>
              <VotingChart :surveys="filteredRecentSurveys" :user-uid="currentUser?.uid" />
            </q-card-section>
          </q-card>
        </div>

        <!-- Graph: Type of survey -->
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <h6 class="q-ma-none q-mb-md">{{ $t('dashboard.surveyTypes') }}</h6>
              <SurveyTypesChart :surveys="filteredSurveys" />
            </q-card-section>
          </q-card>
        </div>
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
import RecentSurveysGraph from '@/components/graphs/RecentSurveysGraph.vue'
import VotingChart from '@/components/dashboard/VotingChart.vue'
import SurveyTypesChart from '@/components/dashboard/SurveyTypesChart.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useAuthStore } from '@/stores/authStore.js'
import { useSurveyFilters } from '@/composable/useSurveyFilters'

const teamStore = useTeamStore()
const authStore = useAuthStore()
const { waitForTeam } = useReadiness()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()
const { filters, createFilteredSurveys, createRecentFilteredSurveys, updateFilters } = useSurveyFilters()

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
    console.error('Error refreshing dashboard data:', error)
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

.team-header :deep(.q-card) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.team-header .text-grey-7 {
  color: rgba(255, 255, 255, 0.8) !important;
}



.charts-section {
  animation: fadeInUp 1s ease-out;
}


@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
