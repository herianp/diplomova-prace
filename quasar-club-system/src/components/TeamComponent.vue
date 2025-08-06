<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('team.title') }}</h1>

    <TeamCreateMenu
      :is-power-user="isCurrentUserPowerUser"
      @survey-created="handleCreateTeam"
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
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import TeamCard from '@/components/new/TeamCard.vue'
import { useTeamComposable } from '@/composable/useTeamComposable.js'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import TeamCreateMenu from '@/components/team/TeamCreateMenu.vue'

const auth = getAuth()
const teamStore = useTeamStore()
const { currentUser, isCurrentUserPowerUser } = useAuthComposable()
const { createTeam } = useTeamComposable()

const showModal = ref(false)

const teams = computed(() => teamStore.teams)

async function handleCreateTeam(payload) {
  try {
    await createTeam(payload.title, currentUser.value.uid);
  } catch (err) {
    console.log(`err ${err}`);
  }

  console.log('Submitted data:', payload)
  showModal.value = false
}

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.setTeamListener(user.uid);
    } else {
      console.error("No authenticated user found.");
    }
  });
});
</script>

<style scoped>
</style>
