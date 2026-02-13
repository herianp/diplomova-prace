<template>
  <div class="survey-verification-page q-pa-lg">
    <div v-if="loading" class="row justify-center q-mt-xl">
      <q-spinner-dots size="50px" color="primary" />
    </div>

    <div v-else-if="survey && teamMembers.length" class="verification-content">
      <HeaderBanner
        :title="$t('survey.verification.title')"
        :survey-title="survey.title"
        :description="$t('survey.verification.reviewAttendance')"
        @go-back="handleGoBack"
        :goBackOption="true"
      />

      <!-- Survey Info -->
      <q-card flat bordered class="q-mb-lg">
        <q-card-section class="bg-primary text-white">
          <div class="text-h6">
            <q-icon name="info" class="q-mr-sm" />
            {{ $t('survey.verification.surveyInfo') }}
          </div>
        </q-card-section>

        <q-card-section>
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">{{ $t('survey.date') }}</div>
              <div class="text-body1">{{ formatSurveyDate() }}</div>
            </div>
            <div class="col-12 col-md-6">
              <div class="text-caption text-grey-6">{{ $t('survey.type.label') }}</div>
              <div class="text-body1">{{ $t(`survey.type.${survey.type}`) }}</div>
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-6">{{ $t('survey.description') }}</div>
              <div class="text-body1">{{ survey.description || $t('survey.noDescription') }}</div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Verification Instructions -->
      <q-banner class="bg-warning text-dark q-mb-lg" rounded>
        <template v-slot:avatar>
          <q-icon name="warning" color="warning" />
        </template>
        <div class="text-body1">
          {{ $t('survey.verification.instructions') }}
        </div>
      </q-banner>

      <!-- Team Members Attendance -->
      <q-card flat bordered>
        <q-card-section class="bg-deep-orange text-white">
          <div class="text-h6">
            <q-icon name="group" class="q-mr-sm" />
            {{ $t('survey.verification.attendanceReview') }}
          </div>
        </q-card-section>

        <q-card-section class="q-pa-none">
          <div class="row q-pa-md" v-for="member in teamMembers" :key="member.uid">
            <div class="col">
              <!-- Member Info -->
              <div class="row items-center">
                <div class="col-auto">
                  <q-avatar size="40px" color="primary" text-color="white" class="q-mr-md">
                    <q-icon v-if="!member.photoURL" name="person" />
                    <img v-else :src="member.photoURL" alt="Profile" />
                  </q-avatar>
                </div>
                <div class="col">
                  <div class="text-body1 text-weight-medium">
                    {{ member.displayName || member.email }}
                  </div>
                  <div class="text-caption text-grey-6">
                    {{ member.email }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Attendance Status -->
            <div class="col-auto">
              <div class="row items-center q-gutter-sm">
                <div class="text-caption text-grey-6">
                  {{ $t('survey.verification.attendance') }}:
                </div>
                <q-btn-toggle
                  v-model="memberVotes[member.uid]"
                  spread
                  no-caps
                  unelevated
                  color="grey-3"
                  text-color="grey-8"
                  toggle-color="deep-orange"
                  toggle-text-color="white"
                  :options="attendanceOptions"
                  @update:model-value="updateMemberVote(member.uid, $event)"
                  class="attendance-toggle"
                />
              </div>
            </div>
          </div>

          <q-separator />

          <!-- Summary -->
          <div class="q-pa-md bg-grey-1">
            <div class="text-h6 q-mb-md">{{ $t('survey.verification.summary') }}</div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-card flat class="bg-green-1 text-center q-pa-sm">
                  <div class="text-h4 text-green-8">{{ attendanceSummary.yes }}</div>
                  <div class="text-caption text-green-6">{{ $t('common.yes') }}</div>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card flat class="bg-red-1 text-center q-pa-sm">
                  <div class="text-h4 text-red-8">{{ attendanceSummary.no }}</div>
                  <div class="text-caption text-red-6">{{ $t('common.no') }}</div>
                </q-card>
              </div>
              <div class="col-12 col-md-4">
                <q-card flat class="bg-grey-3 text-center q-pa-sm">
                  <div class="text-h4 text-grey-8">{{ attendanceSummary.unvoted }}</div>
                  <div class="text-caption text-grey-6">{{ $t('survey.verification.unvoted') }}</div>
                </q-card>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>

      <!-- Actions -->
      <div class="row justify-end q-gutter-md q-mt-lg">
        <q-btn
          color="grey-7"
          icon="cancel"
          :label="$t('common.cancel')"
          @click="handleGoBack"
          outline
        />
        <!-- Delete Button (Power Users Only) -->
        <q-btn
          v-if="isCurrentUserPowerUser"
          color="negative"
          icon="delete"
          :label="$t('survey.verification.deleteSurvey')"
          @click="confirmDeleteSurvey"
          outline
          :loading="deleting"
        />
        <q-btn
          color="primary"
          icon="save"
          :label="$t('survey.verification.saveAndClose')"
          @click="saveSurvey"
          :loading="saving"
        />
      </div>
    </div>

    <div v-else-if="!survey" class="text-center q-mt-xl">
      <q-icon name="error" size="4em" color="negative" class="q-mb-md" />
      <div class="text-h6">{{ $t('survey.verification.notFound') }}</div>
    </div>

    <div v-else class="text-center q-mt-xl">
      <q-icon name="group_off" size="4em" color="grey-4" class="q-mb-md" />
      <div class="text-h6">{{ $t('survey.verification.noMembers') }}</div>
    </div>

    <!-- Delete Confirmation Dialog -->
    <q-dialog v-model="showDeleteDialog" persistent>
      <q-card>
        <q-card-section class="row items-center">
          <q-icon name="warning" color="negative" size="2em" class="q-mr-md" />
          <span class="text-h6">{{ $t('survey.verification.confirmDelete') }}</span>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="text-body1">
            {{ $t('survey.verification.deleteMessage', { title: survey?.title }) }}
          </div>
          <div class="text-body2 text-negative q-mt-md">
            <q-icon name="warning" class="q-mr-xs" />
            {{ $t('survey.verification.deleteWarning') }}
          </div>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('common.cancel')"
            color="grey-7"
            v-close-popup
            :disable="deleting"
          />
          <q-btn
            :label="$t('survey.verification.deleteConfirm')"
            color="negative"
            @click="deleteSurvey"
            :loading="deleting"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { useCashboxUseCases } from '@/composable/useCashboxUseCases'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { queryByIdsInChunks } from '@/utils/firestoreUtils'
import HeaderBanner from '@/components/HeaderBanner.vue'

const route = useRoute()
const router = useRouter()
const teamStore = useTeamStore()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { getSurveyById, verifySurvey, deleteSurvey: deleteSurveyFromDB } = useSurveyUseCases()
const { generateAutoFines } = useCashboxUseCases()
const $q = useQuasar()
const { t } = useI18n()

// State
const loading = ref(true)
const saving = ref(false)
const deleting = ref(false)
const showDeleteDialog = ref(false)
const survey = ref(null)
const teamMembers = ref([])
const memberVotes = ref({})

// Computed
const currentTeam = computed(() => teamStore.currentTeam)

const attendanceOptions = computed(() => [
  { label: t('common.yes'), value: true },
  { label: t('common.no'), value: false },
  { label: t('survey.verification.unvoted'), value: null }
])

const attendanceSummary = computed(() => {
  const summary = { yes: 0, no: 0, unvoted: 0 }

  Object.values(memberVotes.value).forEach(vote => {
    if (vote === true) summary.yes++
    else if (vote === false) summary.no++
    else summary.unvoted++
  })

  return summary
})

// Methods
const loadSurvey = async () => {
  try {
    const surveyId = route.params.surveyId
    const surveyData = await getSurveyById(surveyId)

    if (!surveyData) {
      console.error('Survey not found')
      return
    }

    survey.value = surveyData
    await loadTeamMembers()
    initializeMemberVotes()

  } catch (error) {
    console.error('Error loading survey:', error)
    $q.notify({
      type: 'negative',
      message: t('survey.verification.loadError'),
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

const loadTeamMembers = async () => {
  try {
    if (!currentTeam.value?.members?.length) {
      teamMembers.value = []
      return
    }

    teamMembers.value = await queryByIdsInChunks('users', currentTeam.value.members)
  } catch (error) {
    console.error('Error loading team members:', error)
    teamMembers.value = []
  }
}

const initializeMemberVotes = () => {
  const votes = {}

  teamMembers.value.forEach(member => {
    const existingVote = survey.value.votes?.find(vote => vote.userUid === member.uid)
    votes[member.uid] = existingVote ? existingVote.vote : null
  })

  memberVotes.value = votes
}

const updateMemberVote = (memberUid, vote) => {
  memberVotes.value[memberUid] = vote
}

const formatSurveyDate = () => {
  if (!survey.value.date || !survey.value.time) return ''

  const dateTime = DateTime.fromISO(`${survey.value.date}T${survey.value.time}`)
  return dateTime.toFormat('DDDD \'at\' t')
}

const saveSurvey = async () => {
  try {
    saving.value = true

    // Convert memberVotes to IVote array
    const updatedVotes = []

    Object.entries(memberVotes.value).forEach(([userUid, vote]) => {
      if (vote !== null) {
        updatedVotes.push({ userUid, vote })
      }
    })

    // Save original votes before verification for auto-fine comparison
    const originalVotes = survey.value.votes || []

    // Verify the survey with updated votes
    await verifySurvey(survey.value.id, currentUser.value.uid, updatedVotes)

    // Generate auto-fines based on fine rules
    if (currentTeam.value?.id) {
      try {
        const finesGenerated = await generateAutoFines(
          currentTeam.value.id,
          survey.value.id,
          survey.value.title,
          survey.value.type,
          originalVotes,
          updatedVotes,
          currentTeam.value.members,
          currentUser.value.uid
        )
        if (finesGenerated > 0) {
          $q.notify({
            type: 'info',
            message: t('cashbox.autoFines.generated', { count: finesGenerated }),
            icon: 'gavel'
          })
        }
      } catch (fineError) {
        console.error('Error generating auto-fines:', fineError)
      }
    }

    $q.notify({
      type: 'positive',
      message: t('survey.verification.saveSuccess'),
      icon: 'check'
    })

    // Go back to previous page
    handleGoBack()

  } catch (error) {
    console.error('Error saving survey:', error)
    $q.notify({
      type: 'negative',
      message: t('survey.verification.saveError'),
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

const confirmDeleteSurvey = () => {
  showDeleteDialog.value = true
}

const deleteSurvey = async () => {
  try {
    deleting.value = true

    await deleteSurveyFromDB(survey.value.id)

    $q.notify({
      type: 'positive',
      message: t('survey.verification.deleteSuccess'),
      icon: 'check'
    })

    // Close dialog and go back
    showDeleteDialog.value = false
    handleGoBack()

  } catch (error) {
    console.error('Error deleting survey:', error)
    $q.notify({
      type: 'negative',
      message: t('survey.verification.deleteError'),
      icon: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const handleGoBack = () => {
  router.go(-1)
}

onMounted(() => {
  loadSurvey()
})
</script>

<style scoped>
.survey-verification-page {
  max-width: 1200px;
  margin: 0 auto;
}

.attendance-toggle .q-btn {
  border: 2px solid #e0e0e0;
  margin: 0 2px;
  font-weight: 500;
}

.attendance-toggle .q-btn.q-btn--active {
  border-color: #bf360c;
  box-shadow: 0 2px 8px rgba(191, 54, 12, 0.3);
}

@media (max-width: 768px) {
  .survey-verification-page {
    padding: 1rem;
  }

  .row {
    flex-direction: column;
  }

  .col-auto {
    align-self: stretch;
    margin-top: 1rem;
  }
}
</style>
