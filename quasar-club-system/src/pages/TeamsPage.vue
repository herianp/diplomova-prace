<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('survey.title') }}</h1>

    <div v-if="isAdmin" class="powerUser-navbar">
      <q-btn
        @click="handleOpenModal"
        align="around"
        class="btn-fixed-width"
        color="brown-5"
        :label="$t('team.create')"
        icon="lightbulb_outline"
      />
    </div>

    <div class="row q-gutter-lg q-pa-lg justify-center">
      <TeamCard v-for="team in teams" :key="team.id" :team="team" />
    </div>

    <BaseModal v-model="showModal" :title="$t('survey.create')">
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

const auth = getAuth()
const teamStore = useTeamStore()
const authStore = useAuthStore()

const showModal = ref(false)
const backdropFilter = ref(null)

const teams = computed(() => teamStore.teams)
const user = computed(() => auth.currentUser)
const isAdmin = computed(() => authStore.isAdmin)

function handleOpenModal() {
  backdropFilter.value = 'contrast(40%)'
  showModal.value = true
}

async function handleCreateTeam(payload) {
  try {
    await teamStore.createTeam(payload.title, user.value.uid);
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
