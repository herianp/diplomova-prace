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

      <!-- Recent Surveys History -->
<!--      <RecentSurveysGraph-->
<!--        :surveys="filteredRecentSurveys"-->
<!--        :current-user-uid="currentUser?.uid"-->
<!--        :is-loading="isLoading"-->
<!--        @refresh="refreshData"-->
<!--      />-->

      <!-- Charts Section — 2x2 Grid -->
      <div class="row q-col-gutter-md">
        <!-- Chart 1: Recent Surveys Voting (stacked bar) -->
        <div class="col-12 col-md-6" ref="votingContainer">
          <q-card flat bordered class="chart-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="bar_chart" size="sm" color="primary" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.votingTrends') }}</div>
              </div>
              <div class="chart-container" style="height: 250px;">
                <template v-if="hasVotingData">
                  <canvas v-if="votingVisible" ref="votingChartRef"></canvas>
                  <q-skeleton v-else type="rect" height="250px" />
                </template>
                <div v-else class="empty-chart-state">
                  <q-icon name="bar_chart" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noVotingData') }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Chart 2: Survey Types (doughnut) -->
        <div class="col-12 col-md-6" ref="typesContainer">
          <q-card flat bordered class="chart-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="donut_large" size="sm" color="deep-purple" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.surveyTypes') }}</div>
              </div>
              <div class="chart-container" style="height: 250px;">
                <template v-if="hasSurveyData">
                  <canvas v-if="typesVisible" ref="typesChartRef"></canvas>
                  <q-skeleton v-else type="rect" height="250px" />
                </template>
                <div v-else class="empty-chart-state">
                  <q-icon name="donut_large" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Chart 3: Monthly Attendance Trend (line) -->
        <div class="col-12 col-md-6" ref="trendContainer">
          <q-card flat bordered class="chart-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="show_chart" size="sm" color="teal" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.monthlyTrend') }}</div>
              </div>
              <div class="chart-container" style="height: 250px;">
                <template v-if="hasSurveyData">
                  <canvas v-if="trendVisible" ref="trendChartRef"></canvas>
                  <q-skeleton v-else type="rect" height="250px" />
                </template>
                <div v-else class="empty-chart-state">
                  <q-icon name="show_chart" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>

        <!-- Chart 4: Team Activity Timeline (bar+line combo) -->
        <div class="col-12 col-md-6" ref="activityContainer">
          <q-card flat bordered class="chart-card">
            <q-card-section>
              <div class="row items-center q-mb-md">
                <q-icon name="insights" size="sm" color="orange" class="q-mr-sm" />
                <div class="text-subtitle1 text-weight-medium">{{ $t('dashboard.activityTimeline') }}</div>
              </div>
              <div class="chart-container" style="height: 250px;">
                <template v-if="hasSurveyData">
                  <canvas v-if="activityVisible" ref="activityChartRef"></canvas>
                  <q-skeleton v-else type="rect" height="250px" />
                </template>
                <div v-else class="empty-chart-state">
                  <q-icon name="insights" size="48px" color="grey-4" />
                  <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue'
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
import { useChartLazyLoad } from '@/composables/useChartLazyLoad'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
)

const { t } = useI18n()
const log = createLogger('DashboardComponent')
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { waitForTeam } = useReadiness()
const { isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()
const { filters, createFilteredSurveys, createRecentFilteredSurveys, updateFilters } = useSurveyFilters()

// Lazy load chart sections
const { chartContainer: votingContainer, isVisible: votingVisible } = useChartLazyLoad()
const { chartContainer: typesContainer, isVisible: typesVisible } = useChartLazyLoad()
const { chartContainer: trendContainer, isVisible: trendVisible } = useChartLazyLoad()
const { chartContainer: activityContainer, isVisible: activityVisible } = useChartLazyLoad()

// Chart canvas refs
const votingChartRef = ref(null)
const typesChartRef = ref(null)
const trendChartRef = ref(null)
const activityChartRef = ref(null)

// Chart instances
let charts = {}

const isLoading = ref(false)

// Computed properties
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)

// Use the new composable for filtered surveys
const filteredSurveys = createFilteredSurveys(surveys, filters)
const filteredRecentSurveys = createRecentFilteredSurveys(surveys, 5, filters)

// Empty-state flags for charts
const hasVotingData = computed(() => filteredRecentSurveys.value.length > 0)
const hasSurveyData = computed(() => filteredSurveys.value.length > 0)

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

