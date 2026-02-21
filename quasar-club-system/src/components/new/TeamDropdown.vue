<template>
  <q-btn-dropdown
    dense
    :label="currentTeam?.name || $t('team.selectTeam')"
    icon="groups"
    class="min-w-150"
  >
    <q-list>
      <!-- Team Selection -->
      <q-item-label header>{{ $t('team.switchTeam') }}</q-item-label>

      <q-item
        v-for="team in userTeams"
        :key="team.id"
        clickable
        v-close-popup
        @click="selectTeam(team)"
        :active="currentTeam?.id === team.id"
      >
        <q-item-section avatar>
          <q-icon :name="currentTeam?.id === team.id ? 'radio_button_checked' : 'radio_button_unchecked'" :color="currentTeam?.id === team.id ? 'primary' : 'grey'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ team.name }}</q-item-label>
          <q-item-label caption>{{ getTeamMemberCount(team) }} {{ $t('team.members') }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator v-if="currentTeam" />

      <!-- Team Management -->
      <q-item
        v-if="currentTeam && isCurrentUserPowerUser"
        clickable
        v-close-popup
        @click="manageCurrentTeam"
      >
        <q-item-section avatar>
          <q-icon name="settings" color="primary" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('team.manage') }}</q-item-label>
          <q-item-label caption>{{ $t('team.manageDescription') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { useTeamStore } from '@/stores/teamStore.ts'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases.ts'
import { listenerRegistry } from '@/services/listenerRegistry'

const teamStore = useTeamStore()
const router = useRouter()

const userTeams = computed(() => teamStore.teams)
const currentTeam = computed(() => teamStore.currentTeam)
const { isCurrentUserPowerUser } = useAuthComposable()
const { setSurveysListener } = useSurveyUseCases()

const selectTeam = (team) => {
  // Clean up all team-scoped listeners before switching
  // PRF-03: Verified - team-scoped listeners cleaned up before switching teams
  // Prevents memory accumulation from accumulated listeners (Phase 06)
  listenerRegistry.unregisterByScope('team')

  teamStore.currentTeam = team
  setSurveysListener(team.id)
}

const manageCurrentTeam = () => {
  if (currentTeam.value?.id) {
    router.push(`/team/${currentTeam.value.id}`)
  }
}

const getTeamMemberCount = (team) => {
  return team.members?.length || 0
}
</script>
