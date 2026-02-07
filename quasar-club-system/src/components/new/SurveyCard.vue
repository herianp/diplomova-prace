<template>
  <BaseCard :background-class="surveyBackgroundClass">
    <template #content>
      <!-- Header with date and status -->
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-grey-8 rounded-borders">
          {{ getDisplayedDateTime(survey.date, survey.time) }}
        </div>
        <!-- Status Chip -->
        <q-chip 
          :color="surveyStatusDisplay.color" 
          :icon="surveyStatusDisplay.icon"
          text-color="white"
          dense
        >
          {{ $t(surveyStatusDisplay.label) }}
        </q-chip>
      </div>
      
      <div class="row items-center no-wrap q-gutter-sm">
        <div class="text-h5 q-ma-none q-ml-sm">{{ survey.title }}</div>
      </div>
      <div class="text-grey-9 text-h6 q-pl-lg">{{ survey.description }}</div>
      
      <!-- Actions Row -->
      <div class="row justify-between items-center q-mt-md">
        <!-- Survey Voting Actions -->
        <div class="col">
          <SurveyActions
            :yes-active="isSurveyActive() && isPositiveVote()"
            :no-active="isSurveyActive() && !isPositiveVote()"
            :is-power-user="isPowerUser && !isExpired"
            :disabled="isExpired && surveyStatus !== 'awaiting_verification'"
            @vote="(val) => !isExpired && addSurveyVote(survey.id, val)"
            @open-settings="showModal = true"
          />
        </div>
        
        <!-- Power User Verification Actions -->
        <div v-if="isPowerUser" class="col-auto">
          <!-- Ready to Check Button -->
          <q-btn
            v-if="surveyStatus === 'awaiting_verification'"
            color="deep-orange"
            icon="pending_actions"
            :label="$t('survey.verification.readyToCheck')"
            @click="goToVerification"
            unelevated
            dense
            class="q-ml-sm"
          />
          
          <!-- Modify Votes Button for Closed Surveys -->
          <q-btn
            v-else-if="canModify"
            color="deep-orange"
            icon="edit"
            :label="$t('survey.verification.modifyVotes')"
            @click="goToVerification"
            outline
            dense
            size="sm"
            class="q-ml-sm"
          />
        </div>
      </div>
    </template>

    <template #actions>
      <VoteStats :survey="survey" />
      <SurveyTag :type="survey.type" class="q-ml-lg q-ma-none" />
    </template>
  </BaseCard>

  <BaseModal v-model="showModal" :title="$t('survey.update')">
    <template #body>
      <SurveyEditModal 
        :survey="survey"
        @updated="handleSurveyUpdated"
        @deleted="handleSurveyDeleted"
        @close="showModal = false"
      />
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { DateTime } from 'luxon'
import { useAuthStore } from '@/stores/authStore.ts'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useDateHelpers } from '@/composable/useDateHelpers.ts'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import BaseModal from '@/components/base/BaseModal.vue'
import VoteStats from '@/components/VoteStats.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import SurveyActions from '@/components/SurveyActions.vue'
import SurveyEditModal from '@/components/survey/SurveyEditModal.vue'
import { useI18n } from 'vue-i18n'
import SurveyTag from '@/components/SurveyTag.vue'
import { useRouter } from 'vue-router'
import { getSurveyStatus, getSurveyStatusDisplay, canModifyVotes } from '@/utils/surveyStatusUtils'
import { SurveyStatus } from '@/interfaces/interfaces'

const props = defineProps({
  survey: {
    type: Object,
    required: true,
  },
})

const authStore = useAuthStore()
const teamStore = useTeamStore()
const { voteOnSurvey } = useSurveyUseCases()
const router = useRouter()
const i18n = useI18n()
const { getDisplayedDateTime } = useDateHelpers(i18n.locale.value)

const showModal = ref(false)

const user = computed(() => authStore.user)
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid))

// Survey status computeds
const surveyStatus = computed(() => getSurveyStatus(props.survey, isPowerUser.value))
const surveyStatusDisplay = computed(() => getSurveyStatusDisplay(props.survey, isPowerUser.value))
const canModify = computed(() => canModifyVotes(props.survey, isPowerUser.value))

// Check if survey is expired (older than current time)
const isExpired = computed(() => {
  const now = DateTime.now()
  const surveyDateTime = DateTime.fromISO(`${props.survey.date}T${props.survey.time}`)
  return surveyDateTime < now
})

// Dynamic background class for survey status
const surveyBackgroundClass = computed(() => {
  switch (surveyStatus.value) {
    case SurveyStatus.AWAITING_VERIFICATION:
      return 'survey-awaiting-verification'
    case SurveyStatus.CLOSED:
      return 'survey-closed'
    case SurveyStatus.ACTIVE:
    default:
      return 'survey-active'
  }
})

function isSurveyActive() {
  return props.survey.votes.some((vote) => vote.userUid === user.value?.uid)
}

function isPositiveVote() {
  return props.survey.votes.some((vote) => vote.userUid === user.value?.uid && vote.vote)
}

function addSurveyVote(surveyId, vote) {
  // Block voting if survey is expired
  if (isExpired.value || !user.value?.uid) {
    return
  }
  voteOnSurvey(surveyId, user.value.uid, vote)
}

// Navigation to verification page
const goToVerification = () => {
  router.push({ name: 'surveyVerification', params: { surveyId: props.survey.id } })
}

// Handle survey update
const handleSurveyUpdated = () => {
  // The survey data will be automatically updated through the store listener
  // Just close the modal
  showModal.value = false
}

// Handle survey deletion
const handleSurveyDeleted = () => {
  // The survey will be automatically removed from the list through the store listener
  // Just close the modal
  showModal.value = false
}
</script>

<style scoped>
.survey-active {
  background-color: #e8f5e8 !important; /* Light green background */
  border-left: 4px solid #4caf50 !important; /* Green left border */
}

.survey-awaiting-verification {
  background-color: #fff3e0 !important; /* Light orange background */
  border-left: 6px solid #ff6f00 !important; /* Deep orange left border */
  box-shadow: 0 2px 8px rgba(255, 111, 0, 0.2) !important; /* Orange shadow */
}

.survey-closed {
  background-color: #f5f5f5 !important; /* Light grey background */
  border-left: 4px solid #9e9e9e !important; /* Grey left border */
}

/* Legacy support for expired surveys */
.survey-expired {
  background-color: #ffebee !important; /* Light red background */
  border-left: 4px solid #f44336 !important; /* Red left border */
}
</style>
