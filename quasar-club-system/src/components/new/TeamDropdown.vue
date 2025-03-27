<template>
  <q-select
    outlined
    dense
    filled
    v-model="currentTeam"
    :options="userTeams"
    option-label="name"
    class="q-mb-none q-px-xs min-w-150"
  />
</template>

<script setup>
import { useTeamStore } from '@/stores/teamStore.ts'
import { computed } from 'vue'

const teamStore = useTeamStore();

const userTeams = computed(() => teamStore.teams);

const currentTeam = computed({
  get: () => teamStore.currentTeam,
  set: (team) => {
    teamStore.currentTeam = team
    teamStore.setSurveysListener(team.id) // ✅ Call new listener for surveys for selected team
  }
});
</script>
