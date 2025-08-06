<template>
  <div class="dashboard-container">
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
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics.vue'
import RecentSurveysGraph from '@/components/graphs/RecentSurveysGraph.vue'
import VotingChart from '@/components/dashboard/VotingChart.vue'
import SurveyTypesChart from '@/components/dashboard/SurveyTypesChart.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'

const teamStore = useTeamStore()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()

const isLoading = ref(false)

// Filter state with "this season" as default
const filters = ref({
  searchName: '',
  dateFrom: '2025-07-13', // Season start
  dateTo: '2026-06-30'    // Season end
})

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)

// Filtered surveys based on search and date filters
const filteredSurveys = computed(() => {
  let filtered = [...surveys.value]

  // 1. Apply name search filter
  if (filters.value.searchName.trim()) {
    const searchTerm = filters.value.searchName.toLowerCase().trim()
    filtered = filtered.filter(survey =>
      survey.title.toLowerCase().includes(searchTerm)
    )
  }

  // 2. Apply date range filter (always apply since we have default season dates)
  filtered = filtered.filter(survey => {
    const surveyDate = survey.date

    // If both dates are set, check if survey is within range
    if (filters.value.dateFrom && filters.value.dateTo) {
      return surveyDate >= filters.value.dateFrom && surveyDate <= filters.value.dateTo
    }

    // If only dateFrom is set, check if survey is on or after that date
    if (filters.value.dateFrom) {
      return surveyDate >= filters.value.dateFrom
    }

    // If only dateTo is set, check if survey is on or before that date
    if (filters.value.dateTo) {
      return surveyDate <= filters.value.dateTo
    }

    return true
  })

  // 4. Sort: oldest first (ascending order)
  return filtered.sort((a, b) => a.date.localeCompare(b.date))
})


const filteredRecentSurveys = computed(() => {
  return filteredSurveys.value
    .slice()
    .sort((a, b) => parseInt(b.createdDate) - parseInt(a.createdDate))
    .slice(0, 5)
})


// Methods
const onFiltersChanged = (newFilters) => {
  filters.value = { ...newFilters }
}

const refreshData = async () => {
  isLoading.value = true
  try {
    // Refresh surveys data
    if (currentTeam.value?.id) {
      teamStore.setSurveysListener(currentTeam.value.id)
    }
  } catch (error) {
    console.error('Error refreshing dashboard data:', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  refreshData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 1rem;
}

.team-header .q-card {
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
