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
    <div class="metrics-row q-mb-lg">
      <div class="row q-col-gutter-md items-stretch">
        <div class="col-12 col-sm-6 col-md">
          <MetricCard
            :title="$t('dashboard.totalSurveys')"
            :value="totalSurveys"
            icon="poll"
            color="primary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md">
          <MetricCard
            :title="$t('dashboard.teamMembers')"
            :value="activeTeamMembers"
            icon="group"
            color="secondary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md">
          <MetricCard
            :title="$t('dashboard.myVotes')"
            :value="myTotalVotes"
            icon="how_to_vote"
            color="accent"
          />
        </div>
        <div class="col-12 col-sm-6 col-md">
          <MetricCard
            :title="$t('dashboard.personalParticipation')"
            :value="personalParticipationRate + '%'"
            icon="trending_up"
            color="positive"
          />
        </div>
        <div class="col-12 col-sm-6 col-md">
          <MetricCard
            :title="$t('dashboard.teamParticipation')"
            :value="teamParticipationRate + '%'"
            icon="trending_up"
            color="positive"
          />
        </div>
      </div>
    </div>

    <!-- Recent Surveys History -->
    <div class="recent-surveys q-mb-lg">
      <q-card flat bordered class="full-width">
        <q-card-section class="q-pa-none">
          <div class="row items-center q-pa-md">
            <div class="col">
              <h5 class="q-ma-none">{{ $t('dashboard.recentSurveys') }}</h5>
              <p class="text-grey-7 q-ma-none">{{ $t('dashboard.last5Surveys') }}</p>
            </div>
            <div class="col-auto">
              <q-btn
                flat
                round
                icon="refresh"
                @click="refreshData"
                :loading="isLoading"
              />
            </div>
          </div>

          <div class="q-px-md q-pb-md overflow-auto">
            <SurveyHistoryList
              :surveys="filteredRecentSurveys"
              :current-user-uid="currentUser?.uid"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>

    <!-- Charts Section -->
    <div class="charts-section">
      <div class="row q-gutter-md">
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <h6 class="q-ma-none q-mb-md">{{ $t('dashboard.votingTrends') }}</h6>
              <VotingChart :surveys="filteredRecentSurveys" :user-uid="currentUser?.uid" />
            </q-card-section>
          </q-card>
        </div>
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
import { useAuthStore } from '@/stores/authStore'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import SurveyHistoryList from '@/components/dashboard/SurveyHistoryList.vue'
import VotingChart from '@/components/dashboard/VotingChart.vue'
import SurveyTypesChart from '@/components/dashboard/SurveyTypesChart.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
const teamStore = useTeamStore()
const authStore = useAuthStore()

const isLoading = ref(false)

// Filter state with "this season" as default
const filters = ref({
  searchName: '',
  dateFrom: '2025-07-13', // Season start
  dateTo: '2026-06-30'    // Season end
})

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const currentUser = computed(() => authStore.user)
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

const totalSurveys = computed(() => filteredSurveys.value.length)

const isCurrentUserPowerUser = computed(() => {
  return currentTeam.value?.powerusers?.includes(currentUser.value?.uid) || false
})

// Count team members who participated in filtered surveys
const activeTeamMembers = computed(() => {
  if (!filteredSurveys.value.length) return 0

  const participatingMembers = new Set()

  filteredSurveys.value.forEach(survey => {
    survey.votes?.forEach(vote => {
      participatingMembers.add(vote.userUid)
    })
  })

  return participatingMembers.size
})

const filteredRecentSurveys = computed(() => {
  return filteredSurveys.value
    .slice()
    .sort((a, b) => parseInt(b.createdDate) - parseInt(a.createdDate))
    .slice(0, 5)
})

const myTotalVotes = computed(() => {
  return filteredSurveys.value.reduce((total, survey) => {
    const userVote = survey.votes?.find(vote => vote.userUid === currentUser.value?.uid)
    return userVote ? total + 1 : total
  }, 0)
})

const myYesVotes = computed(() => {
  return filteredSurveys.value.reduce((total, survey) => {
    const userVote = survey.votes?.find(vote => vote.userUid === currentUser.value?.uid)
    return (userVote && userVote.vote === true) ? total + 1 : total
  }, 0)
})

const personalParticipationRate = computed(() => {
  if (totalSurveys.value === 0) return 0
  return Math.round((myYesVotes.value / totalSurveys.value) * 100)
})

const teamParticipationRate = computed(() => {
  if (totalSurveys.value === 0 || activeTeamMembers.value === 0) return 0

  const totalYesVotes = filteredSurveys.value.reduce((total, survey) => {
    const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
    return total + yesVotes
  }, 0)

  return Math.round((totalYesVotes / (activeTeamMembers.value * totalSurveys.value)) * 100)
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

.metrics-row {
  animation: fadeInUp 0.6s ease-out;
}

.recent-surveys {
  animation: fadeInUp 0.8s ease-out;
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