// ── Helper: group surveys by week or month depending on date span ──
const groupSurveysByPeriod = (surveyList) => {
  if (!surveyList.length) return {}

  const dates = surveyList.map(s => DateTime.fromISO(s.date))
  const minDate = DateTime.min(...dates)
  const maxDate = DateTime.max(...dates)
  const spanDays = maxDate.diff(minDate, 'days').days

  const grouped = {}

  if (spanDays <= 7) {
    // Group by day — label as "dd.MM" (e.g. "17.02")
    surveyList.forEach(survey => {
      const date = DateTime.fromISO(survey.date)
      const key = date.toFormat('yyyy-MM-dd')
      if (!grouped[key]) {
        grouped[key] = { surveys: [], label: date.toFormat('dd.MM') }
      }
      grouped[key].surveys.push(survey)
    })
  } else if (spanDays <= 31) {
    // Group by ISO week — label as "MMM dd" (week start)
    surveyList.forEach(survey => {
      const date = DateTime.fromISO(survey.date)
      const weekStart = date.startOf('week')
      const key = weekStart.toFormat('yyyy-MM-dd')
      if (!grouped[key]) {
        grouped[key] = { surveys: [], label: weekStart.toFormat('MMM dd') }
      }
      grouped[key].surveys.push(survey)
    })
  } else {
    // Group by month — label as "MMM"
    surveyList.forEach(survey => {
      const date = DateTime.fromISO(survey.date)
      const key = date.toFormat('yyyy-MM')
      if (!grouped[key]) {
        grouped[key] = { surveys: [], label: date.toFormat('MMM') }
      }
      grouped[key].surveys.push(survey)
    })
  }

  return grouped
}

// ── Chart 1: Recent Surveys Voting (stacked bar) ──
const createVotingChart = () => {
  if (!votingChartRef.value) return
  const ctx = votingChartRef.value.getContext('2d')
  const recentSurveys = [...filteredRecentSurveys.value]
    .sort((a, b) => a.date.localeCompare(b.date))
  if (!recentSurveys.length) return

  const totalMembers = currentTeam.value?.members?.length || 1

  const labels = recentSurveys.map(s => {
    const typeLabel = t(`survey.type.${s.type}`)
    const date = DateTime.fromISO(s.date).toFormat('dd/MM')
    return `${typeLabel} ${date}`
  })

  const yesData = recentSurveys.map(s => {
    const yes = s.votes?.filter(v => v.vote === true).length || 0
    return Math.round((yes / totalMembers) * 100)
  })
  const noData = recentSurveys.map(s => {
    const no = s.votes?.filter(v => v.vote === false).length || 0
    return Math.round((no / totalMembers) * 100)
  })
  const abstainData = recentSurveys.map(s => {
    const voted = s.votes?.length || 0
    const abstain = totalMembers - voted
    return Math.round((abstain / totalMembers) * 100)
  })

  if (charts.voting) charts.voting.destroy()

  charts.voting = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: t('common.yes'),
          data: yesData,
          backgroundColor: 'rgba(76, 175, 80, 0.8)',
          borderColor: 'rgba(76, 175, 80, 1)',
          borderWidth: 1
        },
        {
          label: t('common.no'),
          data: noData,
          backgroundColor: 'rgba(244, 67, 54, 0.8)',
          borderColor: 'rgba(244, 67, 54, 1)',
          borderWidth: 1
        },
        {
          label: t('dashboard.didNotVote'),
          data: abstainData,
          backgroundColor: 'rgba(158, 158, 158, 0.8)',
          borderColor: 'rgba(158, 158, 158, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { stacked: true },
        y: {
          stacked: true,
          beginAtZero: true,
          max: 100,
          ticks: { callback: (v) => v + '%' }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}%`
          }
        }
      }
    }
  })
}

// ── Chart 2: Survey Types (doughnut) ──
const createTypesChart = () => {
  if (!typesChartRef.value) return
  const ctx = typesChartRef.value.getContext('2d')
  const allSurveys = filteredSurveys.value
  if (!allSurveys.length) return

  const typeColors = {
    training: 'rgba(33, 150, 243, 0.8)',
    match: 'rgba(76, 175, 80, 0.8)',
    'friendly-match': 'rgba(255, 152, 0, 0.8)'
  }

  const counts = {}
  allSurveys.forEach(s => {
    const type = s.type || 'other'
    counts[type] = (counts[type] || 0) + 1
  })

  const labels = Object.keys(counts).map(type => t(`survey.type.${type}`) || type)
  const data = Object.values(counts)
  const colors = Object.keys(counts).map(type => typeColors[type] || 'rgba(156, 39, 176, 0.8)')

  if (charts.types) charts.types.destroy()

  charts.types = new ChartJS(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '60%',
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  })
}

// ── Chart 3: Monthly Attendance Trend (line) ──
const createTrendChart = () => {
  if (!trendChartRef.value) return
  const ctx = trendChartRef.value.getContext('2d')
  const allSurveys = filteredSurveys.value
  if (!allSurveys.length) return

  const monthly = groupSurveysByPeriod(allSurveys)
  const sortedKeys = Object.keys(monthly).sort()
  const totalMembers = currentTeam.value?.members?.length || 1

  const labels = sortedKeys.map(k => monthly[k].label)
  const attendanceData = sortedKeys.map(key => {
    const surveys = monthly[key].surveys
    let totalYes = 0
    surveys.forEach(s => {
      totalYes += s.votes?.filter(v => v.vote === true).length || 0
    })
    const totalPossible = surveys.length * totalMembers
    return totalPossible > 0 ? Math.round((totalYes / totalPossible) * 100) : 0
  })

  if (charts.trend) charts.trend.destroy()

  charts.trend = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: t('dashboard.attendanceRate'),
        data: attendanceData,
        borderColor: 'rgba(0, 150, 136, 1)',
        backgroundColor: 'rgba(0, 150, 136, 0.15)',
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: 'rgba(0, 150, 136, 1)',
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: (v) => v + '%' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${t('dashboard.attendanceRate')}: ${ctx.formattedValue}%`
          }
        }
      }
    }
  })
}

