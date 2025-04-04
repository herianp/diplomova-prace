<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('team.title') }}</h1>

    <div v-if="isAdmin" class="powerUser-navbar">
      <q-btn
        @click="handleOpenNewTeamForm"
        align="around"
        class="btn-fixed-width"
        color="brown-5"
        :label="$t('team.create')"
        icon="lightbulb_outline"
      />
    </div>

    <div class="row wrap q-col-gutter-md q-mt-md justify-start">
      <div
        v-for="team in teams"
        :key="team.id"
        class="col-xs-12 col-sm-6 col-md-4 col-lg-3"
      >
        <TeamCard :team="team" />
      </div>
    </div>

    <BaseModal v-model="showModal" :title="$t('team.create')">
      <template #body>
        <TeamForm @submit="handleCreateTeam" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BaseModal from '@/components/base/BaseModal.vue'
import TeamCard from '@/components/new/TeamCard.vue'
import TeamForm from '@/components/modal/TeamForm.vue'
import { useAuthStore } from '@/stores/authStore.js'
import { useTeamComposable } from '@/composable/useTeamComposable.js'

const auth = getAuth()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { createTeam } = useTeamComposable()

const showModal = ref(false)
const backdropFilter = ref(null)

const teams = computed(() => teamStore.teams)
const user = computed(() => auth.currentUser)
const isAdmin = computed(() => authStore.isAdmin)

function handleOpenNewTeamForm() {
  backdropFilter.value = 'contrast(40%)'
  showModal.value = true
}

async function handleCreateTeam(payload) {
  try {
    await createTeam(payload.title, user.value.uid);
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
