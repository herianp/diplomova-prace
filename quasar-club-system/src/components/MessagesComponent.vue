<template>
  <div class="messages-container">
    <!-- Loading Skeleton -->
    <template v-if="!currentTeam">
      <div class="q-mb-md">
        <q-skeleton type="text" width="50%" class="q-mb-xs" />
        <q-skeleton type="text" width="30%" />
      </div>
      <q-card flat bordered class="q-pa-md">
        <q-skeleton type="rect" height="400px" />
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
              {{ $t('messages.teamChat') }}
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
              icon="chat"
              :label="messages.length + ' ' + $t('messages.messagesCount')"
              dense
            />
          </div>
        </div>
      </div>

      <!-- Messages Card -->
      <q-card flat bordered class="messages-card">
        <q-card-section
          ref="scrollArea"
          class="messages-scroll-area"
          @scroll="onScroll"
        >
          <!-- Loading State -->
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner-dots size="30px" color="primary" />
            <div class="text-body2 text-grey-6 q-mt-sm">{{ $t('messages.loading') }}</div>
          </div>

          <!-- Empty State -->
          <div v-else-if="messages.length === 0" class="empty-state text-center q-pa-xl">
            <q-icon name="chat_bubble_outline" size="3em" color="grey-4" class="q-mb-md" />
            <div class="text-body1 text-grey-6">{{ $t('messages.noMessages') }}</div>
            <div class="text-body2 text-grey-5 q-mt-sm">{{ $t('messages.startConversation') }}</div>
          </div>

          <!-- Messages with Date Separators -->
          <template v-else>
            <template v-for="item in messagesWithSeparators" :key="item.key">
              <MessageDateSeparator
                v-if="item.type === 'separator'"
                :date="item.dateLabel"
              />
              <MessageBubble
                v-else
                :message="item.message"
                :is-own-message="item.message.authorId === currentUser?.uid"
              />
            </template>
          </template>
        </q-card-section>

        <!-- Scroll-to-bottom FAB -->
        <q-btn
          v-show="showScrollButton"
          fab-mini
          color="primary"
          icon="keyboard_arrow_down"
          class="scroll-to-bottom-btn"
          @click="scrollToBottom"
        />
      </q-card>

      <!-- Message Input (Power Users Only) -->
      <div v-if="isPowerUser" class="message-input q-mt-md">
        <q-card flat bordered>
          <q-card-section class="q-pa-md">
            <div class="row q-gutter-md items-end">
              <div class="col">
                <q-input
                  v-model="newMessage"
                  type="textarea"
                  :placeholder="$t('messages.typeMessage')"
                  outlined
                  autogrow
                  :rows="1"
                  :max-height="100"
                  @keydown.enter.prevent="handleKeyPress"
                />
              </div>
              <div class="col-auto">
                <q-btn
                  color="primary"
                  icon="send"
                  :label="$t('messages.send')"
                  @click="sendNewMessage"
                  :loading="sending"
                  :disable="!newMessage.trim()"
                  unelevated
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Non-Power User Banner -->
      <div v-else class="no-permission q-mt-md">
        <q-banner rounded class="bg-blue-1 text-blue-8">
          <template v-slot:avatar>
            <q-icon name="info" />
          </template>
          {{ $t('messages.powerUserOnly') }}
        </q-banner>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useReadiness } from '@/composable/useReadiness'
import { useMessageFirebase } from '@/services/messageFirebase'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import MessageBubble from '@/components/messages/MessageBubble.vue'
import MessageDateSeparator from '@/components/messages/MessageDateSeparator.vue'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'

const log = createLogger('MessagesComponent')
const teamStore = useTeamStore()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { waitForTeam } = useReadiness()
const messageFirebase = useMessageFirebase()
const $q = useQuasar()
const { t } = useI18n()

// State
const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const scrollArea = ref(null)
const showScrollButton = ref(false)

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() =>
  currentTeam.value?.powerusers?.includes(currentUser.value?.uid)
)

