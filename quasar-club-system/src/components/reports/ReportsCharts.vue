<template>
  <!-- Loading State -->
  <div v-if="loading" class="loading-container text-center q-pa-xl">
    <q-spinner-dots size="50px" color="primary" />
    <div class="text-h6 q-mt-md text-grey-6">{{ $t('reports.loading') }}</div>
  </div>

  <!-- Charts -->
  <div v-else class="charts-grid">
    <div class="row q-col-gutter-md">
      <!-- Chart 1: Attendance Trend (line with smart grouping) -->
      <div class="col-12" ref="trendContainer">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="show_chart" size="sm" color="teal" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.monthlyTrend') }}</div>
            </div>
            <div class="chart-container" style="height: 300px;">
              <template v-if="hasSurveyData">
                <canvas v-if="trendVisible" ref="monthlyTrendChart"></canvas>
                <q-skeleton v-else type="rect" height="300px" />
              </template>
              <div v-else class="empty-chart-state">
                <q-icon name="show_chart" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 2: Survey Participation (stacked bar, last 10) -->
      <div class="col-12" ref="participationContainer">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="bar_chart" size="sm" color="primary" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.surveyParticipation') }}</div>
            </div>
            <div class="chart-container" style="height: 300px;">
              <template v-if="hasSurveyData">
                <canvas v-if="participationVisible" ref="participationChart"></canvas>
                <q-skeleton v-else type="rect" height="300px" />
              </template>
              <div v-else class="empty-chart-state">
                <q-icon name="bar_chart" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noVotingData') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 3: Player Attendance Ranking (horizontal bar) -->
      <div class="col-12" ref="rankingContainer">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="leaderboard" size="sm" color="amber-8" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.playerRanking') }}</div>
            </div>
            <div class="chart-container" :style="{ height: rankingChartHeight }">
              <template v-if="hasSurveyData">
                <canvas v-if="rankingVisible" ref="playerRankingChart"></canvas>
                <q-skeleton v-else type="rect" :height="rankingChartHeight" />
              </template>
              <div v-else class="empty-chart-state" style="height: 300px;">
                <q-icon name="leaderboard" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Chart 4: Survey Types (doughnut) -->
      <div class="col-12 col-md-6" ref="typesContainer">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="donut_large" size="sm" color="deep-purple" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.surveyTypes') }}</div>
            </div>
            <div class="chart-container" style="height: 300px;">
              <template v-if="hasSurveyData">
                <canvas v-if="typesVisible" ref="surveyTypesChart"></canvas>
                <q-skeleton v-else type="rect" height="300px" />
              </template>
              <div v-else class="empty-chart-state">
                <q-icon name="donut_large" size="48px" color="grey-4" />
                <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('dashboard.noSurveys') }}</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { useChartLazyLoad } from '@/composables/useChartLazyLoad'
import { getSurveyDisplayTitle } from '@/utils/surveyStatusUtils'
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

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  filteredSurveys: {
    type: Array,
    required: true
  },
  currentTeam: {
    type: Object,
    default: null
  },
  teamMembers: {
    type: Array,
    required: true
  },
  selectedPlayer: {
    type: String,
    default: null
  }
})

const { t } = useI18n()

// Lazy load instances
const { chartContainer: trendContainer, isVisible: trendVisible } = useChartLazyLoad()
const { chartContainer: participationContainer, isVisible: participationVisible } = useChartLazyLoad()
const { chartContainer: rankingContainer, isVisible: rankingVisible } = useChartLazyLoad()
const { chartContainer: typesContainer, isVisible: typesVisible } = useChartLazyLoad()

// Chart canvas refs
const monthlyTrendChart = ref(null)
const participationChart = ref(null)
const playerRankingChart = ref(null)
const surveyTypesChart = ref(null)

// Chart instances
let charts = {}

// Empty state flag
const hasSurveyData = computed(() => props.filteredSurveys.length > 0)

// Dynamic height for ranking chart
const rankingChartHeight = computed(() => {
  const memberCount = props.currentTeam?.members?.length || 0
  const height = Math.max(300, memberCount * 35)
  return height + 'px'
})

