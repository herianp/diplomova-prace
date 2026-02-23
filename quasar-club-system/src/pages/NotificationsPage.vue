<template>
  <div class="notifications-page q-pa-lg">
    <div class="page-header q-mb-lg">
      <h2 v-if="!isMobile" class="text-center q-ma-none q-pa-none">{{ $t('notifications.title') }}</h2>

      <!-- Stats Bar -->
      <div class="stats-bar q-mt-md">
        <div class="row q-gutter-md justify-center">
          <div class="col-auto">
            <q-chip color="primary" text-color="white" icon="notifications">
              {{ $t('notifications.total') }}: {{ notifications.length }}
            </q-chip>
          </div>
          <div class="col-auto">
            <q-chip color="red" text-color="white" icon="circle">
              {{ $t('notifications.unread') }}: {{ unreadCount }}
            </q-chip>
          </div>
          <div class="col-auto">
            <q-chip color="green" text-color="white" icon="check_circle">
              {{ $t('notifications.read') }}: {{ readCount }}
            </q-chip>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions Bar -->
    <div class="actions-bar q-mb-lg">
      <div class="row q-gutter-md items-center">
        <div class="col">
          <!-- Filter Buttons -->
          <q-btn-toggle
            v-model="filter"
            spread
            no-caps
            rounded
            unelevated
            toggle-color="primary"
            color="grey-3"
            text-color="grey-8"
            :options="filterOptions"
          />
        </div>
        <div class="col-auto">
          <!-- Mark All Read Button -->
          <q-btn
            v-if="unreadCount > 0"
            color="positive"
            icon="mark_email_read"
            :label="$t('notifications.markAllRead')"
            @click="markAllAsRead"
            :loading="markingAllRead"
          />
          <!-- Refresh Button -->
          <q-btn
            flat
            round
            dense
            icon="refresh"
            color="grey-7"
            @click="refreshNotifications"
            :loading="refreshing"
            class="q-ml-sm"
          >
            <q-tooltip>{{ $t('notifications.refresh') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
    </div>

    <!-- Notifications List -->
    <div class="notifications-container">
      <div v-if="loading" class="text-center q-pa-xl">
        <q-spinner-dots size="50px" color="primary" />
        <div class="text-h6 q-mt-md text-grey-6">{{ $t('notifications.loading') }}</div>
      </div>

      <div v-else-if="filteredNotifications.length === 0" class="empty-state text-center q-pa-xl">
        <q-icon name="notifications_none" size="6em" color="grey-4" class="q-mb-md" />
        <div class="text-h5 text-grey-6 q-mb-sm">
          {{ filter === 'all' ? $t('notifications.empty') : $t('notifications.emptyFiltered') }}
        </div>
        <div class="text-body2 text-grey-5">
          {{ filter === 'all' ? $t('notifications.emptyDescription') : $t('notifications.emptyFilteredDescription') }}
        </div>
      </div>

      <div v-else class="notifications-list">
        <q-timeline color="primary">
          <q-timeline-entry
            v-for="notification in filteredNotifications"
            :key="notification.id"
            :color="getNotificationColor(notification)"
            :icon="getNotificationIcon(notification.type)"
            side="right"
          >
            <template v-slot:title>
              <div class="notification-header row items-center no-wrap">
                <div class="col">
                  <div class="text-h6 text-black">{{ getNotificationTitle(notification) }}</div>
                  <div class="text-caption text-grey-6">
                    {{ formatDateTime(notification.createdAt) }}
                  </div>
                </div>
                <div class="col-auto q-ml-md">
                  <q-chip
                    v-if="!notification.read"
                    dense
                    color="red"
                    text-color="white"
                    :label="$t('notifications.unread')"
                    size="sm"
                  />
                  <q-btn
                    v-if="!notification.read"
                    flat
                    round
                    dense
                    icon="visibility"
                    color="grey-7"
                    size="sm"
                    @click="markAsRead(notification)"
                    class="q-ml-xs"
                  >
                    <q-tooltip>{{ $t('notifications.markRead') }}</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </template>
            
            <template v-slot:default>
              <q-card 
                flat 
                bordered 
                class="notification-card cursor-pointer" 
                @click="handleNotificationClick(notification)"
              >
                <q-card-section class="q-pa-md">
                  <div class="text-body1 q-mb-md">{{ getNotificationMessage(notification) }}</div>

                  <!-- Team Invitation Actions -->
                  <div v-if="notification.type === 'team_invitation' && notification.status === 'pending'" class="invitation-actions" @click.stop>
                      <q-separator class="q-mb-md" />
                      <div class="text-body2 text-grey-7 q-mb-md">
                        {{ $t('notifications.invitation.actionRequired') }}
                      </div>
                      <div class="row q-gutter-sm">
                        <q-btn
                          color="negative"
                          icon="close"
                          :label="$t('notifications.invitation.decline')"
                          @click="handleInvitationResponse(notification, 'declined')"
                          :loading="respondingTo === notification.id"
                          outline
                        />
                        <q-btn
                          color="positive"
                          icon="check"
                          :label="$t('notifications.invitation.accept')"
                          @click="handleInvitationResponse(notification, 'accepted')"
                          :loading="respondingTo === notification.id"
                          unelevated
                        />
                      </div>
                    </div>

                    <!-- Responded Invitation Status -->
                    <div v-else-if="notification.type === 'team_invitation' && notification.status !== 'pending'" class="invitation-status">
                      <q-separator class="q-mb-md" />
                      <q-chip
                        :color="notification.status === 'accepted' ? 'positive' : 'negative'"
                        text-color="white"
                        :icon="notification.status === 'accepted' ? 'check_circle' : 'cancel'"
                        :label="notification.status === 'accepted'
                          ? $t('notifications.invitation.accepted')
                          : $t('notifications.invitation.declined')"
                      />
                    </div>
                  </q-card-section>
                </q-card>
              </template>
          </q-timeline-entry>
        </q-timeline>
      </div>

      <!-- Load More Button -->
      <div v-if="hasMore && !loading" class="text-center q-pa-lg">
        <q-btn
          color="primary"
          :label="$t('notifications.loadMore')"
          @click="loadMoreNotifications"
          :loading="loadingMore"
          outline
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/authStore.ts'
import { useScreenComposable } from '@/composable/useScreenComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { useNotificationFirebase } from '@/services/notificationFirebase'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'

const log = createLogger('NotificationsPage')
const authStore = useAuthStore()
const { isMobile } = useScreenComposable()
const $q = useQuasar()
const { t } = useI18n()
const router = useRouter()
const notificationFirebase = useNotificationFirebase()

// State
const notifications = ref([])
const loading = ref(true)
const refreshing = ref(false)
const markingAllRead = ref(false)
const loadingMore = ref(false)
const respondingTo = ref(null)
const filter = ref('all')
const hasMore = ref(true)
const pageSize = 20
let lastDoc = null

// Computed
const currentUser = computed(() => authStore.user)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const readCount = computed(() => notifications.value.filter(n => n.read).length)

const filterOptions = computed(() => [
  { label: t('notifications.filters.all'), value: 'all' },
  { label: t('notifications.filters.unread'), value: 'unread' },
  { label: t('notifications.filters.invitations'), value: 'team_invitation' },
  { label: t('notifications.filters.surveys'), value: 'survey_created' }
])

const filteredNotifications = computed(() => {
  let filtered = [...notifications.value]

  switch (filter.value) {
    case 'unread':
      filtered = filtered.filter(n => !n.read)
      break
    case 'team_invitation':
      filtered = filtered.filter(n => n.type === 'team_invitation')
      break
    case 'survey_created':
      filtered = filtered.filter(n => n.type === 'survey_created')
      break
    default: // 'all'
      break
  }

  return filtered.sort((a, b) => {
    const aTime = a.createdAt?.seconds || 0
    const bTime = b.createdAt?.seconds || 0
    return bTime - aTime
  })
})

// Methods
const loadNotifications = () => {
  if (!currentUser.value?.uid) return

  listenerRegistry.unregister('notifications')

  const unsubscribe = notificationFirebase.listenToNotifications(
    currentUser.value.uid,
    pageSize,
    (notifs, last) => {
      notifications.value = notifs
      lastDoc = last
      hasMore.value = notifs.length === pageSize
      loading.value = false
    },
    (error) => {
      log.error('Notification listener failed', {
        error: error instanceof Error ? error.message : String(error),
        userId: currentUser.value.uid
      })
      loading.value = false
    }
  )

  listenerRegistry.register('notifications', unsubscribe, { userId: currentUser.value.uid })
}

const loadMoreNotifications = async () => {
  // PRF-04: Verified - pagination stops when hasMore is false
  // Button hidden via v-if="hasMore", guard prevents redundant Firestore queries (Phase 06)
  if (!lastDoc || !hasMore.value) return

  loadingMore.value = true

  try {
    const result = await notificationFirebase.loadMoreNotifications(
      currentUser.value.uid,
      lastDoc,
      pageSize
    )

    notifications.value.push(...result.notifications)
    lastDoc = result.lastDoc
    hasMore.value = result.hasMore

  } catch (error) {
    log.error('Failed to load more notifications', {
      error: error instanceof Error ? error.message : String(error),
      userId: currentUser.value.uid
    })
    $q.notify({
      type: 'negative',
      message: t('notifications.loadMoreError'),
      icon: 'error'
    })
  } finally {
    loadingMore.value = false
  }
}

const refreshNotifications = async () => {
  refreshing.value = true
  notifications.value = []
  lastDoc = null
  hasMore.value = true
  await loadNotifications()
  refreshing.value = false
}

const markAsRead = async (notification) => {
  if (notification.read) return

  try {
    await notificationFirebase.markNotificationAsRead(notification.id)
  } catch (error) {
    log.error('Failed to mark notification as read', {
      error: error instanceof Error ? error.message : String(error),
      notificationId: notification.id
    })
  }
}

const markAllAsRead = async () => {
  markingAllRead.value = true

  const unreadIds = notifications.value.filter(n => !n.read).map(n => n.id)

  try {
    await notificationFirebase.markAllNotificationsAsRead(unreadIds)

    $q.notify({
      type: 'positive',
      message: t('notifications.allMarkedRead'),
      icon: 'check'
    })

  } catch (error) {
    log.error('Failed to mark all as read', {
      error: error instanceof Error ? error.message : String(error),
      count: unreadIds.length
    })
    $q.notify({
      type: 'negative',
      message: t('notifications.markReadError'),
      icon: 'error'
    })
  } finally {
    markingAllRead.value = false
  }
}

const handleInvitationResponse = async (notification, response) => {
  respondingTo.value = notification.id

  try {
    await notificationFirebase.respondToInvitation(notification, response, currentUser.value.uid)

    $q.notify({
      type: response === 'accepted' ? 'positive' : 'info',
      message: response === 'accepted'
        ? t('notifications.invitation.accepted')
        : t('notifications.invitation.declined'),
      icon: response === 'accepted' ? 'check_circle' : 'cancel'
    })

  } catch (error) {
    log.error('Failed to respond to invitation', {
      error: error instanceof Error ? error.message : String(error),
      notificationId: notification.id,
      response
    })
    $q.notify({
      type: 'negative',
      message: t('notifications.invitation.error'),
      icon: 'error'
    })
  } finally {
    respondingTo.value = null
  }
}

const handleNotificationClick = async (notification) => {
  // Mark as read if not already read
  if (!notification.read) {
    await markAsRead(notification)
  }

  // Handle navigation based on notification type
  switch (notification.type) {
    case 'team_invitation':
      // Team invitations are handled by action buttons, don't navigate
      break
    case 'survey_created':
      if (notification.surveyId) {
        // Navigate to survey page
        router.push('/survey')
      }
      break
    default:
      break
  }
}

const getNotificationTitle = (notification) => {
  switch (notification.type) {
    case 'team_invitation':
      if (notification.teamName) {
        return t('notifications.invitation.title', { teamName: notification.teamName })
      }
      return notification.title
    case 'survey_created':
      return t('notifications.survey.title')
    default:
      return notification.title
  }
}

const getNotificationMessage = (notification) => {
  switch (notification.type) {
    case 'team_invitation':
      if (notification.teamName && notification.inviterName) {
        return t('notifications.invitation.message', { inviterName: notification.inviterName, teamName: notification.teamName })
      }
      return notification.message
    case 'survey_created':
      if (notification.surveyType) {
        const surveyTypeLabel = t(`survey.type.${notification.surveyType}`)
        return t('notifications.survey.message', { type: surveyTypeLabel })
      }
      return notification.message
    default:
      return notification.message
  }
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'team_invitation':
      return 'group_add'
    case 'survey_created':
      return 'poll'
    case 'survey_reminder':
      return 'schedule'
    default:
      return 'notifications'
  }
}

const getNotificationColor = (notification) => {
  if (!notification.read) return 'red'

  switch (notification.type) {
    case 'team_invitation':
      return 'blue'
    case 'survey_created':
      return 'green'
    case 'survey_reminder':
      return 'orange'
    default:
      return 'grey'
  }
}

const formatDateTime = (timestamp) => {
  const date = timestamp.toDate ? timestamp.toDate() : timestamp
  const dateTime = DateTime.fromJSDate(date)
  return dateTime.toLocaleString(DateTime.DATETIME_MED)
}

onMounted(() => {
  if (currentUser.value?.uid) {
    loadNotifications()
  }
})

onUnmounted(() => {
  listenerRegistry.unregister('notifications')
})
</script>

<style scoped>
.notifications-page {
  max-width: 1000px;
  margin: 0 auto;
}

.stats-bar .q-chip {
  font-weight: 500;
}

.notification-card {
  background: #fafafa;
  transition: box-shadow 0.2s ease;
}

.notification-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.invitation-actions {
  background: rgba(25, 118, 210, 0.05);
  padding: 1rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.invitation-status {
  background: rgba(76, 175, 80, 0.05);
  padding: 0.5rem;
  border-radius: 8px;
  margin-top: 0.5rem;
}

.empty-state {
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (max-width: 768px) {
  .notifications-page {
    padding: 1rem;
  }

  .stats-bar .row {
    flex-direction: column;
  }

  .actions-bar .row {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
