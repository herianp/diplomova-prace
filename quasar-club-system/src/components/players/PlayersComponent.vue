<template>
  <div class="players-container">
    <!-- Header -->
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5 text-weight-bold">{{ $t('players.title') }}</div>
        <div class="text-caption text-grey">{{ $t('players.description') }}</div>
      </div>
      <div class="col-auto">
        <q-chip color="primary" text-color="white" icon="groups">
          {{ filteredMembers.length }}
        </q-chip>
      </div>
    </div>

    <!-- Search -->
    <div class="q-mb-md">
      <q-input
        v-model="searchTerm"
        :placeholder="$t('players.search')"
        outlined
        dense
        debounce="300"
        clearable
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <!-- Filter Menu -->
    <div class="q-mb-lg">
      <SurveyFilterMenu
        v-model="filters"
        @filters-changed="onFiltersChanged"
      />
    </div>

    <!-- Loading -->
    <div v-if="loading" class="text-center q-pa-xl">
      <q-spinner size="3em" color="primary" />
    </div>

    <!-- No players -->
    <div v-else-if="members.length === 0" class="text-center q-pa-xl text-grey">
      {{ $t('players.noPlayers') }}
    </div>

    <!-- No search results -->
    <div v-else-if="filteredMembers.length === 0" class="text-center q-pa-xl text-grey">
      {{ $t('players.noResults') }}
    </div>

    <!-- Cards Grid -->
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="member in filteredMembers"
        :key="member.uid"
        class="col-12 col-sm-6 col-md-4 col-lg-3"
      >
        <q-card
          flat
          bordered
          class="player-card"
          @click="openDetail(member)"
        >
          <q-card-section class="text-center q-pb-sm">
            <q-avatar size="60px" color="primary" text-color="white">
              <img v-if="member.photoURL" :src="member.photoURL" :alt="getMemberDisplayName(member)" />
              <q-icon v-else name="person" size="36px" />
            </q-avatar>
            <div class="text-h6 q-mt-sm text-weight-medium ellipsis">{{ getMemberDisplayName(member) }}</div>
            <div class="text-caption text-grey ellipsis">{{ member.email }}</div>
          </q-card-section>

          <q-card-section class="q-pt-xs">
            <div class="row q-gutter-xs justify-center">
              <q-chip
                dense
                color="blue-1"
                text-color="blue-8"
                icon="how_to_reg"
                size="sm"
              >
                {{ getQuickStats(member.uid).participationRate }}%
              </q-chip>
              <q-chip
                dense
                color="green-1"
                text-color="green-8"
                icon="event_available"
                size="sm"
              >
                {{ getQuickStats(member.uid).attendanceRate }}%
              </q-chip>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <!-- Detail Dialog -->
    <q-dialog v-model="showDetail" :persistent="false" position="standard">
      <q-card class="q-ma-md" style="min-width: 400px; max-width: 600px; width: 90vw; max-height: 85vh;">
        <!-- Header -->
        <q-card-section class="row items-center q-pb-none">
          <q-avatar size="48px" color="primary" text-color="white">
            <img v-if="selectedMember?.photoURL" :src="selectedMember.photoURL" :alt="getMemberDisplayName(selectedMember)" />
            <q-icon v-else name="person" size="28px" />
          </q-avatar>
          <div class="q-ml-md col">
            <div class="text-h6 text-weight-bold">{{ selectedMember ? getMemberDisplayName(selectedMember) : '' }}</div>
            <div class="text-caption text-grey">{{ selectedMember?.email }}</div>
          </div>
          <q-btn flat round dense icon="close" @click="showDetail = false" />
        </q-card-section>

        <q-separator class="q-mt-md" />

        <!-- Scrollable Content -->
        <div style="max-height: calc(85vh - 130px); overflow-y: auto;">
          <!-- Stats Grid -->
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ $t('players.detail.stats') }}</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6">
                <div class="stat-box bg-grey-2 rounded-borders q-pa-sm text-center">
                  <div class="text-h6 text-weight-bold text-primary">{{ selectedStats?.totalSurveys ?? 0 }}</div>
                  <div class="text-caption text-grey-7">{{ $t('players.detail.totalSurveys') }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stat-box bg-grey-2 rounded-borders q-pa-sm text-center">
                  <div class="text-h6 text-weight-bold text-positive">{{ selectedStats?.yesVotes ?? 0 }}</div>
                  <div class="text-caption text-grey-7">{{ $t('players.detail.yesVotes') }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stat-box bg-grey-2 rounded-borders q-pa-sm text-center">
                  <div class="text-h6 text-weight-bold text-negative">{{ selectedStats?.noVotes ?? 0 }}</div>
                  <div class="text-caption text-grey-7">{{ $t('players.detail.noVotes') }}</div>
                </div>
              </div>
              <div class="col-6">
                <div class="stat-box bg-grey-2 rounded-borders q-pa-sm text-center">
                  <div class="text-h6 text-weight-bold text-grey-7">{{ selectedStats?.unvoted ?? 0 }}</div>
                  <div class="text-caption text-grey-7">{{ $t('players.detail.unvoted') }}</div>
                </div>
              </div>
            </div>
          </q-card-section>

          <!-- Doughnut Chart -->
          <q-card-section>
            <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ $t('players.detail.voteBreakdown') }}</div>
            <div class="flex flex-center">
              <canvas ref="chartRef" width="200" height="200" style="max-width: 200px;" />
            </div>
          </q-card-section>

          <!-- Progress Bars -->
          <q-card-section>
            <div>
              <div class="row items-center q-mb-xs">
                <div class="col text-caption text-weight-medium">{{ $t('players.detail.attendanceRate') }}</div>
                <div class="col-auto text-caption text-positive text-weight-bold">{{ selectedStats?.attendanceRate ?? 0 }}%</div>
              </div>
              <q-linear-progress
                :value="(selectedStats?.attendanceRate ?? 0) / 100"
                color="positive"
                track-color="grey-3"
                rounded
                size="8px"
              />
            </div>
          </q-card-section>

          <!-- Finances -->
          <q-card-section v-if="selectedBalance">
            <q-separator class="q-mb-md" />
            <div class="text-subtitle2 text-weight-bold q-mb-sm">{{ $t('players.detail.finances') }}</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('players.detail.totalFined') }}</div>
                <div class="text-body2 text-weight-bold text-negative">{{ selectedBalance.totalFined }} CZK</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('players.detail.totalPaid') }}</div>
                <div class="text-body2 text-weight-bold text-positive">{{ selectedBalance.totalPaid }} CZK</div>
              </div>
              <div class="col-4 text-center">
                <div class="text-caption text-grey-7">{{ $t('players.detail.balance') }}</div>
                <div
                  class="text-body2 text-weight-bold"
                  :class="selectedBalance.balance >= 0 ? 'text-positive' : 'text-negative'"
                >
                  {{ selectedBalance.balance }} CZK
                </div>
              </div>
            </div>
          </q-card-section>
        </div>

        <!-- Close Button -->
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('players.detail.close')"
            color="primary"
            @click="showDetail = false"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { useTeamStore } from '@/stores/teamStore'
