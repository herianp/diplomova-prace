<template>
  <!-- Loading State -->
  <div v-if="loading" class="loading-container text-center q-pa-xl">
    <q-spinner-dots size="50px" color="primary" />
    <div class="text-h6 q-mt-md text-grey-6">{{ $t('reports.loading') }}</div>
  </div>

  <!-- Charts Grid -->
  <div v-else class="charts-grid">
    <div class="row q-gutter-lg">
      <!-- Survey Participation Chart (full width) -->
      <div class="col-12" ref="participationContainer">
        <q-card flat bordered class="chart-card q-mb-lg">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="bar_chart" size="sm" color="primary" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.surveyParticipation') }}</div>
            </div>
            <div class="chart-container" style="height: 400px;">
              <canvas v-if="participationVisible" ref="participationChart"></canvas>
              <q-skeleton v-else type="rect" height="400px" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Survey Types Distribution (half) -->
      <div class="col-12 col-md-6" ref="typesContainer">
        <q-card flat bordered class="chart-card q-mb-lg">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="donut_large" size="sm" color="deep-purple" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.surveyTypes') }}</div>
            </div>
            <div class="chart-container" style="height: 300px;">
              <canvas v-if="typesVisible" ref="surveyTypesChart"></canvas>
              <q-skeleton v-else type="rect" height="300px" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Monthly Attendance Trend (half) -->
      <div class="col-12 col-md-6" ref="trendContainer">
        <q-card flat bordered class="chart-card q-mb-lg">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="show_chart" size="sm" color="teal" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.monthlyTrend') }}</div>
            </div>
            <div class="chart-container" style="height: 300px;">
              <canvas v-if="trendVisible" ref="monthlyTrendChart"></canvas>
              <q-skeleton v-else type="rect" height="300px" />
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Player Attendance Ranking (full width) -->
      <div class="col-12" ref="rankingContainer">
        <q-card flat bordered class="chart-card q-mb-lg">
          <q-card-section>
            <div class="row items-center q-mb-md">
              <q-icon name="leaderboard" size="sm" color="amber-8" class="q-mr-sm" />
              <div class="text-subtitle1 text-weight-medium">{{ $t('reports.playerRanking') }}</div>
            </div>
            <div class="chart-container" :style="{ height: rankingChartHeight }">
              <canvas v-if="rankingVisible" ref="playerRankingChart"></canvas>
              <q-skeleton v-else type="rect" :height="rankingChartHeight" />
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

// Register Chart.js components
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

// Lazy load instances for each chart
const { chartContainer: participationContainer, isVisible: participationVisible } = useChartLazyLoad()
const { chartContainer: typesContainer, isVisible: typesVisible } = useChartLazyLoad()
const { chartContainer: trendContainer, isVisible: trendVisible } = useChartLazyLoad()
const { chartContainer: rankingContainer, isVisible: rankingVisible } = useChartLazyLoad()

// Chart refs
const participationChart = ref(null)
const surveyTypesChart = ref(null)
const monthlyTrendChart = ref(null)
const playerRankingChart = ref(null)

// Chart instances
let charts = {}

// Dynamic height for ranking chart
const rankingChartHeight = computed(() => {
  const memberCount = props.currentTeam?.members?.length || 0
  const height = Math.max(300, memberCount * 35)
  return height + 'px'
})

const createParticipationChart = () => {
  if (!participationChart.value) return

  const ctx = participationChart.value.getContext('2d')

  const sortedSurveys = [...props.filteredSurveys]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10)

  let labels, yesData, noData, unvotedData, surveyTitles

  if (sortedSurveys.length === 0) {
    labels = ['Jan 01', 'Jan 02', 'Jan 03']
    yesData = [40, 60, 30]
    noData = [35, 25, 40]
    unvotedData = [25, 15, 30]
    surveyTitles = ['Sample Survey 1', 'Sample Survey 2', 'Sample Survey 3']
  } else {
    labels = sortedSurveys.map(survey => {
      const date = DateTime.fromISO(survey.date)
      return date.toFormat('MMM dd')
    })

    surveyTitles = sortedSurveys.map(survey => survey.title)

    const totalMembers = props.currentTeam?.members?.length || 1

    yesData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return (playerVote && playerVote.vote === true) ? 100 : 0
      } else {
        const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
        return Math.round((yesVotes / totalMembers) * 100)
      }
    })

    noData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return (playerVote && playerVote.vote === false) ? 100 : 0
      } else {
        const noVotes = survey.votes?.filter(vote => vote.vote === false).length || 0
        return Math.round((noVotes / totalMembers) * 100)
      }
    })

    unvotedData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return playerVote ? 0 : 100
      } else {
        const totalVotes = survey.votes?.length || 0
        const unvoted = totalMembers - totalVotes
        return Math.round((unvoted / totalMembers) * 100)
      }
    })
  }

  if (charts.participation) {
    charts.participation.destroy()
  }

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
          ticks: {
            callback: (value) => value + '%'
          }
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
            label: (context) => `${context.dataset.label}: ${context.formattedValue}%`
          }
        }
      }
    }
  })
}

