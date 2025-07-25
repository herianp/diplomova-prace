<template>
  <div class="reports-container">
    <!-- Header -->
    <div class="page-header q-mb-lg">
      <h2 v-if="!isMobile" class="text-center q-ma-none q-pa-none">
        {{ $t('reports.title') }}
      </h2>
      <div v-if="currentTeam" class="text-center text-grey-6 q-mt-sm">
        {{ currentTeam.name }} - {{ $t('reports.teamMetrics') }}
      </div>
    </div>

    <!-- No Team Selected -->
    <div v-if="!currentTeam" class="no-team text-center q-pa-xl">
      <q-icon name="analytics" size="4em" color="grey-4" class="q-mb-md" />
      <div class="text-h5 text-grey-6 q-mb-sm">{{ $t('reports.noTeam') }}</div>
      <div class="text-body2 text-grey-5">{{ $t('reports.selectTeamFirst') }}</div>
    </div>

    <!-- Reports Content -->
    <div v-else class="reports-content">
      <!-- Filter Menu (same as SurveyPage) -->
      <SurveyFilterMenu
        v-model="filters"
        @filters-changed="onFiltersChanged"
        class="q-mb-lg"
      />

      <!-- Team Statistics Section (Not affected by player filter) -->
      <div class="team-stats-section q-mb-lg">
        <div class="text-h6 q-mb-md">{{ $t('reports.teamStatistics') }}</div>
        <div class="row">
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-blue-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-blue-8 q-mb-xs">{{ teamMetrics.totalSurveys }}</div>
                <div class="text-caption text-blue-6">{{ $t('reports.totalSurveys') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-green-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-green-8 q-mb-xs">{{ teamMetrics.totalMembers }}</div>
                <div class="text-caption text-green-6">{{ $t('reports.totalMembers') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-orange-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-orange-8 q-mb-xs">{{ teamMetrics.averageParticipation }}%</div>
                <div class="text-caption text-orange-6">{{ $t('reports.avgTeamParticipation') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-purple-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-purple-8 q-mb-xs">{{ teamMetrics.activeSurveys }}</div>
                <div class="text-caption text-purple-6">{{ $t('reports.activeSurveys') }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

      <!-- Player Filter Section -->
      <div class="player-filter-section q-mb-lg">
        <q-card flat bordered class="q-pa-md">
          <div class="text-h6 q-mb-md">{{ $t('reports.playerFilter') }}</div>
          <div class="row q-gutter-md items-end">
            <!-- Player Filter -->
            <div class="col-12 col-md-6">
              <q-select
                v-model="selectedPlayer"
                :options="playerOptions"
                :label="$t('reports.selectPlayer')"
                emit-value
                map-options
                clearable
                outlined
                dense
              >
                <template v-slot:prepend>
                  <q-icon name="person" />
                </template>
              </q-select>
            </div>

            <!-- Reset Player Filter -->
            <div class="col-12 col-md-3">
              <q-btn
                v-if="selectedPlayer"
                color="grey-7"
                icon="person_off"
                :label="$t('reports.clearPlayerFilter')"
                @click="selectedPlayer = null"
                outline
                dense
              />
            </div>
          </div>

          <!-- Player Filter Info -->
          <div v-if="selectedPlayer" class="q-mt-md">
            <q-chip
              :label="`${$t('reports.player')}: ${getPlayerName(selectedPlayer)}`"
              removable
              @remove="selectedPlayer = null"
              color="primary"
              text-color="white"
            />
            <div class="q-mt-sm text-caption text-grey-6">
              {{ $t('reports.playerFilterInfo') }}
            </div>
          </div>
        </q-card>
      </div>

      <!-- Player Statistics Section (Only shown when player is selected) -->
      <div v-if="selectedPlayer" class="player-stats-section q-mb-lg">
        <div class="text-h6 q-mb-md">{{ $t('reports.playerStatistics') }}: {{ getPlayerName(selectedPlayer) }}</div>
        <div class="row">
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-green-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-green-8 q-mb-xs">{{ playerMetrics.yesVotes }}</div>
                <div class="text-caption text-green-6">{{ $t('reports.attendance') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-red-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-red-8 q-mb-xs">{{ playerMetrics.noVotes }}</div>
                <div class="text-caption text-red-6">{{ $t('reports.nonAttendance') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-grey-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-grey-8 q-mb-xs">{{ playerMetrics.unvoted }}</div>
                <div class="text-caption text-grey-6">{{ $t('reports.unvoted') }}</div>
              </q-card-section>
            </q-card>
          </div>
          <div class="col-6 col-md-3 q-pa-xs">
            <q-card flat bordered class="metric-card bg-blue-1">
              <q-card-section class="text-center q-pa-sm">
                <div class="text-h4 text-blue-8 q-mb-xs">{{ playerMetrics.averageParticipation }}%</div>
                <div class="text-caption text-blue-6">{{ $t('reports.avgPlayerParticipation') }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </div>

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
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useScreenComposable } from '@/composable/useScreenComposable.js'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { db } from '@/firebase/config.ts'
import { collection, query, where, getDocs } from 'firebase/firestore'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'
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

const teamStore = useTeamStore()
const { isMobile } = useScreenComposable()
const $q = useQuasar()
const { t } = useI18n()

// Chart refs
const participationChart = ref(null)
const surveyTypesChart = ref(null)
const memberActivityChart = ref(null)

// State
const loading = ref(true)
const teamMembers = ref([])
const teamMetrics = ref({
  totalSurveys: 0,
  totalMembers: 0,
  averageParticipation: 0,
  activeSurveys: 0
})
const playerMetrics = ref({
  yesVotes: 0,
  noVotes: 0,
  unvoted: 0,
  averageParticipation: 0
})

// Filter state (same structure as SurveyPage)
const selectedPlayer = ref(null)
const filters = ref({
  searchName: '',
  dateFrom: '2025-07-13', // Season start
  dateTo: DateTime.now().toISODate() // Current date
})

// Chart instances
let charts = {}

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys || [])

// Filter computed properties
const playerOptions = computed(() => {
  if (!teamMembers.value.length) return []

  return [
    { label: t('reports.allPlayers'), value: null },
    ...teamMembers.value.map(member => ({
      label: member.displayName || member.email || `Member ${member.uid.substring(0, 8)}...`,
      value: member.uid
    }))
  ]
})

const filteredSurveys = computed(() => {
  let filtered = [...surveys.value]

  // Apply date filter using the unified filter structure
  if (filters.value.dateFrom || filters.value.dateTo) {
    filtered = filtered.filter(survey => {
      const surveyDate = DateTime.fromISO(survey.date)
      const fromDate = filters.value.dateFrom ? DateTime.fromISO(filters.value.dateFrom) : null
      const toDate = filters.value.dateTo ? DateTime.fromISO(filters.value.dateTo) : null

      if (fromDate && surveyDate < fromDate) return false
      if (toDate && surveyDate > toDate) return false
      return true
    })
  }

  // Apply name search filter
  if (filters.value.searchName?.trim()) {
    const searchTerm = filters.value.searchName.toLowerCase().trim()
    filtered = filtered.filter(survey =>
      survey.title.toLowerCase().includes(searchTerm)
    )
  }

  return filtered
})

// Filter event handler for SurveyFilterMenu
const onFiltersChanged = (newFilters) => {
  filters.value = { ...newFilters }
}

const getPlayerName = (playerId) => {
  const member = teamMembers.value.find(m => m.uid === playerId)
  return member?.displayName || member?.email || `Member ${playerId.substring(0, 8)}...`
}

// Methods
const loadTeamMembers = async () => {
  if (!currentTeam.value?.members?.length) {
    teamMembers.value = []
    return
  }

  try {
    const members = currentTeam.value.members
    const allUsers = []

    // Split members into chunks of 30 (Firestore IN query limit)
    const chunkSize = 30
    for (let i = 0; i < members.length; i += chunkSize) {
      const chunk = members.slice(i, i + chunkSize)

      const usersQuery = query(
        collection(db, 'users'),
        where('__name__', 'in', chunk)
      )
      const usersSnapshot = await getDocs(usersQuery)

      const chunkUsers = usersSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }))

      allUsers.push(...chunkUsers)
    }

    teamMembers.value = allUsers
  } catch (error) {
    console.error('Error loading team members:', error)
    teamMembers.value = []
  }
}

const calculateTeamMetrics = () => {
  const surveysToUse = filteredSurveys.value

  if (!currentTeam.value || !surveysToUse.length) {
    teamMetrics.value = {
      totalSurveys: 0,
      totalMembers: currentTeam.value?.members?.length || 0,
      averageParticipation: 0,
      activeSurveys: 0
    }
    return
  }

  const now = DateTime.now()
  const activeSurveys = surveysToUse.filter(survey => {
    const surveyDate = DateTime.fromISO(survey.date + 'T' + survey.time)
    return surveyDate > now
  })

  // Calculate team average attendance based on "Yes" votes only
  const totalYesVotes = surveysToUse.reduce((sum, survey) => {
    const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
    return sum + yesVotes
  }, 0)
  const totalPossibleVotes = surveysToUse.length * (currentTeam.value?.members?.length || 1)
  const averageParticipation = totalPossibleVotes > 0 ? Math.round((totalYesVotes / totalPossibleVotes) * 100) : 0

  teamMetrics.value = {
    totalSurveys: surveysToUse.length,
    totalMembers: currentTeam.value?.members?.length || 0,
    averageParticipation,
    activeSurveys: activeSurveys.length
  }
}

const calculatePlayerMetrics = () => {
  if (!selectedPlayer.value) {
    playerMetrics.value = {
      yesVotes: 0,
      noVotes: 0,
      unvoted: 0,
      averageParticipation: 0
    }
    return
  }

  const surveysToUse = filteredSurveys.value

  if (!surveysToUse.length) {
    playerMetrics.value = {
      yesVotes: 0,
      noVotes: 0,
      unvoted: 0,
      averageParticipation: 0
    }
    return
  }

  let yesVotes = 0
  let noVotes = 0
  let unvoted = 0

  surveysToUse.forEach(survey => {
    const playerVote = survey.votes?.find(vote => vote.userUid === selectedPlayer.value)

    if (playerVote) {
      if (playerVote.vote === true) {
        yesVotes++
      } else if (playerVote.vote === false) {
        noVotes++
      }
    } else {
      unvoted++
    }
  })

  // Calculate player's attendance rate based on "Yes" votes only
  const averageParticipation = surveysToUse.length > 0 ? Math.round((yesVotes / surveysToUse.length) * 100) : 0

  playerMetrics.value = {
    yesVotes,
    noVotes,
    unvoted,
    averageParticipation
  }
}

const createParticipationChart = () => {
  if (!participationChart.value) return

  const ctx = participationChart.value.getContext('2d')

  // Calculate voting breakdown data for surveys (sorted by date)
  const sortedSurveys = [...filteredSurveys.value]
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
    const totalMembers = currentTeam.value?.members?.length || 1

    yesData = sortedSurveys.map(survey => {
      if (selectedPlayer.value) {
        // For specific player: 100% if voted yes, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === selectedPlayer.value)
        return (playerVote && playerVote.vote === true) ? 100 : 0
      } else {
        // For all players: percentage who voted yes
        const yesVotes = survey.votes?.filter(vote => vote.vote === true).length || 0
        return Math.round((yesVotes / totalMembers) * 100)
      }
    })

    noData = sortedSurveys.map(survey => {
      if (selectedPlayer.value) {
        // For specific player: 100% if voted no, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === selectedPlayer.value)
        return (playerVote && playerVote.vote === false) ? 100 : 0
      } else {
        // For all players: percentage who voted no
        const noVotes = survey.votes?.filter(vote => vote.vote === false).length || 0
        return Math.round((noVotes / totalMembers) * 100)
      }
    })

    unvotedData = sortedSurveys.map(survey => {
      if (selectedPlayer.value) {
        // For specific player: 100% if didn't vote, 0% otherwise
        const playerVote = survey.votes?.find(vote => vote.userUid === selectedPlayer.value)
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
  filteredSurveys.value.forEach(survey => {
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
  currentTeam.value?.members?.forEach(memberId => {
    memberStats[memberId] = 0
  })

  // Count "Yes" votes per member
  filteredSurveys.value.forEach(survey => {
    survey.votes?.forEach(vote => {
      if (Object.prototype.hasOwnProperty.call(memberStats, vote.userUid) && vote.vote === true) {
        memberStats[vote.userUid]++
      }
    })
  })

  const memberIds = Object.keys(memberStats)
  const labels = memberIds.map(id => {
    const member = teamMembers.value.find(m => m.uid === id)
    return member?.displayName || member?.email || `Member ${id.substring(0, 6)}...`
  })
  const data = Object.values(memberStats)

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

const loadData = async () => {
  if (!currentTeam.value) {
    loading.value = false
    return
  }

  loading.value = true

  try {
    // Load team members first
    await loadTeamMembers()

    // Only load surveys if they're not already loaded for this team
    if (surveys.value.length === 0) {
      console.log('Loading surveys for team:', currentTeam.value.id)
      await teamStore.setSurveysListener(currentTeam.value.id)

      // Wait a bit for surveys to load
      setTimeout(() => {
        console.log('Surveys loaded, count:', surveys.value.length)
        calculateTeamMetrics()
        calculatePlayerMetrics()
        createAllCharts()
        loading.value = false
      }, 500)
    } else {
      // Surveys already loaded, just create charts
      console.log('Using existing surveys, count:', surveys.value.length)
      calculateTeamMetrics()
      calculatePlayerMetrics()
      await createAllCharts()
      loading.value = false
    }
  } catch (error) {
    console.error('Error loading reports data:', error)
    $q.notify({
      type: 'negative',
      message: t('reports.loadError'),
      icon: 'error'
    })
    loading.value = false
  }
}

// Watch for team changes only
watch(currentTeam, (newTeam) => {
  if (newTeam) {
    loadData()
  }
}, { immediate: false })

// Watch for surveys changes to update charts without reloading
watch(surveys, (newSurveys) => {
  if (newSurveys.length > 0 && !loading.value) {
    calculateTeamMetrics()
    calculatePlayerMetrics()
    createAllCharts()
  }
}, { deep: true })

// Watch for filter changes (affects team metrics and player metrics)
watch(filters, () => {
  if (!loading.value) {
    calculateTeamMetrics()
    calculatePlayerMetrics()
    createAllCharts()
  }
}, { deep: true })

// Watch for player filter changes (affects player metrics and charts)
watch(selectedPlayer, () => {
  if (!loading.value) {
    calculatePlayerMetrics()
    createAllCharts()
  }
})

onMounted(() => {
  loadData()
})

onUnmounted(() => {
  destroyAllCharts()
})
</script>

<style scoped>
.reports-container {
  width: 100%;
  padding: 1rem;
}

.metric-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

.no-team,
.loading-container {
  min-height: 400px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 768px) {
  .reports-container {
    padding: 1rem;
  }

  .chart-container {
    height: 250px !important;
  }

  .metric-card .text-h3 {
    font-size: 2rem;
  }
}
</style>
