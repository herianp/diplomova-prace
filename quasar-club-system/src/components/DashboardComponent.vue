<template>
  <div class="dashboard-container">
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
      <!-- Welcome Header -->
      <div class="welcome-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ currentTeam?.name || $t('dashboard.noTeamSelected') }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ $t('dashboard.teamOverview') }}
            </div>
          </div>
          <q-chip
            :color="isCurrentUserPowerUser ? 'positive' : 'grey-4'"
            :text-color="isCurrentUserPowerUser ? 'white' : 'grey-8'"
            :icon="isCurrentUserPowerUser ? 'shield' : 'person'"
            :label="isCurrentUserPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
            dense
          />
        </div>
      </div>

      <!-- Survey Filters -->
      <div class="q-mb-lg">
        <SurveyFilterMenu
          v-model="filters"
          @filters-changed="onFiltersChanged"
        />
      </div>

      <!-- Metrics Cards -->
      <DashboardMetrics :filtered-surveys="filteredSurveys" />

      <!-- Next Event Widgets -->
      <div class="row q-col-gutter-md">
        <!-- Next Training -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="widget-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="fitness_center" size="sm" color="primary" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.nextTraining') }}</div>
              </div>
              <template v-if="nextTraining">
                <div class="event-widget">
                  <div class="event-date-block bg-primary text-white">
                    <div class="text-h4 text-weight-bold">{{ formatDay(nextTraining.date) }}</div>
                    <div class="text-caption">{{ formatMonthYear(nextTraining.date) }}</div>
                  </div>
                  <div class="event-details">
                    <div class="text-body1 text-weight-medium">
                      {{ $t('survey.type.training') }}
                    </div>
                    <div class="text-body2 text-grey-7">
                      <q-icon name="schedule" size="xs" class="q-mr-xs" />
                      {{ nextTraining.time }}
                    </div>
                    <div v-if="nextTraining.description" class="text-body2 text-grey-6 q-mt-xs ellipsis-2-lines">
                      {{ nextTraining.description }}
                    </div>
                    <div class="q-mt-sm">
                      <q-badge :color="getVoteColor(nextTraining)" class="q-mr-xs">
                        {{ getVoteLabel(nextTraining) }}
                      </q-badge>
                      <q-badge color="grey-4" text-color="grey-8">
                        {{ getVoteSummary(nextTraining) }}
                      </q-badge>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="empty-widget-state">
                <q-icon name="fitness_center" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noUpcomingTraining') }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Next Match -->
        <div class="col-12 col-md-6">
          <q-card flat bordered class="widget-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="sports_soccer" size="sm" color="positive" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.nextMatch') }}</div>
              </div>
              <template v-if="nextMatch">
                <div class="event-widget">
                  <div class="event-date-block bg-positive text-white">
                    <div class="text-h4 text-weight-bold">{{ formatDay(nextMatch.date) }}</div>
                    <div class="text-caption">{{ formatMonthYear(nextMatch.date) }}</div>
                  </div>
                  <div class="event-details">
                    <div class="text-body1 text-weight-medium">
                      {{ getSurveyDisplayTitle(nextMatch, t) }}
                    </div>
                    <div class="text-body2 text-grey-7">
                      <q-icon name="schedule" size="xs" class="q-mr-xs" />
                      {{ nextMatch.time }}
                    </div>
                    <div v-if="nextMatch.description" class="text-body2 text-grey-6 q-mt-xs ellipsis-2-lines">
                      {{ nextMatch.description }}
                    </div>
                    <div class="q-mt-sm">
                      <q-badge :color="getVoteColor(nextMatch)" class="q-mr-xs">
                        {{ getVoteLabel(nextMatch) }}
                      </q-badge>
                      <q-badge color="grey-4" text-color="grey-8">
                        {{ getVoteSummary(nextMatch) }}
                      </q-badge>
                    </div>
                  </div>
                </div>
              </template>
              <div v-else class="empty-widget-state">
                <q-icon name="sports_soccer" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noUpcomingMatch') }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useReadiness } from '@/composable/useReadiness'
import DashboardMetrics from '@/components/dashboard/DashboardMetrics.vue'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { useAuthStore } from '@/stores/authStore.js'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { createLogger } from 'src/utils/logger'
import { getSurveyDisplayTitle } from '@/utils/surveyStatusUtils'

const { t } = useI18n()
const log = createLogger('DashboardComponent')
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { waitForTeam } = useReadiness()
const { isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()
const { filters, createFilteredSurveys, updateFilters } = useSurveyFilters()

const isLoading = ref(false)

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)
const currentUserUid = computed(() => authStore.user?.uid)

// Filtered surveys for metrics
const filteredSurveys = createFilteredSurveys(surveys, filters)

// Today's date string for comparisons
const today = computed(() => DateTime.now().toFormat('yyyy-MM-dd'))

// Next training: nearest future survey with type 'training'
const nextTraining = computed(() => {
  if (!surveys.value?.length) return null
  return surveys.value
    .filter(s => s.type === 'training' && s.date >= today.value)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))[0] || null
})

// Next match: nearest future survey with type 'match' or 'friendly-match'
const nextMatch = computed(() => {
  if (!surveys.value?.length) return null
  return surveys.value
    .filter(s => (s.type === 'match' || s.type === 'friendly-match') && s.date >= today.value)
    .sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || ''))[0] || null
})

// Date formatting helpers
const formatDay = (dateStr) => DateTime.fromISO(dateStr).toFormat('dd')
const formatMonthYear = (dateStr) => DateTime.fromISO(dateStr).toFormat('MMM yyyy')

// Vote helpers
const getVoteColor = (survey) => {
  if (!currentUserUid.value) return 'grey'
  const vote = survey.votes?.find(v => v.userUid === currentUserUid.value)
  if (!vote) return 'grey'
  return vote.vote === true ? 'positive' : 'negative'
}

const getVoteLabel = (survey) => {
  if (!currentUserUid.value) return t('dashboard.notVotedYet')
  const vote = survey.votes?.find(v => v.userUid === currentUserUid.value)
  if (!vote) return t('dashboard.notVotedYet')
  return vote.vote === true ? t('dashboard.yesVotes') : t('dashboard.noVotes')
}

const getVoteSummary = (survey) => {
  const totalMembers = currentTeam.value?.members?.length || 0
  const yesCount = survey.votes?.filter(v => v.vote === true).length || 0
  return `${yesCount}/${totalMembers}`
}

// Methods
const onFiltersChanged = (newFilters) => {
  updateFilters(newFilters)
}

const refreshData = async () => {
  isLoading.value = true
  try {
    if (currentTeam.value?.id && authStore.user?.uid) {
      setSurveysListener(currentTeam.value.id)
    }
  } catch (error) {
    log.error('Failed to refresh dashboard data', {
      error: error instanceof Error ? error.message : String(error),
      teamId: currentTeam.value?.id
    })
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await waitForTeam()
  refreshData()
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .dashboard-container {
    padding: 1.5rem;
  }
}

.widget-card {
  background: white;
  transition: box-shadow 0.2s ease;
}

.widget-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.event-widget {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.event-date-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 72px;
  padding: 0.75rem;
  border-radius: 8px;
  flex-shrink: 0;
}

.event-details {
  flex: 1;
  min-width: 0;
}

.empty-widget-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.ellipsis-2-lines {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