const createSurveyTypesChart = () => {
  if (!surveyTypesChart.value) return

  const ctx = surveyTypesChart.value.getContext('2d')

  // When player selected, only show types where player voted yes
  const surveysToUse = props.selectedPlayer
    ? props.filteredSurveys.filter(survey => {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return playerVote && playerVote.vote === true
      })
    : props.filteredSurveys

  const typesCounts = {}
  surveysToUse.forEach(survey => {
    const type = survey.type || 'other'
    typesCounts[type] = (typesCounts[type] || 0) + 1
  })

  const labels = Object.keys(typesCounts).map(type => t(`survey.type.${type.toLowerCase()}`) || type)
  const data = Object.values(typesCounts)
  const colors = [
    'rgba(25, 118, 210, 0.8)',
    'rgba(76, 175, 80, 0.8)',
    'rgba(255, 193, 7, 0.8)',
    'rgba(156, 39, 176, 0.8)',
    'rgba(255, 87, 34, 0.8)'
  ]

  if (charts.types) {
    charts.types.destroy()
  }

  charts.types = new ChartJS(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, data.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  })
}

const createMonthlyTrendChart = () => {
  if (!monthlyTrendChart.value) return

  const ctx = monthlyTrendChart.value.getContext('2d')

  // Group surveys by month
  const monthlyData = {}
  props.filteredSurveys.forEach(survey => {
    const date = DateTime.fromISO(survey.date)
    const monthKey = date.toFormat('yyyy-MM')

    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { surveys: [], label: date.toFormat('MMM yyyy') }
    }
    monthlyData[monthKey].surveys.push(survey)
  })

  // Sort by month
  const sortedMonths = Object.keys(monthlyData).sort()

  const labels = sortedMonths.map(key => monthlyData[key].label)
  const totalMembers = props.currentTeam?.members?.length || 1

  const attendanceData = sortedMonths.map(monthKey => {
    const surveys = monthlyData[monthKey].surveys

    if (props.selectedPlayer) {
      // Player-specific monthly rate
      let yesCount = 0
      surveys.forEach(survey => {
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        if (playerVote && playerVote.vote === true) yesCount++
      })
      return surveys.length > 0 ? Math.round((yesCount / surveys.length) * 100) : 0
    } else {
      // Team average monthly attendance
      let totalYes = 0
      surveys.forEach(survey => {
        const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
        totalYes += yesVotes
      })
      const totalPossible = surveys.length * totalMembers
      return totalPossible > 0 ? Math.round((totalYes / totalPossible) * 100) : 0
    }
  })

  if (charts.monthlyTrend) {
    charts.monthlyTrend.destroy()
  }

  charts.monthlyTrend = new ChartJS(ctx, {
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
        tension: 0.3,
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
          ticks: {
            callback: (value) => value + '%'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${t('reports.attendanceRate')}: ${context.formattedValue}%`
          }
        }
      }
    }
  })
}

const createPlayerRankingChart = () => {
  if (!playerRankingChart.value) return

  const ctx = playerRankingChart.value.getContext('2d')

  const totalSurveys = props.filteredSurveys.length

  // Calculate attendance rate % per member
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

  // Sort descending by rate
  memberRates.sort((a, b) => b.rate - a.rate)

  const labels = memberRates.map(m => m.displayName)
  const data = memberRates.map(m => m.rate)

  // Highlight selected player in blue, others in green
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

  if (charts.ranking) {
    charts.ranking.destroy()
  }

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
          ticks: {
            callback: (value) => value + '%'
          }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (context) => `${t('reports.attendanceRate')}: ${context.formattedValue}%`
          }
        }
      }
    }
  })
}

const createAllCharts = async () => {
  await nextTick()
  await nextTick()
  // Only create charts that are currently visible
  if (participationVisible.value) createParticipationChart()
  if (typesVisible.value) createSurveyTypesChart()
  if (trendVisible.value) createMonthlyTrendChart()
  if (rankingVisible.value) createPlayerRankingChart()
}

const destroyAllCharts = () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy()
  })
  charts = {}
}

// Watch each chart's visibility - create chart when it enters viewport
watch(participationVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    await nextTick()
    createParticipationChart()
  }
})

watch(typesVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    await nextTick()
    createSurveyTypesChart()
  }
})

watch(trendVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    await nextTick()
    createMonthlyTrendChart()
  }
})

watch(rankingVisible, async (visible) => {
  if (visible && !props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    await nextTick()
    createPlayerRankingChart()
  }
})

// Watch loading state - create charts when loading finishes
watch(() => props.loading, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading) {
    nextTick(() => {
      if (props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
        createAllCharts()
      }
    })
  }
})

// Watch for data changes to update charts (when not loading)
watch([() => props.filteredSurveys, () => props.selectedPlayer], () => {
  if (!props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
    createAllCharts()
  }
}, { deep: true })

onMounted(() => {
  if (!props.loading && props.filteredSurveys.length > 0 && props.teamMembers.length > 0) {
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