// ── Helper: group surveys by day/week/month depending on date span ──
const groupSurveysByPeriod = (surveyList) => {
  if (!surveyList.length) return {}

  const dates = surveyList.map(s => DateTime.fromISO(s.date))
  const minDate = DateTime.min(...dates)
  const maxDate = DateTime.max(...dates)
  const spanDays = maxDate.diff(minDate, 'days').days

  const grouped = {}

  if (spanDays <= 7) {
    surveyList.forEach(survey => {
      const date = DateTime.fromISO(survey.date)
      const key = date.toFormat('yyyy-MM-dd')
      if (!grouped[key]) {
        grouped[key] = { surveys: [], label: date.toFormat('dd.MM') }
      }
      grouped[key].surveys.push(survey)
    })
  } else if (spanDays <= 31) {
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

// ── Chart 1: Attendance Trend (line with smart grouping) ──
const createMonthlyTrendChart = () => {
  if (!monthlyTrendChart.value) return
  const ctx = monthlyTrendChart.value.getContext('2d')
  if (!props.filteredSurveys.length) return

  const grouped = groupSurveysByPeriod(props.filteredSurveys)
  const sortedKeys = Object.keys(grouped).sort()
  const totalMembers = props.currentTeam?.members?.length || 1

  const labels = sortedKeys.map(k => grouped[k].label)
  const attendanceData = sortedKeys.map(key => {
    const surveys = grouped[key].surveys

    if (props.selectedPlayer) {
      let yesCount = 0
      surveys.forEach(survey => {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        if (playerVote && playerVote.vote === true) yesCount++
      })
      return surveys.length > 0 ? Math.round((yesCount / surveys.length) * 100) : 0
    } else {
      let totalYes = 0
      surveys.forEach(survey => {
        totalYes += survey.votes?.filter(v => v.vote === true).length || 0
      })
      const totalPossible = surveys.length * totalMembers
      return totalPossible > 0 ? Math.round((totalYes / totalPossible) * 100) : 0
    }
  })

  if (charts.trend) charts.trend.destroy()

  charts.trend = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: t('reports.attendanceRate'),
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
            label: (ctx) => `${t('reports.attendanceRate')}: ${ctx.formattedValue}%`
          }
        }
      }
    }
  })
}

// ── Chart 2: Survey Participation (stacked bar, last 10) ──
const createParticipationChart = () => {
  if (!participationChart.value) return
  const ctx = participationChart.value.getContext('2d')

  const sortedSurveys = [...props.filteredSurveys]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10)

  if (!sortedSurveys.length) return

  const totalMembers = props.currentTeam?.members?.length || 1

  const labels = sortedSurveys.map(survey => {
    const typeLabel = getSurveyDisplayTitle(survey, t)
    const date = DateTime.fromISO(survey.date).toFormat('dd/MM')
    return `${typeLabel} ${date}`
  })

  const surveyTitles = sortedSurveys.map(survey => getSurveyDisplayTitle(survey, t))

  const yesData = sortedSurveys.map(survey => {
    if (props.selectedPlayer) {
      const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
      return (playerVote && playerVote.vote === true) ? 100 : 0
    } else {
      const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
      return Math.round((yesVotes / totalMembers) * 100)
    }
  })

  const noData = sortedSurveys.map(survey => {
    if (props.selectedPlayer) {
      const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
      return (playerVote && playerVote.vote === false) ? 100 : 0
    } else {
      const noVotes = survey.votes?.filter(vote => vote.vote === false).length || 0
      return Math.round((noVotes / totalMembers) * 100)
    }
  })

  const unvotedData = sortedSurveys.map(survey => {
    if (props.selectedPlayer) {
      const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
      return playerVote ? 0 : 100
    } else {
      const totalVotes = survey.votes?.length || 0
      const unvoted = totalMembers - totalVotes
      return Math.round((unvoted / totalMembers) * 100)
    }
  })

  if (charts.participation) charts.participation.destroy()

  charts.participation = new ChartJS(ctx, {
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
          label: t('reports.unvoted'),
          data: unvotedData,
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
            title: (context) => {
              const index = context[0].dataIndex
              return surveyTitles[index] || context[0].label
            },
            label: (ctx) => `${ctx.dataset.label}: ${ctx.formattedValue}%`
          }
        }
      }
    }
  })
}

