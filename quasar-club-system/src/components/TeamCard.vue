<template>
  <div @click="openTeam(team.id)" class="clickable-card">
    <BaseCard @click="openTeam(team.id)">
      <template #header>
        <q-card-section class="q-pt-xs">
          <div class="text-overline">Members: {{ team.members.length }}</div>
          <div class="text-h5 q-mt-sm q-mb-xs">{{ team.name }}</div>
          <div class="text-caption text-grey">Power Users: {{ team.powerusers.length }}</div>
        </q-card-section>
      </template>

      <template #media>
        <q-card-section class="col-5 flex flex-center">
          <q-img class="rounded-borders max-h-150" src="https://cdn.quasar.dev/img/parallax2.jpg" />
        </q-card-section>
      </template>
    </BaseCard>
  </div>

  <BaseModal v-model="showModal" :title="$t('team.update')">
    <template #body>
      <p>This is modal content. from my slot body</p>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue'
import BaseModal from '@/components/modal/BaseModal.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useRouter } from 'vue-router'

defineProps({
  team: {
    type: Object,
    required: true,
  },
})

const router = useRouter();
const teamStore = useTeamStore();

const showModal = ref(false)

function openTeam(teamId) {
  console.log('teamId', teamId)
  teamStore.setSurveysListener(teamId)
  const team = teamStore.teams.find(t => t.id === teamId)
  teamStore.setCurrentTeam(team)
  router.push(`/survey`)
}
</script>

<style scoped></style>
