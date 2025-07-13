<template>
  <q-btn-dropdown
    flat
    dense
    :label="currentTeam?.name || $t('team.selectTeam')"
    icon="groups"
    class="q-mb-none q-px-xs min-w-150"
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
        v-if="currentTeam"
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

      <q-separator />

      <!-- Create New Team -->
      <q-item clickable v-close-popup @click="createNewTeam">
        <q-item-section avatar>
          <q-icon name="add" color="positive" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t('team.createNew') }}</q-item-label>
          <q-item-label caption>{{ $t('team.createDescription') }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-btn-dropdown>
</template>

<script setup>
import { useTeamStore } from '@/stores/teamStore.ts'
import { useRouter } from 'vue-router'
import { RouteEnum } from '@/enums/routesEnum.ts'
import { computed } from 'vue'

const teamStore = useTeamStore()
const router = useRouter()

const userTeams = computed(() => teamStore.teams)
const currentTeam = computed(() => teamStore.currentTeam)

const selectTeam = (team) => {
  teamStore.currentTeam = team
  teamStore.setSurveysListener(team.id) // ✅ Call new listener for surveys for selected team
}

const manageCurrentTeam = () => {
  if (currentTeam.value?.id) {
    router.push(`/team/${currentTeam.value.id}`)
  }
}

const createNewTeam = () => {
  router.push(RouteEnum.TEAM.path)
}

const getTeamMemberCount = (team) => {
  return team.members?.length || 0
}
</script>
