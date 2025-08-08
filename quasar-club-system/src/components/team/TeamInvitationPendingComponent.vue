<template>
  <q-card v-if="props.pendingInvitations.length > 0" flat bordered class="bg-grey-1">
    <q-card-section class="bg-amber text-white">
      <div class="text-h6">
        <q-icon name="schedule" class="q-mr-sm" />
        {{ $t('team.single.pendingInvites.title') }}
      </div>
    </q-card-section>

    <q-card-section class="q-pa-md">
      <div v-for="invitation in props.pendingInvitations" :key="invitation.id" class="invitation-item q-mb-md">
        <div class="row items-center no-wrap">
          <div class="col">
            <div class="text-body1">{{ invitation.email }}</div>
            <div class="text-caption text-grey-6">
              {{ $t('team.single.pendingInvites.sentOn') }}: {{ formatDate(invitation.createdAt) }}
            </div>
          </div>
          <div class="col-auto">
            <q-btn
              flat
              round
              dense
              color="negative"
              icon="cancel"
              @click="handleCancelInvitation(invitation)"
              size="sm"
            >
              <q-tooltip>{{ $t('team.single.pendingInvites.cancel') }}</q-tooltip>
            </q-btn>
          </div>
        </div>
        <q-separator class="q-mt-sm" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { DateTime } from 'luxon'

const props = defineProps({
  pendingInvitations: {
    type: Array,
    required: true,
    default: () => []
  }
})

const emit = defineEmits([
  'cancelInvitation'
])

const formatDate = (date) => {
  return DateTime.fromJSDate(date.toDate()).toLocaleString(DateTime.DATETIME_SHORT)
}

const handleCancelInvitation = (invitation) => {
  emit('cancelInvitation', invitation)
}
</script>

<style scoped>
.invitation-item:last-child .q-separator {
  display: none;
}
</style>
