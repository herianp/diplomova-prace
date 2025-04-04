<template>
  <div>
    <h2 v-if="!isMobile" style="text-align: center" class="q-ma-none q-pa-none">{{ $t('survey.title') }}</h2>

    <div v-if="isPowerUser" class="powerUser-navbar">
      <q-btn
        @click="handleCreateSurvey"
        align="around"
        class="btn-fixed-width"
        color="brown-5"
        :label="$t('survey.create')"
        icon="lightbulb_outline"
      />
    </div>

    <div class="row wrap q-col-gutter-lg q-pa-lg justify-start">
      <div
        v-for="survey in surveys"
        :key="survey.id"
        class="col-12"
      >
        <SurveyCard v-if="!isMobile" :survey="survey" />
        <SurveyCardMobile v-else :survey="survey" />
      </div>
    </div>

    <BaseModal v-model="showModal" :title="$t('survey.create')">
      <template #body>
        <SurveyForm @submit="handleSurveySubmit" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import SurveyCard from '@/components/new/SurveyCard.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BaseModal from '@/components/base/BaseModal.vue'
import SurveyForm from '@/components/modal/SurveyForm.vue'
import { useDateHelpers } from '@/composable/useDateHelpers.ts'
import { useTeamComposable } from '@/composable/useTeamComposable.js'
import { useI18n } from 'vue-i18n'
import { useScreenComposable } from '@/composable/useScreenComposable.js'
import SurveyCardMobile from '@/components/new/SurveyCardMobile.vue'

const auth = getAuth()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { isMobile } = useScreenComposable()
const i18n = useI18n()
const { getDateByDateAndTime } = useDateHelpers(i18n.locale.value)
const { addSurvey } = useTeamComposable()

const surveys = computed(() => teamStore.surveys)
const showModal = ref(false)
const backdropFilter = ref(null)

const user = computed(() => authStore.user)
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid))

function handleCreateSurvey() {
  backdropFilter.value = 'contrast(40%)'
  showModal.value = true
}

async function handleSurveySubmit(payload) {
  try {
    await addSurvey({
      title: payload.title,
      description: payload.description,
      date: payload.date,
      time: payload.time,
      dateTime: getDateByDateAndTime(payload.date, payload.time),
      teamId: currentTeam.value.id,
      type: payload.surveyType,
    })
  } catch (err) {
  console.log(`err ${err}`);
  }

  console.log('Submitted data:', payload)
  showModal.value = false
}

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.setSurveysListener(teamStore.currentTeam.id)
    } else {
      console.error('No authenticated user found.')
    }
  })
})
</script>

<style scoped>

</style>
