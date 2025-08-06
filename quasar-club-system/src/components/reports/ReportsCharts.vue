<template>
  <!-- Loading State -->
  <div v-if="loading" class="loading-container text-center q-pa-xl">
    <q-spinner-dots size="50px" color="primary" />
    <div class="text-h6 q-mt-md text-grey-6">{{ $t('reports.loading') }}</div>
  </div>

  <!-- Charts Grid -->
  <div v-else class="charts-grid">
    <!-- Chart Sections -->
    <div class="row q-gutter-lg">
      <!-- Survey Participation Chart -->
      <div class="col-12">
        <q-card flat bordered class="chart-card q-mb-lg">
          <q-card-section>
            <div class="text-h6 q-mb-md text-center">{{ $t('reports.surveyParticipation') }}</div>
            <div class="chart-container" style="height: 400px;">
              <canvas ref="participationChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Survey Types Distribution -->
      <div class="col-12 col-md-6">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="text-h6 q-mb-md text-center">{{ $t('reports.surveyTypes') }}</div>
            <div class="chart-container" style="height: 300px;">
              <canvas ref="surveyTypesChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Team Member Activity -->
      <div class="col-12">
        <q-card flat bordered class="chart-card">
          <q-card-section>
            <div class="text-h6 q-mb-md text-center">{{ $t('reports.memberActivity') }}</div>
            <div class="chart-container" style="height: 400px;">
              <canvas ref="memberActivityChart"></canvas>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
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
  ArcElement
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
  ArcElement
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

// Chart refs
const participationChart = ref(null)
const surveyTypesChart = ref(null)
const memberActivityChart = ref(null)

// Chart instances
let charts = {}

const createParticipationChart = () => {
  if (!participationChart.value) return

  const ctx = participationChart.value.getContext('2d')

  // Calculate voting breakdown data for surveys (sorted by date)
  const sortedSurveys = [...props.filteredSurveys]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-10) // Take last 10 surveys

  let labels, yesData, noData, unvotedData, surveyTitles

  if (sortedSurveys.length === 0) {
    // Sample data if no surveys exist
    labels = ['Jan 01', 'Jan 02', 'Jan 03']
    yesData = [40, 60, 30]
    noData = [35, 25, 40]
    unvotedData = [25, 15, 30]
    surveyTitles = ['Sample Survey 1', 'Sample Survey 2', 'Sample Survey 3']
  } else {
    // Use dates for x-axis labels
    labels = sortedSurveys.map(survey => {
      const date = DateTime.fromISO(survey.date)
      return date.toFormat('MMM dd')
    })

    // Store survey titles for tooltips
    surveyTitles = sortedSurveys.map(survey => survey.title)

    // Calculate voting breakdown percentages
    const totalMembers = props.currentTeam?.members?.length || 1

    yesData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        // For specific player: 100% if voted yes, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return (playerVote && playerVote.vote === true) ? 100 : 0
      } else {
        // For all players: percentage who voted yes
        const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
        return Math.round((yesVotes / totalMembers) * 100)
      }
    })

    noData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        // For specific player: 100% if voted no, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return (playerVote && playerVote.vote === false) ? 100 : 0
      } else {
        // For all players: percentage who voted no
        const noVotes = survey.votes?.filter(vote => vote.vote === false).length || 0
        return Math.round((noVotes / totalMembers) * 100)
      }
    })

    unvotedData = sortedSurveys.map(survey => {
      if (props.selectedPlayer) {
        // For specific player: 100% if didn't vote, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === props.selectedPlayer)
        return playerVote ? 0 : 100
      } else {
        // For all players: percentage who didn't vote
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
        x: {
          stacked: true
        },
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
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            title: (context) => {
              // Show survey title as tooltip title
              const index = context[0].dataIndex
              return surveyTitles[index] || context[0].label
            },
            label: (context) => {
              return `${context.dataset.label}: ${context.formattedValue}%`
            }
          }
        }
      }
    }
  })
}

const createSurveyTypesChart = () => {
  if (!surveyTypesChart.value) return

  const ctx = surveyTypesChart.value.getContext('2d')

  // Calculate survey types distribution
  const typesCounts = {}
  props.filteredSurveys.forEach(survey => {
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
        legend: {
          position: 'bottom'
        }
      }
    }
  })
}

const createMemberActivityChart = () => {
  if (!memberActivityChart.value) return

  const ctx = memberActivityChart.value.getContext('2d')

  // Calculate member "Yes" votes only
  const memberStats = {}

  // Initialize all members
  props.currentTeam?.members?.forEach(memberId => {
    memberStats[memberId] = 0
  })

  // Count "Yes" votes per member
  props.filteredSurveys.forEach(survey => {
    survey.votes?.forEach(vote => {
      if (Object.prototype.hasOwnProperty.call(memberStats, vote.userUid) && vote.vote === true) {
        memberStats[vote.userUid]++
      }
    })
  })

  // 1. Combine member data and labels for sorting
  const combinedData = Object.keys(memberStats).map(memberId => {
    const member = props.teamMembers.find(m => m.uid === memberId);
    const displayName = member?.displayName || member?.email || `Member ${memberId.substring(0, 6)}...`;
    const voteCount = memberStats[memberId];
    return {
      id: memberId,
      displayName: displayName,
      voteCount: voteCount
    };
  });

  // 2. Sort the combined data by voteCount in descending order
  combinedData.sort((a, b) => b.voteCount - a.voteCount);

  // 3. Separate the sorted data back into labels and data arrays for Chart.js
  const labels = combinedData.map(item => item.displayName);
  const data = combinedData.map(item => item.voteCount);

  if (charts.activity) {
    charts.activity.destroy()
  }

  charts.activity = new ChartJS(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: t('reports.attendance'),
        data,
        backgroundColor: 'rgba(76, 175, 80, 0.7)',
        borderColor: 'rgba(76, 175, 80, 1)',
        borderWidth: 2,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      }
    }
  })
}

const createAllCharts = async () => {
  await nextTick()

  // Add small delay to ensure DOM is ready
  setTimeout(() => {
    createParticipationChart()
    createSurveyTypesChart()
    createMemberActivityChart()
  }, 100)
}

const destroyAllCharts = () => {
  Object.values(charts).forEach(chart => {
    if (chart) chart.destroy()
  })
  charts = {}
}

// Watch loading state - create charts when loading finishes
watch(() => props.loading, (newLoading, oldLoading) => {
  if (oldLoading && !newLoading) {
    // Loading just finished, create charts
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
  // Only create charts if data is already available and not loading
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
