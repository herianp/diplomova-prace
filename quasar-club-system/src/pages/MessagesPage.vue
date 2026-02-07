<template>
  <div class="messages-page q-pa-lg">
    <!-- Header -->
    <div class="page-header q-mb-lg">
      <h2 v-if="!isMobile" class="text-center q-ma-none q-pa-none">
        {{ $t('messages.title') }}
      </h2>
      <div v-if="currentTeam" class="text-center text-grey-6 q-mt-sm">
        {{ currentTeam.name }} - {{ $t('messages.teamChat') }}
      </div>
    </div>

    <!-- No Team Selected -->
    <div v-if="!currentTeam" class="no-team text-center q-pa-xl">
      <q-icon name="groups" size="4em" color="grey-4" class="q-mb-md" />
      <div class="text-h5 text-grey-6 q-mb-sm">{{ $t('messages.noTeam') }}</div>
      <div class="text-body2 text-grey-5">{{ $t('messages.selectTeamFirst') }}</div>
    </div>

    <!-- Messages Container -->
    <div v-else class="messages-container">
      <!-- Messages List -->
      <div class="messages-list q-mb-lg" ref="messagesContainer">
        <q-card flat bordered class="messages-card">
          <q-card-section class="messages-content" style="height: 400px; overflow-y: auto;">
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

            <!-- Messages -->
            <div v-else class="messages-list-content">
              <div
                v-for="message in messages"
                :key="message.id"
                class="message-item q-mb-md"
                :class="{ 'own-message': message.authorId === currentUser?.uid }"
              >
                <div class="message-bubble">
                  <div class="message-header row items-center q-mb-xs">
                    <div class="message-author text-weight-medium">{{ message.authorName }}</div>
                    <div class="message-time text-caption text-grey-6 q-ml-auto">
                      {{ formatDateTime(message.createdAt) }}
                    </div>
                  </div>
                  <div class="message-content text-body1">{{ message.content }}</div>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Message Input (Only for Power Users) -->
      <div v-if="isPowerUser" class="message-input">
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
                  @click="sendMessage"
                  :loading="sending"
                  :disable="!newMessage.trim()"
                  unelevated
                />
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- Non-Power User Info -->
      <div v-else class="no-permission q-mt-md">
        <q-banner rounded class="bg-blue-1 text-blue-8">
          <template v-slot:avatar>
            <q-icon name="info" />
          </template>
          {{ $t('messages.powerUserOnly') }}
        </q-banner>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useScreenComposable } from '@/composable/useScreenComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { DateTime } from 'luxon'
import { useMessageFirebase } from '@/services/messageFirebase'
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const teamStore = useTeamStore()
const { isMobile } = useScreenComposable()
const { currentUser } = useAuthComposable()
const $q = useQuasar()
const { t } = useI18n()
const messageFirebase = useMessageFirebase()

// State
const messages = ref([])
const newMessage = ref('')
const loading = ref(true)
const sending = ref(false)
const messagesContainer = ref(null)
let unsubscribe = null

// Computed
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() =>
  currentTeam.value?.powerusers?.includes(currentUser.value?.uid)
)

// Methods
const loadMessages = () => {
  if (!currentTeam.value?.id) {
    loading.value = false
    return
  }

  // Clean up previous subscription
  if (unsubscribe) {
    unsubscribe()
  }

  unsubscribe = messageFirebase.listenToMessages(
    currentTeam.value.id,
    100,
    (msgs) => {
      messages.value = msgs.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0
        const bTime = b.createdAt?.seconds || 0
        return aTime - bTime
      })
      loading.value = false

      nextTick(() => {
        scrollToBottom()
      })
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
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentTeam.value?.id || !isPowerUser.value) {
    return
  }

  sending.value = true

  try {
    await messageFirebase.sendMessage(
      currentTeam.value?.id,
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
    console.error('Error sending message:', error)
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
    // Allow new line with Shift+Enter
    return
  }
  // Send message with Enter
  sendMessage()
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    const scrollElement = messagesContainer.value.querySelector('.messages-content')
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight
    }
  }
}

const formatDateTime = (timestamp) => {
  if (!timestamp) return ''
  const date = timestamp.toDate ? timestamp.toDate() : timestamp
  const dateTime = DateTime.fromJSDate(date)
  return dateTime.toLocaleString(DateTime.DATETIME_SHORT)
}

// Watch for team changes
const stopWatching = teamStore.$subscribe(() => {
  loadMessages()
})

onMounted(() => {
  if (currentTeam.value?.id) {
    loadMessages()
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
  if (stopWatching) {
    stopWatching()
  }
})
</script>

<style scoped>
.messages-page {
  max-width: 800px;
  margin: 0 auto;
}

.messages-card {
  background: #fafafa;
}

.messages-content {
  background: white;
}

.message-item {
  display: flex;
}

.message-item:not(.own-message) {
  justify-content: flex-start;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  background: #e3f2fd;
  border: 1px solid #bbdefb;
}

.own-message .message-bubble {
  background: #1976d2;
  color: white;
  border-color: #1565c0;
}

.own-message .message-author {
  color: rgba(255, 255, 255, 0.9);
}

.own-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-author {
  font-size: 0.875rem;
  color: #1976d2;
}

.message-time {
  font-size: 0.75rem;
}

.message-content {
  word-wrap: break-word;
  white-space: pre-wrap;
}

.no-team,
.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 768px) {
  .messages-page {
    padding: 1rem;
  }

  .message-bubble {
    max-width: 85%;
  }
}
</style>
