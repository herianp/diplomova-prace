<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('team.title') }}</h1>
    <div v-if="isPowerUser" class="powerUser-navbar">
      <q-btn
        @click="openNewTeamForm"
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

    <BaseModal v-model="showModal" :title="$t('survey.create')">
      <template #body>
        <SurveyForm @submit="handleTeamSubmit" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BaseModal from '@/components/modal/BaseModal.vue'
import SurveyForm from '@/components/modal/SurveyForm.vue'
import TeamCard from '@/components/TeamCard.vue'
import { useAuthStore } from '@/stores/authStore.js'

const teamStore = useTeamStore()
const authStore = useAuthStore()

const showModal = ref(false)

const user = computed(() => authStore.user)
const teams = computed(() => teamStore.teams)
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid))

const auth = getAuth()
const isModalOpen = ref(false)

function openNewTeamForm() {
  isModalOpen.value = true
}

async function handleTeamSubmit(payload) {
  try {
    console.log('handleTeamSubmit', payload)
  } catch (err) {
    console.log(`err ${err}`)
  }

  console.log('Submitted data:', payload)
  showModal.value = false
}
onMounted(() => {
  // method wait until the user is authenticated
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.setTeamListener(user.uid)
    } else {
      console.error('No authenticated user found.')
    }
  })
})
</script>

<style scoped></style>