// ── Chart 4: Team Activity Timeline (bar + line combo) ──
const createActivityChart = () => {
  if (!activityChartRef.value) return
  const ctx = activityChartRef.value.getContext('2d')
  const allSurveys = filteredSurveys.value
  if (!allSurveys.length) return

  const monthly = groupSurveysByPeriod(allSurveys)
  const sortedKeys = Object.keys(monthly).sort()
  const totalMembers = currentTeam.value?.members?.length || 1

  const labels = sortedKeys.map(k => monthly[k].label)
  const surveyCountData = sortedKeys.map(k => monthly[k].surveys.length)
  const attendanceRateData = sortedKeys.map(key => {
    const surveys = monthly[key].surveys
    let totalYes = 0
    surveys.forEach(s => {
      totalYes += s.votes?.filter(v => v.vote === true).length || 0
    })
    const totalPossible = surveys.length * totalMembers
    return totalPossible > 0 ? Math.round((totalYes / totalPossible) * 100) : 0
  })

  if (charts.activity) charts.activity.destroy()

  charts.activity = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          type: 'bar',
          label: t('dashboard.surveyCount'),
          data: surveyCountData,
          backgroundColor: 'rgba(33, 150, 243, 0.6)',
          borderColor: 'rgba(33, 150, 243, 1)',
          borderWidth: 1,
          yAxisID: 'y',
          order: 2
        },
        {
          type: 'line',
          label: t('dashboard.attendanceRate'),
          data: attendanceRateData,
          borderColor: 'rgba(76, 175, 80, 1)',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: 'rgba(76, 175, 80, 1)',
          tension: 0.4,
          fill: false,
          yAxisID: 'y1',
          order: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          position: 'left',
          title: { display: true, text: t('dashboard.surveyCount') },
          ticks: { stepSize: 1 }
        },
        y1: {
          beginAtZero: true,
          max: 100,
          position: 'right',
          title: { display: true, text: t('dashboard.attendanceRate') },
          ticks: { callback: (v) => v + '%' },
          grid: { drawOnChartArea: false }
        }
      },
      plugins: {
        legend: { display: true, position: 'top' },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.yAxisID === 'y1') {
                return `${ctx.dataset.label}: ${ctx.formattedValue}%`
              }
              return `${ctx.dataset.label}: ${ctx.formattedValue}`
            }
          }
        }
      }
    }
  })
}

// ── Create / Destroy all ──
const createAllCharts = async () => {
  await nextTick()
  await nextTick()
  if (votingVisible.value) createVotingChart()
  if (typesVisible.value) createTypesChart()
  if (trendVisible.value) createTrendChart()
  if (activityVisible.value) createActivityChart()
}

const destroyAllCharts = () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy()
  })
  charts = {}
}

// Watch visibility — create chart when it enters viewport
watch(votingVisible, async (visible) => {
  if (visible && filteredRecentSurveys.value.length > 0) {
    await nextTick()
    createVotingChart()
  }
})
watch(typesVisible, async (visible) => {
  if (visible && filteredSurveys.value.length > 0) {
    await nextTick()
    createTypesChart()
  }
})
watch(trendVisible, async (visible) => {
  if (visible && filteredSurveys.value.length > 0) {
    await nextTick()
    createTrendChart()
  }
})
watch(activityVisible, async (visible) => {
  if (visible && filteredSurveys.value.length > 0) {
    await nextTick()
    createActivityChart()
  }
})

// Watch for data changes — re-create all visible charts
watch([filteredSurveys, filteredRecentSurveys], () => {
  if (filteredSurveys.value.length > 0) {
    createAllCharts()
  }
}, { deep: true })

onMounted(async () => {
  await waitForTeam()
  refreshData()
})

onUnmounted(() => {
  destroyAllCharts()
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

.chart-card {
  background: white;
  transition: box-shadow 0.2s ease;
}

.chart-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-container {
  position: relative;
}

.empty-chart-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