// ── Chart 3: Player Attendance Ranking (horizontal bar) ──
const createPlayerRankingChart = () => {
  if (!playerRankingChart.value) return
  const ctx = playerRankingChart.value.getContext('2d')
  if (!props.filteredSurveys.length) return

  const totalSurveys = props.filteredSurveys.length

  const memberRates = props.currentTeam?.members?.map(memberId => {
    const member = props.teamMembers.find(m => m.uid === memberId)
    const displayName = member?.displayName || member?.email || `Member ${memberId.substring(0, 6)}...`

    let yesCount = 0
    props.filteredSurveys.forEach(survey => {
      const vote = survey.votes?.find(v => v.userUid === memberId)
      if (vote && vote.vote === true) yesCount++
    })

    const rate = totalSurveys > 0 ? Math.round((yesCount / totalSurveys) * 100) : 0
    return { id: memberId, displayName, rate }
  }) || []

  memberRates.sort((a, b) => b.rate - a.rate)

  const labels = memberRates.map(m => m.displayName)
  const data = memberRates.map(m => m.rate)

  const backgroundColors = memberRates.map(m =>
    m.id === props.selectedPlayer
      ? 'rgba(25, 118, 210, 0.8)'
      : 'rgba(76, 175, 80, 0.7)'
  )
  const borderColors = memberRates.map(m =>
    m.id === props.selectedPlayer
      ? 'rgba(25, 118, 210, 1)'
      : 'rgba(76, 175, 80, 1)'
  )

  if (charts.ranking) charts.ranking.destroy()

  charts.ranking = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: t('reports.attendanceRate'),
        data,
        backgroundColor: backgroundColors,
        borderColor: borderColors,
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          ticks: { callback: (v) => v + '%' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${t('reports.attendanceRate')}: ${ctx.formattedValue}%`
          }
        }
      }
    }
  })
}

// ── Chart 4: Survey Types (doughnut) ──
const createSurveyTypesChart = () => {
  if (!surveyTypesChart.value) return
  const ctx = surveyTypesChart.value.getContext('2d')
  if (!props.filteredSurveys.length) return

  const surveysToUse = props.selectedPlayer
    ? props.filteredSurveys.filter(survey => {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return playerVote && playerVote.vote === true
      })
    : props.filteredSurveys

  const typeColors = {
    training: 'rgba(33, 150, 243, 0.8)',
    match: 'rgba(76, 175, 80, 0.8)',
    'friendly-match': 'rgba(255, 152, 0, 0.8)'
  }

  const counts = {}
  surveysToUse.forEach(s => {
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

// ── Create / Destroy all ──
const createAllCharts = async () => {
  await nextTick()
  await nextTick()
  if (trendVisible.value) createMonthlyTrendChart()
  if (participationVisible.value) createParticipationChart()
  if (rankingVisible.value) createPlayerRankingChart()
  if (typesVisible.value) createSurveyTypesChart()
}

const destroyAllCharts = () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy()
  })
  charts = {}
}

// Watch visibility — create chart when it enters viewport
watch(trendVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0) {
    await nextTick()
    createMonthlyTrendChart()
  }
})

watch(participationVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0) {
    await nextTick()
    createParticipationChart()
  }
})

watch(rankingVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    await nextTick()
    createPlayerRankingChart()
  }
})

watch(typesVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0) {
    await nextTick()
    createSurveyTypesChart()
  }
})

// Watch loading state
watch(() => props.loading, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading) {
    nextTick(() => {
      if (props.filteredSurveys.length > 0) {
        createAllCharts()
      }
    })
  }
})

// Watch for data changes
watch([() => props.filteredSurveys, () => props.selectedPlayer], () => {
  if (!props.loading && props.filteredSurveys.length > 0) {
    createAllCharts()
  }
}, { deep: true })

onMounted(() => {
  if (!props.loading && props.filteredSurveys.length > 0) {
    nextTick(() => {
      createAllCharts()
    })
  }
})

onUnmounted(() => {
  destroyAllCharts()
})
</script>

<style scoped>
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

.loading-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 768px) {
  .chart-container {
    height: 250px !important;
  }
}
</style>
