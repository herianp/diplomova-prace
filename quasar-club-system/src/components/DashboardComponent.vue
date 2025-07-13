<template>
  <div class="dashboard-container">
    <!-- Team Header -->
    <div class="team-header q-mb-lg">
      <q-card flat bordered class="q-pa-md">
        <div class="row items-center">
          <div class="col">
            <h4 class="q-ma-none text-primary">{{ currentTeam?.name || 'No Team Selected' }}</h4>
            <p class="text-grey-7 q-ma-none">{{ $t('dashboard.teamOverview') }}</p>
          </div>
          <div class="col-auto">
            <q-chip
              :color="isCurrentUserPowerUser ? 'positive' : 'info'"
              text-color="white"
              :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
            />
          </div>
        </div>
      </q-card>
    </div>

    <!-- Metrics Cards -->
    <div class="metrics-row q-mb-lg">
      <div class="row q-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('dashboard.totalSurveys')"
            :value="totalSurveys"
            icon="poll"
            color="primary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('dashboard.teamMembers')"
            :value="currentTeam?.members?.length || 0"
            icon="group"
            color="secondary"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('dashboard.myVotes')"
            :value="myTotalVotes"
            icon="how_to_vote"
            color="accent"
          />
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <MetricCard
            :title="$t('dashboard.participation')"
            :value="participationRate + '%'"
            icon="trending_up"
            color="positive"
          />
        </div>
      </div>
    </div>

    <!-- Recent Surveys History -->
    <div class="recent-surveys q-mb-lg">
      <q-card flat bordered>
        <q-card-section>
          <div class="row items-center q-mb-md">
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

          <SurveyHistoryList
            :surveys="recentSurveys"
            :current-user-uid="currentUser?.uid"
          />
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
              <VotingChart :surveys="recentSurveys" :user-uid="currentUser?.uid" />
            </q-card-section>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <q-card flat bordered>
            <q-card-section>
              <h6 class="q-ma-none q-mb-md">{{ $t('dashboard.surveyTypes') }}</h6>
              <SurveyTypesChart :surveys="surveys" />
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
const teamStore = useTeamStore()
const authStore = useAuthStore()

const isLoading = ref(false)

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const currentUser = computed(() => authStore.user)
const surveys = computed(() => teamStore.surveys)

const totalSurveys = computed(() => surveys.value.length)

const isCurrentUserPowerUser = computed(() => {
  return currentTeam.value?.powerusers?.includes(currentUser.value?.uid) || false
})

const recentSurveys = computed(() => {
  return surveys.value
    .slice()
    .sort((a, b) => parseInt(b.createdDate) - parseInt(a.createdDate))
    .slice(0, 5)
})

const myTotalVotes = computed(() => {
  return surveys.value.reduce((total, survey) => {
    const userVote = survey.votes?.find(vote => vote.userUid === currentUser.value?.uid)
    return userVote ? total + 1 : total
  }, 0)
})

const myYesVotes = computed(() => {
  return surveys.value.reduce((total, survey) => {
    const userVote = survey.votes?.find(vote => vote.userUid === currentUser.value?.uid)
    return (userVote && userVote.vote === true) ? total + 1 : total
  }, 0)
})

const participationRate = computed(() => {
  if (totalSurveys.value === 0) return 0
  return Math.round((myYesVotes.value / totalSurveys.value) * 100)
})

// Methods
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
