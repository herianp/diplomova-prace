<template>
  <div class="col-12 col-sm-6 col-md-6 col-lg-4 clickable-card" @click="openTeam(team.id)">
    <BaseCard>
      <template #content>
        <div class="text-overline">Members: {{ team.members.length }}</div>
        <div class="text-h5 q-mt-sm q-mb-xs">{{ team.name }}</div>
        <div class="text-caption text-grey">Power Users: {{ team.powerusers.length }}</div>
      </template>

      <template #media>
        <q-img class="rounded-borders max-h-150" src="https://cdn.quasar.dev/img/parallax2.jpg" />
      </template>

      <template v-if="isAdmin" #actions>
        <q-btn flat round icon="delete" color="red" @click="showModal = true" />
      </template>
    </BaseCard>
  </div>

  <BaseModal v-model="showModal" :title="$t('team.update')">
    <template #body>
      <div>
        <p>DELETE - Are you sure?</p>
        <q-btn flat round icon="delete" color="red" @click="handleDeleteTeam" />
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthStore } from '@/stores/authStore.js'
import { useRouter } from 'vue-router'

const teamStore = useTeamStore();
const authStore = useAuthStore();
const router = useRouter();

const props = defineProps({
  team: {
    type: Object,
    required: true,
  },
})

const showModal = ref(false)

const isAdmin = computed(() => authStore.isAdmin)

function openTeam(teamId) {
  console.log('teamId', teamId)
  teamStore.setSurveysListener(teamId)
  const team = teamStore.teams.find(t => t.id === teamId)
  teamStore.setCurrentTeam(team)
  router.push(`/survey`)
}

async function handleDeleteTeam() {
  try {
    await teamStore.deleteTeam(props.team.id);
  } catch (err) {
    console.log(`err ${err}`);
  }

  console.log('Component team deleted:', props.team.id)
  showModal.value = false
}
</script>

<style scoped></style>
