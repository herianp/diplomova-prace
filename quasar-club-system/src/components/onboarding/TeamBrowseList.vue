<template>
  <div>
    <!-- Search input -->
    <q-input
      v-model="filterText"
      outlined
      dense
      debounce="300"
      :placeholder="$t('onboarding.teamBrowse.searchPlaceholder')"
      clearable
      class="q-mb-md"
    >
      <template v-slot:prepend>
        <q-icon name="search" />
      </template>
    </q-input>

    <!-- Loading state -->
    <div v-if="isLoading" class="flex flex-center q-pa-lg">
      <q-spinner color="primary" size="40px" />
    </div>

    <!-- Empty state: no teams available -->
    <q-banner v-else-if="allTeams.length === 0" class="bg-grey-2 rounded-borders">
      <template v-slot:avatar><q-icon name="groups" color="grey-6" /></template>
      {{ $t('onboarding.teamBrowse.noTeams') }}
    </q-banner>

    <!-- Empty state: no search results -->
    <q-banner v-else-if="filteredTeams.length === 0" class="bg-grey-2 rounded-borders">
      <template v-slot:avatar><q-icon name="search_off" color="grey-6" /></template>
      {{ $t('onboarding.teamBrowse.noResults') }}
    </q-banner>

    <!-- Teams list -->
    <q-list v-else bordered separator rounded>
      <q-item v-for="team in filteredTeams" :key="team.id" class="q-py-sm">
        <!-- Avatar icon -->
        <q-item-section avatar>
          <q-icon name="groups" color="primary" size="32px" />
        </q-item-section>

        <!-- Team info -->
        <q-item-section>
          <q-item-label>{{ team.name }}</q-item-label>
          <q-item-label caption>
            {{ $t('onboarding.teamBrowse.memberCount', { count: team.members.length }) }}
          </q-item-label>
        </q-item-section>

        <!-- Side: badge + action button -->
        <q-item-section side>
          <div class="row items-center q-gutter-xs">
            <!-- Already a member -->
            <template v-if="isUserMember(team.id)">
              <q-badge color="positive" :label="$t('onboarding.teamBrowse.memberBadge')" />
            </template>

            <!-- Pending request -->
            <template v-else-if="getUserPendingRequest(team.id)">
              <q-badge color="warning" :label="$t('onboarding.teamBrowse.pendingBadge')" />
              <q-btn
                flat
                dense
                round
                icon="close"
                color="warning"
                size="sm"
                @click="cancelRequest(getUserPendingRequest(team.id)?.id)"
              >
                <q-tooltip>{{ $t('onboarding.teamBrowse.cancelRequest') }}</q-tooltip>
              </q-btn>
            </template>

            <!-- Join button -->
            <template v-else>
              <q-btn
                flat
                dense
                color="primary"
                :label="$t('onboarding.teamBrowse.joinButton')"
                @click="confirmJoinRequest(team)"
              />
            </template>
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- Join confirmation dialog -->
    <q-dialog v-model="showConfirmDialog" persistent>
      <q-card style="min-width: 300px">
        <q-card-section>
          <div class="text-h6">{{ $t('onboarding.teamBrowse.confirmTitle') }}</div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ $t('onboarding.teamBrowse.confirmMessage', { teamName: selectedTeam?.name }) }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            flat
            :label="$t('onboarding.teamBrowse.confirmCancel')"
            @click="showConfirmDialog = false"
          />
          <q-btn
            color="primary"
            :label="$t('onboarding.teamBrowse.confirmSend')"
            :loading="isSending"
            @click="sendJoinRequest"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useJoinRequestUseCases } from '@/composable/useJoinRequestUseCases'
import { useTeamStore } from '@/stores/teamStore'

const $q = useQuasar()
const { t } = useI18n()
const teamStore = useTeamStore()
const joinRequestUseCases = useJoinRequestUseCases()

const filterText = ref('')
const allTeams = ref([])
const userRequests = ref([])
const isLoading = ref(true)
const isSending = ref(false)
const showConfirmDialog = ref(false)
const selectedTeam = ref(null)

let unsubscribeTeams = null
let unsubscribeRequests = null

onMounted(() => {
  unsubscribeTeams = joinRequestUseCases.setAllTeamsListener((teams) => {
    allTeams.value = teams
    isLoading.value = false
  })

  unsubscribeRequests = joinRequestUseCases.setUserJoinRequestsListener((requests) => {
    userRequests.value = requests
  })
})

onUnmounted(() => {
  if (unsubscribeTeams) unsubscribeTeams()
  if (unsubscribeRequests) unsubscribeRequests()
})

const filteredTeams = computed(() => {
  const filter = filterText.value.trim().toLowerCase()
  let teams = allTeams.value
  if (filter) {
    teams = teams.filter((team) => team.name.toLowerCase().includes(filter))
  }
  return [...teams].sort((a, b) => a.name.localeCompare(b.name))
})

const isUserMember = (teamId) => {
  return teamStore.teams.some((t) => t.id === teamId)
}

const getUserPendingRequest = (teamId) => {
  return userRequests.value.find((r) => r.teamId === teamId && r.status === 'pending')
}

const confirmJoinRequest = (team) => {
  selectedTeam.value = team
  showConfirmDialog.value = true
}

const sendJoinRequest = async () => {
  if (!selectedTeam.value) return

  const team = selectedTeam.value
  isSending.value = true
  try {
    await joinRequestUseCases.sendJoinRequest(team.id, team.name)
    showConfirmDialog.value = false
    selectedTeam.value = null
    $q.notify({
      type: 'positive',
      message: t('onboarding.teamBrowse.requestSent', { teamName: team.name }),
    })
  } catch (error) {
    showConfirmDialog.value = false
    const message =
      error instanceof Error ? error.message : t('onboarding.teamBrowse.requestSent', { teamName: team.name })
    $q.notify({
      type: 'negative',
      message,
    })
  } finally {
    isSending.value = false
  }
}

const cancelRequest = async (requestId) => {
  try {
    await joinRequestUseCases.cancelJoinRequest(requestId)
    $q.notify({
      type: 'positive',
      message: t('onboarding.teamBrowse.requestCancelled'),
    })
  } catch {
    $q.notify({
      type: 'negative',
      message: t('errors.unexpected'),
    })
  }
}
</script>