import { useTeamMemberUtils } from '@/composable/useTeamMemberUtils'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { useSurveyFilters } from '@/composable/useSurveyFilters'
import { useCashboxUseCases } from '@/composable/useCashboxUseCases'
import { useReadiness } from '@/composable/useReadiness'
import SurveyFilterMenu from '@/components/survey/SurveyFilterMenu.vue'

const teamStore = useTeamStore()
const { waitForTeam } = useReadiness()
const { loadTeamMembers, getMemberDisplayName, filterMembers, sortMembersByName, getMemberStats } = useTeamMemberUtils()
const { setSurveysListener } = useSurveyUseCases()
const { filters, createFilteredSurveys, updateFilters } = useSurveyFilters()
const cashboxUseCases = useCashboxUseCases()

// Refs
const members = ref([])
const loading = ref(false)
const searchTerm = ref('')
const showDetail = ref(false)
const selectedMember = ref(null)
const selectedStats = ref(null)
const selectedBalance = ref(null)
const chartRef = ref(null)
const chartInstance = ref(null)
const fines = ref([])
const payments = ref([])

let unsubscribeFines = null
let unsubscribePayments = null

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const surveys = computed(() => teamStore.surveys)
const filteredSurveys = createFilteredSurveys(surveys)

const filteredMembers = computed(() => {
  const filtered = filterMembers(members.value, searchTerm.value || '')
  return sortMembersByName(filtered)
})

const onFiltersChanged = (newFilters) => {
  updateFilters(newFilters)
}

// Get quick stats for card chips (without opening dialog)
const getQuickStats = (memberId) => {
  return getMemberStats(memberId, filteredSurveys.value)
}

// Compute player balance from fines/payments
const getPlayerBalance = (playerId) => {
  const playerFines = fines.value.filter((f) => f.playerId === playerId)
  const playerPayments = payments.value.filter((p) => p.playerId === playerId)
  const totalFined = playerFines.reduce((sum, f) => sum + (f.amount || 0), 0)
  const totalPaid = playerPayments.reduce((sum, p) => sum + (p.amount || 0), 0)
  return { totalFined, totalPaid, balance: totalPaid - totalFined }
}

const renderChart = () => {
  if (!chartRef.value || !selectedStats.value) return

  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }

  const { yesVotes, noVotes, unvoted } = selectedStats.value

  chartInstance.value = new Chart(chartRef.value, {
    type: 'doughnut',
    data: {
      labels: ['Yes', 'No', 'Unvoted'],
      datasets: [
        {
          data: [yesVotes, noVotes, unvoted],
          backgroundColor: ['#21BA45', '#C10015', '#9E9E9E'],
          borderWidth: 2,
          borderColor: '#fff'
        }
      ]
    },
    options: {
      responsive: false,
      plugins: {
        legend: {
          display: false
        }
      }
    }
  })
}

const openDetail = async (member) => {
  selectedMember.value = member
  selectedStats.value = getMemberStats(member.uid, filteredSurveys.value)
  selectedBalance.value = getPlayerBalance(member.uid)
  showDetail.value = true
  await nextTick()
  renderChart()
}

onMounted(async () => {
  loading.value = true
  await waitForTeam()

  const team = currentTeam.value
  if (!team) {
    loading.value = false
    return
  }

  // Load team members
  members.value = await loadTeamMembers(team.members || [])

  // Set up surveys listener
  setSurveysListener(team.id)

  // Set up cashbox listeners
  unsubscribeFines = cashboxUseCases.listenToFines(team.id, (data) => {
    fines.value = data
  })
  unsubscribePayments = cashboxUseCases.listenToPayments(team.id, (data) => {
    payments.value = data
  })

  loading.value = false
})

onUnmounted(() => {
  if (chartInstance.value) {
    chartInstance.value.destroy()
    chartInstance.value = null
  }
  if (unsubscribeFines) unsubscribeFines()
  if (unsubscribePayments) unsubscribePayments()
})
</script>

<style scoped>
.players-container {
  width: 100%;
  padding: 1rem;
}
@media (min-width: 600px) {
  .players-container {
    padding: 1.5rem;
  }
}
.player-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  cursor: pointer;
}
.player-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
.stat-box {
  border-radius: 8px;
}
</style>
