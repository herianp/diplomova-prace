<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('team.title') }}</h1>

    <TeamCreateMenu
      :is-power-user="isCurrentUserPowerUser"
      class="q-ma-lg"
    />

    <div class="row wrap q-col-gutter-md q-mt-md justify-start">
      <div
        v-for="team in teams"
        :key="team.id"
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TeamCard :team="team" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import TeamCard from '@/components/new/TeamCard.vue'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import TeamCreateMenu from '@/components/team/TeamCreateMenu.vue'
import { useTeamUseCases } from '@/composable/useTeamUseCases.js'
import { useTeamStore } from '@/stores/teamStore.js'

const auth = getAuth()
const { isCurrentUserPowerUser } = useAuthComposable()
const { setTeamListener } = useTeamUseCases()
const { teams } = useTeamStore()

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setTeamListener(user.uid);
    } else {
      console.error("No authenticated user found.");
    }
  });
});
</script>

<style scoped>
</style>
