<template>
  <div class="col-12 list-item-width">
    <BaseCard>
      <template #content>
        <div class="text-overline">{{ getDisplayedDateTime(survey.date, survey.time) }}</div>
        <div class="text-h5 q-mt-sm q-mb-xs">{{ survey.title }}</div>
        <div class="text-caption text-grey">{{ survey.description }}</div>
      </template>

      <template #media>
        <q-img class="rounded-borders max-h-150" src="https://cdn.quasar.dev/img/parallax2.jpg" />
      </template>

      <template #actions>
          <SurveyActions
            :yes-active="isSurveyActive() && isPositiveVote()"
            :no-active="isSurveyActive() && !isPositiveVote()"
            :is-power-user="isPowerUser"
            @vote="(val) => addSurveyVote(survey.id, val)"
            @open-settings="showModal = true"
          />
        <VoteStats :survey="survey" />
      </template>
    </BaseCard>
  </div>

  <BaseModal v-model="showModal" :title="$t('survey.update')">
    <template #body>
      <p>This is modal content. from my slot body</p>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore.ts'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useTeamComposable } from '@/composable/useTeamComposable.ts'
import BaseModal from '@/components/base/BaseModal.vue'
import VoteStats from '@/components/VoteStats.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import SurveyActions from '@/components/SurveyActions.vue'

const props = defineProps({
  survey: {
    type: Object,
    required: true,
  },
})

const authStore = useAuthStore()
const teamStore = useTeamStore()
const { getDisplayedDateTime } = useTeamComposable()

const showModal = ref(false)

const user = computed(() => authStore.user)
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid))

function isSurveyActive() {
  return props.survey.votes.some((vote) => vote.userUid === user.value.uid)
}

function isPositiveVote() {
  return props.survey.votes.some((vote) => vote.userUid === user.value.uid && vote.vote)
}

function addSurveyVote(surveyId, vote) {
  teamStore.addSurveyVote(surveyId, user.value.uid, vote)
}
</script>

<style scoped></style>