// Messages with date separators injected
const messagesWithSeparators = computed(() => {
  const result = []
  let lastDateStr = ''

  for (const msg of messages.value) {
    const msgDate = msg.createdAt?.toDate
      ? msg.createdAt.toDate()
      : (msg.createdAt instanceof Date ? msg.createdAt : new Date((msg.createdAt?.seconds || 0) * 1000))
    const dt = DateTime.fromJSDate(msgDate)
    const dateStr = dt.toISODate()

    if (dateStr !== lastDateStr) {
      const now = DateTime.now()
      let label
      if (dt.hasSame(now, 'day')) {
        label = t('messages.today')
      } else if (dt.hasSame(now.minus({ days: 1 }), 'day')) {
        label = t('messages.yesterday')
      } else {
        label = dt.toLocaleString(DateTime.DATE_FULL)
      }
      result.push({ type: 'separator', dateLabel: label, key: `sep-${dateStr}` })
      lastDateStr = dateStr
    }

    result.push({ type: 'message', message: msg, key: msg.id })
  }
  return result
})

// Scroll handling
const onScroll = (event) => {
  const el = event.target
  const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
  showScrollButton.value = distanceFromBottom > 200
}

const scrollToBottom = (smooth = true) => {
  const el = scrollArea.value?.$el || scrollArea.value
  if (el) {
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
  }
}

// Message loading
const loadMessages = () => {
  if (!currentTeam.value?.id) {
    loading.value = false
    return
  }

  listenerRegistry.unregister('messages')

  const unsubscribe = messageFirebase.listenToMessages(
    currentTeam.value.id,
    100,
    (msgs) => {
      // Check if user is near bottom before updating
      const el = scrollArea.value?.$el || scrollArea.value
      const wasNearBottom = !el || (el.scrollHeight - el.scrollTop - el.clientHeight < 200)

      messages.value = msgs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return aTime - bTime
      })
      loading.value = false

      // Only auto-scroll if user was already near bottom
      if (wasNearBottom) {
        nextTick(() => {
          scrollToBottom(false)
        })
      }
    },
    () => {
      loading.value = false
      $q.notify({
        type: 'negative',
        message: t('messages.loadError'),
        icon: 'error'
      })
    }
  )

  listenerRegistry.register('messages', unsubscribe, { teamId: currentTeam.value.id })
}

// Send message
const sendNewMessage = async () => {
  if (!newMessage.value.trim() || !currentTeam.value?.id || !isPowerUser.value) {
    return
  }

  sending.value = true

  try {
    await messageFirebase.sendMessage(
      currentTeam.value.id,
      currentUser.value?.uid,
      currentUser.value?.displayName || currentUser.value?.email,
      newMessage.value.trim()
    )

    newMessage.value = ''

    $q.notify({
      type: 'positive',
      message: t('messages.sent'),
      icon: 'check',
      timeout: 1000
    })
  } catch (error) {
    log.error('Failed to send message', {
      error: error instanceof Error ? error.message : String(error),
      teamId: currentTeam.value?.id,
      authorId: currentUser.value?.uid
    })
    $q.notify({
      type: 'negative',
      message: t('messages.sendError'),
      icon: 'error'
    })
  } finally {
    sending.value = false
  }
}

const handleKeyPress = (event) => {
  if (event.shiftKey) {
    return
  }
  sendNewMessage()
}

// Watch for team changes
watch(currentTeam, (newTeam) => {
  if (newTeam) {
    loadMessages()
  }
})

onMounted(async () => {
  await waitForTeam()
  loadMessages()
})

onUnmounted(() => {
  listenerRegistry.unregister('messages')
})
</script>

<style scoped>
.messages-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .messages-container {
    padding: 1.5rem;
  }
}

.messages-card {
  position: relative;
  max-width: 800px;
}

.messages-scroll-area {
  max-height: 60vh;
  overflow-y: auto;
  background: white;
}

.scroll-to-bottom-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 1;
  opacity: 0.9;
}

.message-input {
  max-width: 800px;
}

.no-permission {
  max-width: 800px;
}

.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
</style>
