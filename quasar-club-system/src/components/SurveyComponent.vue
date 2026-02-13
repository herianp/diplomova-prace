<template>
  <div class="survey-container">
    <!-- Loading Skeleton -->
    <template v-if="!currentTeam">
      <div class="q-mb-md">
        <q-skeleton type="text" width="50%" class="q-mb-xs" />
        <q-skeleton type="text" width="30%" />
      </div>
      <div class="row q-col-gutter-sm q-mb-lg">
        <div v-for="n in 4" :key="n" class="col-6 col-md-3">
          <q-card flat bordered class="q-pa-md">
            <q-skeleton type="text" width="60%" class="q-mb-sm" />
            <q-skeleton type="rect" height="32px" />
          </q-card>
        </div>
      </div>
      <q-card flat bordered class="q-pa-md">
        <q-skeleton type="rect" height="200px" />
      </q-card>
    </template>

    <template v-else>
      <!-- Header Section -->
      <div class="welcome-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ currentTeam?.name }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ $t('survey.pageSubtitle') }}
            </div>
          </div>
          <div class="row items-center q-gutter-sm">
            <q-chip
              :color="isCurrentUserPowerUser ? 'positive' : 'grey-4'"
              :text-color="isCurrentUserPowerUser ? 'white' : 'grey-8'"
              :icon="isCurrentUserPowerUser ? 'shield' : 'person'"
              :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
              dense
            />
            <q-chip
              color="primary"
              text-color="white"
              icon="poll"
              :label="filteredSurveys.length + ' ' + $t('dashboard.surveys')"
              dense
            />
          </div>
        </div>
      </div>

      <!-- Filter Menu -->
      <div class="q-mb-lg">
        <SurveyFilterMenu
          v-model="filters"
          @filters-changed="onFiltersChanged"
        />
      </div>

      <!-- Action Buttons -->
      <div class="row items-center q-gutter-sm q-mb-md">
        <q-btn
          flat
          dense
          :icon="showMetrics ? 'expand_less' : 'bar_chart'"
          :label="$t('survey.metrics.toggle')"
          color="primary"
          size="sm"
          @click="showMetrics = !showMetrics"
        />
        <q-btn
          v-if="isCurrentUserPowerUser"
          flat
          dense
          icon="add_circle"
          :label="$t('survey.create')"
          color="positive"
          size="sm"
          @click="showCreateDialog = true"
        />
      </div>

      <!-- Create Survey Dialog -->
      <q-dialog v-model="showCreateDialog">
        <q-card style="min-width: 350px; max-width: 500px; width: 100%;">
          <q-card-section class="row items-center q-pb-none">
            <div class="text-h6">{{ $t('survey.create') }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section class="q-pt-sm">
            <div class="text-body2 text-grey-7 q-mb-md">
              {{ $t('survey.createMenu.description') }}
            </div>
            <SurveyForm
              @submit="onCreateSubmit"
              @cancel="showCreateDialog = false"
            />
          </q-card-section>
        </q-card>
      </q-dialog>

      <!-- Metric Cards -->
      <div v-show="showMetrics" class="row q-col-gutter-sm q-mb-lg items-stretch">
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('survey.metrics.total')"
            :value="teamMetrics.totalSurveys"
            icon="poll"
            color="primary"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('survey.metrics.active')"
            :value="teamMetrics.activeSurveys"
            icon="schedule"
            color="positive"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('survey.metrics.myParticipation')"
            :value="personalMetrics.personalParticipationRate + '%'"
            icon="how_to_vote"
            color="accent"
          />
        </div>
        <div class="col-6 col-md-3">
          <MetricCard
            :title="$t('survey.metrics.teamParticipation')"
            :value="teamMetrics.averageParticipation + '%'"
            icon="groups"
            color="info"
          />
        </div>
      </div>

      <!-- Survey List -->
      <div v-if="filteredSurveys.length" class="row wrap q-col-gutter-lg justify-start">
        <div
          v-for="survey in filteredSurveys"
          :key="survey.id"
          class="col-12"
        >
          <SurveyCard :survey="survey" :team-member-count="teamMemberCount" />
        </div>
      </div>

      <!-- Empty State -->
      <q-card v-else flat bordered class="q-pa-xl text-center">
        <q-icon name="inbox" size="3rem" color="grey-5" />
        <div class="text-h6 text-grey-6 q-mt-md">{{ $t('survey.emptyState') }}</div>
        <div class="text-body2 text-grey-5">{{ $t('survey.emptyStateHint') }}</div>
      </q-card>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { DateTime } from 'luxon'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useReadiness } from '@/composable/useReadiness'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { useSurveyMetrics } from '@/composable/useSurveyMetrics'
import { useDateHelpers } from '@/composable/useDateHelpers'
import { useI18n } from 'vue-i18n'
import MetricCard from '@/components/dashboard/MetricCard.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import SurveyForm from '@/components/modal/SurveyForm.vue'
import SurveyCard from '@/components/new/SurveyCard.vue'

const teamStore = useTeamStore()
const { waitForTeam } = useReadiness()
const { isCurrentUserPowerUser, currentUser } = useAuthComposable()
const { setSurveysListener, addSurvey } = useSurveyUseCases()
const { filters, createFilteredSurveys, updateFilters } = useSurveyFilters()
const i18n = useI18n()
const { getDateByDateAndTime } = useDateHelpers(i18n.locale.value)

const showMetrics = ref(false)
const showCreateDialog = ref(false)

// Default to "this week" for survey page
filters.value.dateFrom = DateTime.now().startOf('week').toISODate()
filters.value.dateTo = DateTime.now().endOf('week').toISODate()

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)
const teamMemberCount = computed(() => currentTeam.value?.members?.length || 0)

// Filtered surveys using the shared composable
const filteredSurveys = createFilteredSurveys(surveys, filters)

// Metrics
const { createMetricsComputeds } = useSurveyMetrics()
const { teamMetrics, personalMetrics } = createMetricsComputeds(
  filteredSurveys,
  computed(() => currentUser.value?.uid),
  teamMemberCount
)

// Methods
const onFiltersChanged = (newFilters) => {
  updateFilters(newFilters)
}

async function onCreateSubmit(payload) {
  await handleSurveySubmit(payload)
  showCreateDialog.value = false
}

async function handleSurveySubmit(payload) {
  try {
    await addSurvey({
      title: payload.title,
      description: payload.description,
      date: payload.date,
      time: payload.time,
      dateTime: getDateByDateAndTime(payload.date, payload.time),
      teamId: currentTeam.value?.id,
      type: payload.surveyType,
    })
  } catch (err) {
    console.error('Error creating survey:', err)
    throw err
  }
}

onMounted(async () => {
  await waitForTeam()
  if (teamStore.currentTeam?.id) {
    setSurveysListener(teamStore.currentTeam.id)
  }
})
</script>

<style scoped>
.survey-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .survey-container {
    padding: 1.5rem;
  }
}
</style>
