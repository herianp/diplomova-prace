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
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  arrayUnion
} from 'firebase/firestore'
import { db } from '@/firebase/config.ts'

const authStore = useAuthStore()
const $q = useQuasar()
const { t } = useI18n()
const router = useRouter()

// State
const notifications = ref([])
const loading = ref(true)
const showDropdown = ref(false)
let unsubscribe = null

// Computed
const currentUser = computed(() => authStore.user)
const unreadCount = computed(() => notifications.value.filter(n => !n.read).length)
const hasUnread = computed(() => unreadCount.value > 0)

// Methods
const loadNotifications = () => {
  if (!currentUser.value?.uid) return

  // Clean up previous subscription
  if (unsubscribe) {
    unsubscribe()
  }

  const notificationsQuery = query(
    collection(db, 'notifications'),
    where('userId', '==', currentUser.value.uid),
    limit(10)
  )

  unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
    notifications.value = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })).sort((a, b) => {
      // Sort by createdAt descending (newest first)
      const aTime = a.createdAt?.seconds || 0
      const bTime = b.createdAt?.seconds || 0
      return bTime - aTime
    })
    loading.value = false
  }, (error) => {
    console.error('Error loading notifications:', error)
    loading.value = false
  })
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
    const batch = writeBatch(db)

    // Update the team invitation
    const invitationRef = doc(db, 'teamInvitations', notification.invitationId)
    batch.update(invitationRef, {
      status: response,
      respondedAt: new Date()
    })

    if (response === 'accepted') {
      // Add user to team
      const teamRef = doc(db, 'teams', notification.teamId)
      batch.update(teamRef, {
        members: arrayUnion(currentUser.value.uid)
      })
    }

    // Update notification
    const notificationRef = doc(db, 'notifications', notification.id)
    batch.update(notificationRef, {
      status: response,
      read: true
    })

    await batch.commit()

    $q.notify({
      type: response === 'accepted' ? 'positive' : 'info',
      message: response === 'accepted'
        ? t('notifications.invitation.accepted')
        : t('notifications.invitation.declined'),
      icon: response === 'accepted' ? 'check_circle' : 'cancel'
    })

  } catch (error) {
    console.error('Error responding to invitation:', error)
    $q.notify({
      type: 'negative',
      message: t('notifications.invitation.error'),
      icon: 'error'
    })
  }
}

const markAsRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      read: true,
      readAt: new Date()
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
  }
}

const markAllAsRead = async () => {
  try {
    const batch = writeBatch(db)
    const unreadNotifications = notifications.value.filter(n => !n.read)

    unreadNotifications.forEach(notification => {
      const notificationRef = doc(db, 'notifications', notification.id)
      batch.update(notificationRef, {
        read: true,
        readAt: new Date()
      })
    })

    await batch.commit()

    $q.notify({
      type: 'positive',
      message: t('notifications.allMarkedRead'),
      icon: 'check'
    })

  } catch (error) {
    console.error('Error marking all as read:', error)
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
watch(currentUser, (newUser) => {
  if (newUser?.uid) {
    loadNotifications()
  } else {
    notifications.value = []
    loading.value = false
  }
}, { immediate: true })

onMounted(() => {
  if (currentUser.value?.uid) {
    loadNotifications()
  }
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
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
