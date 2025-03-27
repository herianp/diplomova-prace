<template>
  <q-card class="my-card" flat bordered>
    <q-card-section horizontal class="row justify-between items-center">
      <q-card-section class="q-pt-xs">
        <div class="text-overline">{{ getDisplayedDateTime(survey.date, survey.time) }}</div>
        <div class="text-h5 q-mt-sm q-mb-xs">{{ survey.title }}</div>
        <div class="text-caption text-grey">{{ survey.description }}</div>
      </q-card-section>

      <q-card-section class="col-5 flex flex-center">
        <q-img class="rounded-borders max-h-150" src="https://cdn.quasar.dev/img/parallax2.jpg" />
      </q-card-section>
    </q-card-section>

    <q-separator />

    <q-card-actions>
      <q-btn flat round icon="settings" @click="showModal = true" />

      <q-btn
        label="Yes"
        :color="isSurveyActive() && isPositiveVote() ? 'green' : 'black'"
        @click="addSurveyVote(survey.id, true)"
        class="q-mr-sm"
        unelevated
        rounded
      />
      <q-btn
        label="No"
        :color="isSurveyActive() && !isPositiveVote() ? 'red' : 'black'"
        @click="addSurveyVote(survey.id, false)"
        unelevated
        rounded
      />
    </q-card-actions>

    <BaseModal v-model="showModal" :title="$t('survey.update')">
      <template #body>
        <p>This is modal content. from my slot body</p>
      </template>
    </BaseModal>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/authStore.js'
import { useTeamStore } from '@/stores/teamStore.js'
import { useTeamComposable } from '@/composable/useTeamComposable.js'
import BaseModal from '@/components/modal/BaseModal.vue'

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
