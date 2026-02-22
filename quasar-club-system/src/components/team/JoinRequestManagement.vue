<template>
  <div>
    <!-- Header -->
    <q-item-label header class="row items-center q-pb-xs">
      <span>{{ $t('joinRequests.title') }}</span>
      <q-badge v-if="pendingJoinRequests.length > 0" color="red" class="q-ml-sm">
        {{ pendingJoinRequests.length }}
      </q-badge>
    </q-item-label>

    <!-- Loading overlay during processing -->
    <div v-if="isProcessing" class="row justify-center q-py-md">
      <q-spinner color="primary" size="sm" />
    </div>

    <!-- Request list -->
    <q-list separator v-if="!isProcessing">
      <q-item
        v-for="request in pendingJoinRequests"
        :key="request.id"
        class="q-py-sm"
      >
        <!-- Avatar with first letter -->
        <q-item-section avatar>
          <q-avatar color="primary" text-color="white" size="36px">
            {{ (request.userDisplayName || request.userEmail || '?')[0].toUpperCase() }}
          </q-avatar>
        </q-item-section>

        <!-- User info -->
        <q-item-section>
          <q-item-label>{{ request.userDisplayName || request.userEmail }}</q-item-label>
          <q-item-label caption>{{ request.userEmail }}</q-item-label>
          <q-item-label caption class="text-primary">{{ request.teamName }}</q-item-label>
        </q-item-section>

        <!-- Approve / Decline actions -->
        <q-item-section side>
          <div class="row no-wrap q-gutter-xs">
            <q-btn
              flat
              dense
              round
              icon="check"
              color="positive"
              @click="approve(request)"
              :disable="isProcessing"
            >
              <q-tooltip>{{ $t('joinRequests.approve') }}</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              icon="close"
              color="negative"
              @click="decline(request)"
              :disable="isProcessing"
            >
              <q-tooltip>{{ $t('joinRequests.decline') }}</q-tooltip>
            </q-btn>
          </div>
        </q-item-section>
      </q-item>

      <!-- Empty state -->
      <q-item v-if="pendingJoinRequests.length === 0">
        <q-item-section>
          <q-item-label caption class="text-center q-py-sm">
            {{ $t('joinRequests.noRequests') }}
          </q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useQuasar } from 'quasar'
import { useTeamStore } from '@/stores/teamStore'
import { useJoinRequestUseCases } from '@/composable/useJoinRequestUseCases'
import { useI18n } from 'vue-i18n'

const $q = useQuasar()
const { t } = useI18n()
const teamStore = useTeamStore()
const { approveJoinRequest, declineJoinRequest } = useJoinRequestUseCases()

const isProcessing = ref(false)

const pendingJoinRequests = computed(() => teamStore.pendingJoinRequests)

const approve = async (request) => {
  isProcessing.value = true
  try {
    await approveJoinRequest(request)
    $q.notify({
      type: 'positive',
      message: t('joinRequests.approved', { name: request.userDisplayName }),
      timeout: 3000
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: t('joinRequests.approveError'),
      timeout: 3000
    })
  } finally {
    isProcessing.value = false
  }
}

const decline = async (request) => {
  isProcessing.value = true
  try {
    await declineJoinRequest(request)
    $q.notify({
      type: 'info',
      message: t('joinRequests.declined', { name: request.userDisplayName }),
      timeout: 3000
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: t('joinRequests.declineError'),
      timeout: 3000
    })
  } finally {
    isProcessing.value = false
  }
}
</script>
