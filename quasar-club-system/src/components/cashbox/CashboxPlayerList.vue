<template>
  <q-card flat bordered class="q-mb-lg">
    <q-card-section>
      <div class="row items-center q-mb-md">
        <q-icon name="people" size="sm" color="primary" class="q-mr-sm" />
        <div class="text-subtitle1 text-weight-medium">{{ $t('cashbox.players.title') }}</div>
        <q-space />
        <q-input
          v-model="search"
          dense
          outlined
          :placeholder="$t('cashbox.players.search')"
          class="search-input"
          clearable
        >
          <template v-slot:prepend>
            <q-icon name="search" size="xs" />
          </template>
        </q-input>
      </div>

      <div v-if="filteredBalances.length === 0" class="text-center text-grey-6 q-py-lg">
        {{ $t('cashbox.players.noFines') }}
      </div>

      <q-list v-else separator>
        <q-expansion-item
          v-for="player in filteredBalances"
          :key="player.playerId"
          group="players"
          class="player-item"
        >
          <template v-slot:header>
            <q-item-section avatar>
              <q-avatar
                :color="getBalanceColor(player.balance)"
                text-color="white"
                size="36px"
                font-size="14px"
              >
                {{ getInitials(player.displayName) }}
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label>{{ player.displayName }}</q-item-label>
              <q-item-label caption>
                <span v-if="player.balance < 0" class="text-negative text-weight-medium">
                  {{ $t('cashbox.players.owes') }} {{ Math.abs(player.balance) }} {{ $t('cashbox.currency') }}
                </span>
                <span v-else-if="player.balance > 0" class="text-positive text-weight-medium">
                  {{ $t('cashbox.players.credit') }} {{ player.balance }} {{ $t('cashbox.currency') }}
                </span>
                <span v-else class="text-grey-6">
                  {{ $t('cashbox.players.settled') }}
                </span>
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <div class="row q-gutter-xs" v-if="isPowerUser">
                <q-btn
                  flat dense round
                  icon="gavel"
                  color="negative"
                  size="sm"
                  @click.stop="$emit('addFine', player.playerId)"
                >
                  <q-tooltip>{{ $t('cashbox.fines.addFine') }}</q-tooltip>
                </q-btn>
                <q-btn
                  flat dense round
                  icon="payments"
                  color="positive"
                  size="sm"
                  @click.stop="$emit('recordPayment', player.playerId)"
                >
                  <q-tooltip>{{ $t('cashbox.payments.recordPayment') }}</q-tooltip>
                </q-btn>
              </div>
            </q-item-section>
          </template>

          <!-- Expanded: player's fines and payments -->
          <q-card flat>
            <q-card-section class="q-pt-none">
              <div class="row q-col-gutter-sm q-mb-sm text-caption text-grey-7">
                <div class="col-4">{{ $t('cashbox.players.totalFined') }}: <strong class="text-negative">{{ player.totalFined }} {{ $t('cashbox.currency') }}</strong></div>
                <div class="col-4">{{ $t('cashbox.players.totalPaid') }}: <strong class="text-positive">{{ player.totalPaid }} {{ $t('cashbox.currency') }}</strong></div>
                <div class="col-4">{{ $t('cashbox.players.balance') }}: <strong :class="player.balance < 0 ? 'text-negative' : 'text-positive'">{{ player.balance }} {{ $t('cashbox.currency') }}</strong></div>
              </div>

              <q-list dense separator>
                <q-item v-for="item in getPlayerHistory(player.playerId)" :key="item.id" class="q-px-none">
                  <q-item-section avatar>
                    <q-icon
                      :name="item.type === 'fine' ? 'gavel' : 'payments'"
                      :color="item.type === 'fine' ? 'negative' : 'positive'"
                      size="xs"
                    />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label>
                      <template v-if="item.type === 'fine'">
                        {{ item.reason }}
                      </template>
                      <template v-else>
                        {{ item.note || $t('cashbox.payments.title') }}
                      </template>
                    </q-item-label>
                    <q-item-label caption>
                      {{ formatDate(item.createdAt) }}
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <span :class="item.type === 'fine' ? 'text-negative' : 'text-positive'" class="text-weight-medium">
                      {{ item.type === 'fine' ? '+' : '-' }}{{ item.amount }} {{ $t('cashbox.currency') }}
                    </span>
                  </q-item-section>
                  <q-item-section side v-if="isPowerUser">
                    <q-btn
                      flat dense round
                      icon="delete_outline"
                      color="grey"
                      size="xs"
                      @click="$emit(item.type === 'fine' ? 'deleteFine' : 'deletePayment', item.id)"
                    >
                      <q-tooltip>{{ item.type === 'fine' ? $t('cashbox.fines.deleteFine') : $t('cashbox.payments.delete') }}</q-tooltip>
                    </q-btn>
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card-section>
          </q-card>
        </q-expansion-item>
      </q-list>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, computed } from 'vue'
import { DateTime } from 'luxon'

const props = defineProps({
  playerBalances: { type: Array, required: true },
  fines: { type: Array, required: true },
  payments: { type: Array, required: true },
  isPowerUser: { type: Boolean, default: false },
  getPlayerName: { type: Function, required: true },
  currentUserUid: { type: String, default: null },
})

defineEmits(['addFine', 'recordPayment', 'deleteFine', 'deletePayment'])

const search = ref('')

const filteredBalances = computed(() => {
  if (!search.value) return props.playerBalances
  const term = search.value.toLowerCase()
  return props.playerBalances.filter((p) =>
    p.displayName.toLowerCase().includes(term)
  )
})

const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()
}

const getBalanceColor = (balance) => {
  if (balance < 0) return 'negative'
  if (balance > 0) return 'positive'
  return 'grey-5'
}

const formatDate = (date) => {
  if (!date) return ''
  const d = date?.seconds ? DateTime.fromSeconds(date.seconds) : DateTime.fromJSDate(new Date(date))
  return d.toFormat('d.M.yyyy')
}

const getPlayerHistory = (playerId) => {
  const playerFines = props.fines
    .filter((f) => f.playerId === playerId)
    .map((f) => ({ ...f, type: 'fine' }))

  const playerPayments = props.payments
    .filter((p) => p.playerId === playerId)
    .map((p) => ({ ...p, type: 'payment' }))

  return [...playerFines, ...playerPayments].sort((a, b) => {
    const dateA = a.createdAt?.seconds || 0
    const dateB = b.createdAt?.seconds || 0
    return dateB - dateA
  })
}
</script>

<style scoped>
.search-input {
  max-width: 220px;
}

.player-item :deep(.q-item) {
  min-height: 48px;
}
</style>
