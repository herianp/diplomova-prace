<template>
  <div class="metrics-row q-mb-lg">
    <div class="row q-col-gutter-sm items-stretch">
      <div class="col-6 col-md">
        <MetricCard
          :title="$t('dashboard.totalSurveys')"
          :value="totalSurveys"
          icon="poll"
          color="primary"
        />
      </div>
      <div class="col-6 col-md">
        <MetricCard
          :title="$t('dashboard.teamMembers')"
          :value="activeTeamMembers"
          icon="group"
          color="secondary"
        />
      </div>
      <div class="col-6 col-md">
        <MetricCard
          :title="$t('dashboard.myVotes')"
          :value="myTotalVotes"
          icon="how_to_vote"
          color="accent"
        />
      </div>
      <div class="col-6 col-md">
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
          icon="groups"
          color="info"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import { useSurveyMetrics } from '@/composable/useSurveyMetrics'

const props = defineProps({
  filteredSurveys: {
    type: Array,
    required: true
  }
})

const authStore = useAuthStore()
const {
  calculateTotalSurveys,
  calculateActiveTeamMembers,
  calculatePersonalMetrics,
  calculateTeamParticipationRate
} = useSurveyMetrics()

const currentUser = computed(() => authStore.user)

// Use the new composable functions
const totalSurveys = computed(() => calculateTotalSurveys(props.filteredSurveys))

const activeTeamMembers = computed(() => calculateActiveTeamMembers(props.filteredSurveys))

const personalMetrics = computed(() =>
  calculatePersonalMetrics(props.filteredSurveys, currentUser.value?.uid)
)

const myTotalVotes = computed(() => personalMetrics.value.myTotalVotes)
const personalParticipationRate = computed(() => personalMetrics.value.personalParticipationRate)

const teamParticipationRate = computed(() =>
  calculateTeamParticipationRate(props.filteredSurveys, activeTeamMembers.value)
)
</script>
