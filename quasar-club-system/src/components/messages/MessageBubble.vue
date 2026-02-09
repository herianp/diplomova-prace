<template>
  <div class="message-item q-mb-md" :class="{ 'own-message': isOwnMessage }">
    <!-- Avatar for other people's messages (left side) -->
    <q-avatar
      v-if="!isOwnMessage"
      size="32px"
      color="primary"
      text-color="white"
      class="message-avatar text-weight-bold"
    >
      {{ initial }}
    </q-avatar>

    <div class="message-bubble">
      <div class="message-header row items-center q-mb-xs">
        <div class="message-author text-weight-medium">{{ message.authorName }}</div>
        <div class="message-time text-caption q-ml-auto">
          {{ formattedTime }}
        </div>
      </div>
      <div class="message-content text-body1">{{ message.content }}</div>
    </div>

    <!-- Avatar for own messages (right side) -->
    <q-avatar
      v-if="isOwnMessage"
      size="32px"
      color="blue-8"
      text-color="white"
      class="message-avatar text-weight-bold"
    >
      {{ initial }}
    </q-avatar>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { DateTime } from 'luxon'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  message: {
    type: Object,
    required: true
  },
  isOwnMessage: {
    type: Boolean,
    default: false
  }
})

const { t } = useI18n()

const initial = computed(() => {
  const name = props.message.authorName || ''
  return name.charAt(0).toUpperCase() || '?'
})

const formattedTime = computed(() => {
  const timestamp = props.message.createdAt
  if (!timestamp) return ''

  const date = timestamp.toDate ? timestamp.toDate() : (timestamp instanceof Date ? timestamp : new Date(timestamp.seconds * 1000))
  const dt = DateTime.fromJSDate(date)
  const now = DateTime.now()

  if (dt.hasSame(now, 'day')) {
    return dt.toFormat('HH:mm')
  } else if (dt.hasSame(now.minus({ days: 1 }), 'day')) {
    return `${t('messages.yesterday')} ${dt.toFormat('HH:mm')}`
  } else {
    return dt.toFormat('d MMM HH:mm')
  }
})
</script>

<style scoped>
.message-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.message-item:not(.own-message) {
  justify-content: flex-start;
}

.message-item.own-message {
  justify-content: flex-end;
}

.message-avatar {
  flex-shrink: 0;
  margin-top: 4px;
  font-size: 0.8rem;
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

.message-author {
  font-size: 0.875rem;
  color: #1976d2;
}

.own-message .message-author {
  color: rgba(255, 255, 255, 0.9);
}

.message-time {
  font-size: 0.75rem;
  color: #9e9e9e;
}

.own-message .message-time {
  color: rgba(255, 255, 255, 0.7);
}

.message-content {
  word-wrap: break-word;
  white-space: pre-wrap;
}

@media (max-width: 768px) {
  .message-bubble {
    max-width: 85%;
  }
}
</style>
