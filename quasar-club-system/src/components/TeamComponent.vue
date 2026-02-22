<template>
  <div class="teams-container">

    <!-- Join Request Management (power users only) -->
    <q-card v-if="isCurrentUserPowerUser" flat bordered class="q-mb-lg">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">
          <q-icon name="how_to_reg" class="q-mr-sm" />
          {{ $t('joinRequests.title') }}
        </div>
      </q-card-section>
      <q-card-section class="q-pa-none">
        <JoinRequestManagement />
      </q-card-section>
    </q-card>

    <!-- Browse Teams Section -->
    <q-card flat bordered class="q-mb-lg">
      <q-card-section class="bg-teal text-white">
        <div class="text-h6">
          <q-icon name="search" class="q-mr-sm" />
          {{ $t('onboarding.teamChoice.browseTitle') }}
        </div>
      </q-card-section>
      <q-card-section class="q-pa-none">
        <TeamBrowseList />
      </q-card-section>
    </q-card>

    <!-- Page Header -->
    <div class="row items-center justify-between q-mb-lg">
      <div class="col">
        <div class="text-h5 text-weight-bold">{{ $t('team.title') }}</div>
        <div class="text-body2 text-grey-7">{{ $t('team.teamOverview') }}</div>
      </div>
      <q-btn
        v-if="isCurrentUserPowerUser"
        color="primary"
        icon="add"
        :label="$t('team.create')"
        unelevated
        dense
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Empty State -->
    <div v-if="teams.length === 0" class="text-center q-py-xl">
      <q-icon name="groups" size="4rem" color="grey-4" />
      <div class="text-subtitle1 text-grey-6 q-mt-md">{{ $t('team.noTeams') }}</div>
    </div>

    <!-- Team Cards Grid -->
    <div v-else class="row q-col-gutter-sm items-stretch">
      <div
        v-for="team in teams"
        :key="team.id"
        class="col-12 col-sm-6 col-md-4"
      >
        <TeamCard :team="team" />
      </div>
    </div>

    <!-- Create Team Dialog -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 320px;">
        <q-card-section>
          <div class="text-h6">{{ $t('team.create') }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <q-input
            v-model="newTeamName"
            :label="$t('team.teamName')"
            filled
            dense
            autofocus
            @keyup.enter="handleCreateTeam"
          />
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat :label="$t('common.cancel')" color="grey-7" v-close-popup />
          <q-btn
            unelevated
            :label="$t('team.create')"
            color="primary"
            :disable="!newTeamName.trim()"
            :loading="isCreating"
            @click="handleCreateTeam"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import TeamCard from '@/components/new/TeamCard.vue'
import TeamBrowseList from '@/components/onboarding/TeamBrowseList.vue'
import JoinRequestManagement from '@/components/team/JoinRequestManagement.vue'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useTeamUseCases } from '@/composable/useTeamUseCases'
import { useTeamStore } from '@/stores/teamStore'
import { createLogger } from 'src/utils/logger'

const log = createLogger('TeamComponent')
const { isCurrentUserPowerUser, currentUser } = useAuthComposable()
const { createTeam } = useTeamUseCases()
const { teams } = storeToRefs(useTeamStore())

const showCreateDialog = ref(false)
const newTeamName = ref('')
const isCreating = ref(false)

const handleCreateTeam = async () => {
  if (!newTeamName.value.trim()) return
  isCreating.value = true
  try {
    await createTeam(newTeamName.value.trim(), currentUser.value.uid)
    newTeamName.value = ''
    showCreateDialog.value = false
  } catch (err) {
    log.error('Failed to create team', {
      error: err instanceof Error ? err.message : String(err),
      teamName: newTeamName.value.trim(),
      userId: currentUser.value.uid
    })
  } finally {
    isCreating.value = false
  }
}
</script>

<style scoped>
.teams-container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 600px) {
  .teams-container {
    padding: 1.5rem;
  }
}
</style>
