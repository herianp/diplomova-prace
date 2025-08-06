<template>
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
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import MetricCard from '@/components/dashboard/MetricCard.vue'

const props = defineProps({
  filteredSurveys: {
    type: Array,
    required: true
  }
})

const authStore = useAuthStore()

const currentUser = computed(() => authStore.user)

const totalSurveys = computed(() => props.filteredSurveys.length)

const activeTeamMembers = computed(() => {
  if (!props.filteredSurveys.length) return 0

  const participatingMembers = new Set()

  props.filteredSurveys.forEach(survey => {
    survey.votes?.forEach(vote => {
      participatingMembers.add(vote.userUid)
    })
  })

  return participatingMembers.size
})

const myTotalVotes = computed(() => {
  return props.filteredSurveys.reduce((total, survey) => {
    const userVote = survey.votes?.find(vote => vote.userUid === currentUser.value?.uid)
    return userVote ? total + 1 : total
  }, 0)
})

const myYesVotes = computed(() => {
  return props.filteredSurveys.reduce((total, survey) => {
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

  const totalYesVotes = props.filteredSurveys.reduce((total, survey) => {
    const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
    return total + yesVotes
  }, 0)

  return Math.round((totalYesVotes / (activeTeamMembers.value * totalSurveys.value)) * 100)
})
</script>

<style scoped>
.metrics-row {
  animation: fadeInUp 0.6s ease-out;
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
