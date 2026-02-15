<template>
  <div class="notifications-dropdown">
    <q-btn
      flat
      round
      dense
      icon="notifications"
      :color="hasUnread ? 'amber' : 'white'"
      @click="toggleDropdown"
    >
      <!-- Notification Badge -->
      <q-badge
        v-if="unreadCount > 0"
        floating
        rounded
        color="red"
        :label="unreadCount > 99 ? '99+' : unreadCount"
      />
    </q-btn>

    <!-- Manual Dropdown Menu -->
    <div
      v-if="showDropdown"
      class="notification-popup"
      style="position: absolute; top: 100%; right: 0; z-index: 9999; background: white; border: 1px solid #ccc; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 400px;"
    >
      <div class="notifications-panel">
        <!-- Header -->
        <div class="notifications-header q-pa-md bg-grey-1">
          <div class="row items-center justify-between">
            <div class="text-h6 text-black">{{ $t('notifications.title') }}</div>
            <q-btn
              v-if="hasUnread"
              flat
              dense
              round
              icon="mark_email_read"
              color="primary"
              @click="markAllAsRead"
              size="sm"
            >
              <q-tooltip>{{ $t('notifications.markAllRead') }}</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" style="max-height: 400px; overflow-y: auto;">
          <div v-if="loading" class="text-center q-pa-md">
            <q-spinner-dots size="30px" color="primary" />
          </div>

          <div v-else-if="notifications.length === 0" class="text-center q-pa-xl text-grey-6">
            <q-icon name="notifications_none" size="3em" class="q-mb-md" />
            <div>{{ $t('notifications.empty') }}</div>
          </div>

          <div v-else>

            <div
              v-for="notification in notifications"
              :key="notification.id"
              class="notification-item q-pa-md cursor-pointer"
              :class="{ 'bg-blue-1': !notification.read }"
              @click="handleNotificationClick(notification)"
            >
              <div class="row items-start no-wrap">
                <div class="col-auto q-mr-md">
                  <q-icon
                    :name="getNotificationIcon(notification.type)"
                    :color="getNotificationColor(notification.type)"
                    size="md"
                  />
                </div>
                <div class="col">
                  <div class="text-body1 text-black q-mb-xs">{{ notification.title }}</div>
                  <div class="text-body2 text-grey-7 q-mb-sm">{{ notification.message }}</div>
                  <div class="text-caption text-grey-5">
                    {{ formatTimeAgo(notification.createdAt) }}
                  </div>
                </div>
                <div v-if="!notification.read" class="col-auto">
                  <q-icon name="circle" color="blue" size="xs" />
                </div>
              </div>

              <!-- Action Buttons for Team Invitations -->
              <div v-if="notification.type === 'team_invitation' && notification.status === 'pending'" class="q-mt-md">
                <q-separator class="q-mb-md" />
                <div class="row q-gutter-sm justify-end">
                  <q-btn
                    flat
                    dense
                    color="negative"
                    icon="close"
                    :label="$t('notifications.invitation.decline')"
                    @click.stop="handleInvitationResponse(notification, 'declined')"
                    size="sm"
                  />
                  <q-btn
                    flat
                    dense
                    color="positive"
                    icon="check"
                    :label="$t('notifications.invitation.accept')"
                    @click.stop="handleInvitationResponse(notification, 'accepted')"
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div v-if="notifications.length > 0" class="notifications-footer q-pa-md bg-grey-2">
          <div class="text-center">
            <q-btn
              flat
              dense
              color="primary"
              :label="$t('notifications.viewAll')"
              @click="$router.push('/notifications')"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAuthStore } from '@/stores/authStore.ts'
import { useReadiness } from '@/composable/useReadiness'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { useNotificationFirebase } from '@/services/notificationFirebase'
import { listenerRegistry } from '@/services/listenerRegistry'
import { createLogger } from 'src/utils/logger'

const log = createLogger('NotificationsDropdown')
const authStore = useAuthStore()
const $q = useQuasar()
const { t } = useI18n()
const router = useRouter()
const notificationFirebase = useNotificationFirebase()

// State
const notifications = ref([])
const loading = ref(true)
const showDropdown = ref(false)

// Computed
const currentUser = computed(() => authStore.user)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const hasUnread = computed(() => unreadCount.value > 0)

// Methods
const loadNotifications = async () => {
  const { waitForAuth } = useReadiness()
  await waitForAuth()

  if (!currentUser.value?.uid) {
    loading.value = false
    return
  }

  listenerRegistry.unregister('notifications')

  try {
    const unsubscribe = notificationFirebase.listenToNotifications(
      currentUser.value.uid,
      10,
      (notifs) => {
        notifications.value = notifs.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0
          const bTime = b.createdAt?.seconds || 0
          return bTime - aTime
        })
        loading.value = false
      },
      (error) => {
        log.error('Notification listener failed', {
          error: error instanceof Error ? error.message : String(error),
          userId: currentUser.value.uid
        })
        notifications.value = []
        loading.value = false
      }
    )

    listenerRegistry.register('notifications', unsubscribe, { userId: currentUser.value.uid })
  } catch (error) {
    log.error('Failed to setup notifications listener', {
      error: error instanceof Error ? error.message : String(error),
      userId: currentUser.value?.uid
    })
    notifications.value = []
    loading.value = false
  }
}

const handleNotificationClick = async (notification) => {
  // Mark as read if not already read
  if (!notification.read) {
    await markAsRead(notification.id)
  }

  // Handle navigation based on notification type
  switch (notification.type) {
    case 'team_invitation':
      // Already handled by action buttons
      break
    case 'survey_created':
      if (notification.surveyId) {
        // Close dropdown and navigate to survey page
        showDropdown.value = false
        router.push('/survey')
      }
      break
    default:
      break
  }
}

const handleInvitationResponse = async (notification, response) => {
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
  }
}

const markAsRead = async (notificationId) => {
  try {
    await notificationFirebase.markNotificationAsRead(notificationId)
  } catch (error) {
    log.error('Failed to mark notification as read', {
      error: error instanceof Error ? error.message : String(error),
      notificationId
    })
  }
}

const markAllAsRead = async () => {
  try {
    const unreadIds = notifications.value.filter(n => !n.read).map(n => n.id)
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

const getNotificationColor = (type) => {
  switch (type) {
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

const formatTimeAgo = (timestamp) => {
  const date = timestamp.toDate ? timestamp.toDate() : timestamp
  const dateTime = DateTime.fromJSDate(date)
  return dateTime.toRelative()
}

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

// Watch for user changes and reload notifications
watch(currentUser, (newUser, oldUser) => {
  if (newUser?.uid && newUser.uid !== oldUser?.uid) {
    loadNotifications()
  } else if (!newUser?.uid) {
    notifications.value = []
    loading.value = false
    listenerRegistry.unregister('notifications')
  }
})

onMounted(() => {
  loadNotifications()
})

onUnmounted(() => {
  listenerRegistry.unregister('notifications')
})
</script>

<style scoped>
.notifications-dropdown {
  position: relative;
  display: inline-block;
}

.notifications-panel {
  width: 400px;
  max-width: 90vw;
}

.notification-item {
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background-color: #f5f5f5;
}

.notification-item:last-child {
  border-bottom: none;
}

@media (max-width: 600px) {
  .notifications-panel {
    width: 350px;
  }
}
</style>
