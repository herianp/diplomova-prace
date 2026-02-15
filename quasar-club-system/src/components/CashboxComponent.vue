<template>
  <div class="cashbox-container">
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
        <q-skeleton type="rect" height="300px" />
      </q-card>
    </template>

    <template v-else>
      <!-- Header -->
      <div class="welcome-section q-mb-lg">
        <div class="row items-center justify-between">
          <div class="col">
            <div class="text-h5 text-weight-bold">
              {{ currentTeam?.name }}
            </div>
            <div class="text-body2 text-grey-7">
              {{ $t('cashbox.subtitle') }}
            </div>
          </div>
          <q-chip
            :color="isPowerUser ? 'positive' : 'grey-4'"
            :text-color="isPowerUser ? 'white' : 'grey-8'"
            :icon="isPowerUser ? 'shield' : 'person'"
            :label="isPowerUser ? $t('dashboard.powerUser') : $t('dashboard.member')"
            dense
          />
        </div>
      </div>

      <!-- Dashboard Metrics -->
      <CashboxDashboard :summary="teamSummary" />

      <!-- Action Buttons (Power Users only) -->
      <div v-if="isPowerUser" class="row q-gutter-sm q-mb-lg">
        <q-btn
          color="negative"
          icon="gavel"
          :label="$t('cashbox.fines.addFine')"
          no-caps
          unelevated
          @click="showAddFineDialog = true"
        />
        <q-btn
          color="positive"
          icon="payments"
          :label="$t('cashbox.payments.recordPayment')"
          no-caps
          unelevated
          @click="showAddPaymentDialog = true"
        />
        <q-btn
          color="primary"
          icon="rule"
          :label="$t('cashbox.rules.title')"
          no-caps
          outline
          @click="showFineRulesDialog = true"
        />
        <q-space />
        <q-btn
          color="grey-7"
          icon="history"
          :label="$t('cashbox.cashboxHistory.title')"
          no-caps
          outline
          @click="showHistoryDialog = true"
        />
        <q-btn
          color="warning"
          text-color="dark"
          icon="restart_alt"
          :label="$t('cashbox.clear.button')"
          no-caps
          outline
          @click="showClearDialog = true"
        />
      </div>

      <!-- Player Balances -->
      <CashboxPlayerList
        :player-balances="playerBalances"
        :fines="fines"
        :payments="payments"
        :is-power-user="isPowerUser"
        :get-player-name="getPlayerNameBound"
        :current-user-uid="currentUser?.uid"
        @add-fine="onAddFineForPlayer"
        @record-payment="onRecordPaymentForPlayer"
        @delete-fine="onDeleteFine"
        @delete-payment="onDeletePayment"
      />

      <!-- Add Fine Dialog -->
      <CashboxAddFine
        v-model="showAddFineDialog"
        :team-members="teamMembers"
        :preselected-player="preselectedPlayer"
        :get-player-name="getPlayerNameBound"
        @submit="onSubmitFine"
      />

      <!-- Record Payment Dialog -->
      <CashboxAddPayment
        v-model="showAddPaymentDialog"
        :team-members="teamMembers"
        :preselected-player="preselectedPlayer"
        :get-player-name="getPlayerNameBound"
        @submit="onSubmitPayment"
      />

      <!-- Fine Rules Dialog -->
      <CashboxFineRules
        v-model="showFineRulesDialog"
        :fine-rules="fineRules"
        :team-id="currentTeam.id"
        @add="onAddFineRule"
        @update="onUpdateFineRule"
        @delete="onDeleteFineRule"
      />

      <!-- Clear Cashbox Confirmation Dialog -->
      <q-dialog v-model="showClearDialog" persistent>
        <q-card style="min-width: 400px">
          <q-card-section class="row items-center">
            <q-icon name="warning" color="warning" size="2em" class="q-mr-md" />
            <span class="text-h6">{{ $t('cashbox.clear.confirmTitle') }}</span>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="text-body1">{{ $t('cashbox.clear.confirmMessage') }}</div>
            <div class="text-body2 text-negative q-mt-md">
              <q-icon name="warning" class="q-mr-xs" />
              {{ $t('cashbox.clear.warning') }}
            </div>
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="$t('common.cancel')" color="grey-7" v-close-popup :disable="clearing" />
            <q-btn :label="$t('cashbox.clear.button')" color="warning" text-color="dark" @click="onClearCashbox" :loading="clearing" />
          </q-card-actions>
        </q-card>
      </q-dialog>

      <!-- Cashbox History Dialog -->
      <q-dialog v-model="showHistoryDialog" maximized transition-show="slide-up" transition-hide="slide-down">
        <q-card>
          <q-card-section class="row items-center bg-primary text-white">
            <q-icon name="history" size="sm" class="q-mr-sm" />
            <div class="text-h6">{{ $t('cashbox.cashboxHistory.title') }}</div>
            <q-space />
            <q-btn icon="close" flat round dense v-close-popup />
          </q-card-section>
          <q-card-section class="q-pa-md">
            <div v-if="cashboxHistory.length === 0" class="text-center text-grey-6 q-py-xl">
              {{ $t('cashbox.cashboxHistory.noHistory') }}
            </div>
            <q-list v-else separator>
              <q-expansion-item
                v-for="entry in cashboxHistory"
                :key="entry.id"
                group="history"
                class="q-mb-sm"
              >
                <template v-slot:header>
                  <q-item-section avatar>
                    <q-icon name="archive" color="primary" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>{{ formatHistoryDate(entry.clearedAt) }}</q-item-label>
                    <q-item-label caption>
                      {{ $t('cashbox.cashboxHistory.clearedBy') }}: {{ getPlayerNameBound(entry.clearedBy) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <div class="text-caption">
                      {{ entry.summary.totalFined }} {{ $t('cashbox.currency') }} {{ $t('cashbox.dashboard.totalFined').toLowerCase() }}
                    </div>
                  </q-item-section>
                </template>
                <q-card flat>
                  <q-card-section>
                    <!-- Summary metrics -->
                    <div class="row q-col-gutter-sm q-mb-md">
                      <div class="col-6 col-md-3">
                        <div class="text-caption text-grey-7">{{ $t('cashbox.dashboard.totalFined') }}</div>
                        <div class="text-body1 text-weight-medium text-negative">{{ entry.summary.totalFined }} {{ $t('cashbox.currency') }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="text-caption text-grey-7">{{ $t('cashbox.dashboard.totalPaid') }}</div>
                        <div class="text-body1 text-weight-medium text-positive">{{ entry.summary.totalPaid }} {{ $t('cashbox.currency') }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="text-caption text-grey-7">{{ $t('cashbox.dashboard.outstanding') }}</div>
                        <div class="text-body1 text-weight-medium text-warning">{{ entry.summary.totalOutstanding }} {{ $t('cashbox.currency') }}</div>
                      </div>
                      <div class="col-6 col-md-3">
                        <div class="text-caption text-grey-7">{{ $t('cashbox.dashboard.credits') }}</div>
                        <div class="text-body1 text-weight-medium text-teal">{{ entry.summary.totalCredits }} {{ $t('cashbox.currency') }}</div>
                      </div>
                    </div>
                    <!-- Player balances -->
                    <div class="text-subtitle2 q-mb-sm">{{ $t('cashbox.players.title') }}</div>
                    <q-list dense separator>
                      <q-item v-for="player in entry.playerBalances" :key="player.playerId" class="q-px-none">
                        <q-item-section>
                          <q-item-label>{{ player.displayName }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <span :class="player.balance < 0 ? 'text-negative' : player.balance > 0 ? 'text-positive' : 'text-grey'" class="text-weight-medium">
                            {{ player.balance }} {{ $t('cashbox.currency') }}
                          </span>
                        </q-item-section>
                      </q-item>
                    </q-list>
                  </q-card-section>
                </q-card>
              </q-expansion-item>
            </q-list>
          </q-card-section>
        </q-card>
      </q-dialog>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useTeamStore } from '@/stores/teamStore'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useReadiness } from '@/composable/useReadiness'
import { useCashboxUseCases } from '@/composable/useCashboxUseCases'
import { useTeamMemberUtils } from '@/composable/useTeamMemberUtils'
import CashboxDashboard from '@/components/cashbox/CashboxDashboard.vue'
import CashboxPlayerList from '@/components/cashbox/CashboxPlayerList.vue'
import CashboxAddFine from '@/components/cashbox/CashboxAddFine.vue'
import CashboxAddPayment from '@/components/cashbox/CashboxAddPayment.vue'
import CashboxFineRules from '@/components/cashbox/CashboxFineRules.vue'
import { DateTime } from 'luxon'
import { listenerRegistry } from '@/services/listenerRegistry'

const $q = useQuasar()
const { t } = useI18n()
const teamStore = useTeamStore()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { waitForTeam } = useReadiness()
const cashbox = useCashboxUseCases()
const { loadTeamMembers, getPlayerName } = useTeamMemberUtils()

// State
const fines = ref([])
const payments = ref([])
const fineRules = ref([])
const teamMembers = ref([])
const showAddFineDialog = ref(false)
const showAddPaymentDialog = ref(false)
const showFineRulesDialog = ref(false)
const showClearDialog = ref(false)
const showHistoryDialog = ref(false)
const clearing = ref(false)
const cashboxHistory = ref([])
const preselectedPlayer = ref(null)

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => isCurrentUserPowerUser.value)

const getPlayerNameBound = (id) => getPlayerName(id, teamMembers.value)

const playerBalances = computed(() => {
  if (!currentTeam.value?.members) return []
  return cashbox.calculateAllPlayerBalances(
    currentTeam.value.members,
    getPlayerNameBound,
    fines.value,
    payments.value
  )
})

const teamSummary = computed(() => {
  return cashbox.calculateTeamSummary(fines.value, payments.value)
})

// Setup listeners for a team
const setupListeners = (teamId) => {
  cleanupListeners()

  const unsubFines = cashbox.listenToFines(teamId, (data) => { fines.value = data })
  listenerRegistry.register('cashbox-fines', unsubFines, { teamId })

  const unsubPayments = cashbox.listenToPayments(teamId, (data) => { payments.value = data })
  listenerRegistry.register('cashbox-payments', unsubPayments, { teamId })

  const unsubRules = cashbox.listenToFineRules(teamId, (data) => { fineRules.value = data })
  listenerRegistry.register('cashbox-rules', unsubRules, { teamId })

  const unsubHistory = cashbox.listenToCashboxHistory(teamId, (data) => { cashboxHistory.value = data })
  listenerRegistry.register('cashbox-history', unsubHistory, { teamId })
}

const cleanupListeners = () => {
  listenerRegistry.unregister('cashbox-fines')
  listenerRegistry.unregister('cashbox-payments')
  listenerRegistry.unregister('cashbox-rules')
  listenerRegistry.unregister('cashbox-history')
}

// Load team members
const loadMembers = async () => {
  if (currentTeam.value?.members) {
    teamMembers.value = await loadTeamMembers(currentTeam.value.members)
  }
}

// Event handlers
const onAddFineForPlayer = (playerId) => {
  preselectedPlayer.value = playerId
  showAddFineDialog.value = true
}

const onRecordPaymentForPlayer = (playerId) => {
  preselectedPlayer.value = playerId
  showAddPaymentDialog.value = true
}

const onSubmitFine = async ({ playerId, amount, reason }) => {
  try {
    await cashbox.addManualFine(currentTeam.value.id, playerId, amount, reason, currentUser.value.uid)
    $q.notify({ type: 'positive', message: t('cashbox.fines.addSuccess') })
    showAddFineDialog.value = false
    preselectedPlayer.value = null
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.fines.addError') })
  }
}

const onSubmitPayment = async ({ playerId, amount, note }) => {
  try {
    await cashbox.recordPayment(currentTeam.value.id, playerId, amount, currentUser.value.uid, note)
    $q.notify({ type: 'positive', message: t('cashbox.payments.addSuccess') })
    showAddPaymentDialog.value = false
    preselectedPlayer.value = null
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.payments.addError') })
  }
}

const onDeleteFine = async (fineId) => {
  try {
    await cashbox.deleteFine(currentTeam.value.id, fineId)
    $q.notify({ type: 'positive', message: t('cashbox.fines.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.fines.deleteError') })
  }
}

const onDeletePayment = async (paymentId) => {
  try {
    await cashbox.deletePayment(currentTeam.value.id, paymentId)
    $q.notify({ type: 'positive', message: t('cashbox.payments.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.payments.deleteError') })
  }
}

const onAddFineRule = async (rule) => {
  try {
    await cashbox.addFineRule(currentTeam.value.id, { ...rule, createdBy: currentUser.value.uid, createdAt: new Date() })
    $q.notify({ type: 'positive', message: t('cashbox.rules.addSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.rules.addError') })
  }
}

const onUpdateFineRule = async ({ ruleId, data }) => {
  try {
    await cashbox.updateFineRule(currentTeam.value.id, ruleId, data)
    $q.notify({ type: 'positive', message: t('cashbox.rules.updateSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.rules.updateError') })
  }
}

const onDeleteFineRule = async (ruleId) => {
  try {
    await cashbox.deleteFineRule(currentTeam.value.id, ruleId)
    $q.notify({ type: 'positive', message: t('cashbox.rules.deleteSuccess') })
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.rules.deleteError') })
  }
}

const onClearCashbox = async () => {
  try {
    clearing.value = true
    await cashbox.clearCashbox(
      currentTeam.value.id,
      fines.value,
      payments.value,
      currentTeam.value.members,
      getPlayerNameBound,
      currentUser.value.uid,
      t('cashbox.clear.carryOverFine'),
      t('cashbox.clear.carryOverPayment')
    )
    $q.notify({ type: 'positive', message: t('cashbox.clear.success') })
    showClearDialog.value = false
  } catch {
    $q.notify({ type: 'negative', message: t('cashbox.clear.error') })
  } finally {
    clearing.value = false
  }
}

const formatHistoryDate = (date) => {
  if (!date) return ''
  const d = date?.seconds ? DateTime.fromSeconds(date.seconds) : DateTime.fromJSDate(new Date(date))
  return d.toFormat('d.M.yyyy HH:mm')
}

// Watch for team changes
watch(() => currentTeam.value?.id, (newTeamId) => {
  if (newTeamId) {
    setupListeners(newTeamId)
    loadMembers()
  } else {
    cleanupListeners()
  }
})

// Reset preselected player when dialogs close
watch(showAddFineDialog, (val) => { if (!val) preselectedPlayer.value = null })
watch(showAddPaymentDialog, (val) => { if (!val) preselectedPlayer.value = null })

onMounted(async () => {
  await waitForTeam()
  if (currentTeam.value?.id) {
    setupListeners(currentTeam.value.id)
    await loadMembers()
  }
})

onUnmounted(() => {
  cleanupListeners()
})
</script>

<style scoped>
.cashbox-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .cashbox-container {
    padding: 1.5rem;
  }
}
</style>
