<template>
  <BaseCard>
    <template #content>
      <div class="text-grey-8 rounded-borders flex justify-end">
        {{ getDisplayedDateTime(survey.date, survey.time) }}
      </div>
      <div class="row items-center no-wrap q-gutter-sm">
        <div class="text-h5 q-ma-sm">{{ survey.title }}</div>
      </div>

      <div class="text-grey-9 q-pa-sm">{{ survey.description }}</div>
      <div class="flex justify-end">
        <SurveyActions
          :yes-active="isSurveyActive() && isPositiveVote()"
          :no-active="isSurveyActive() && !isPositiveVote()"
          :is-power-user="isPowerUser"
          @vote="(val) => addSurveyVote(survey.id, val)"
          @open-settings="showModal = true"
        />
      </div>
    </template>

    <template #actions>
      <VoteStats :survey="survey" />
      <SurveyTag :type="survey.type" class="q-ma-none" />
    </template>
  </BaseCard>

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
import { useI18n } from 'vue-i18n'
import SurveyTag from '@/components/SurveyTag.vue'

const props = defineProps({
  survey: {
    type: Object,
    required: true,
  },
})

const authStore = useAuthStore()
const teamStore = useTeamStore()
const i18n = useI18n()
const { getDisplayedDateTime } = useTeamComposable(i18n.locale.value)

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
