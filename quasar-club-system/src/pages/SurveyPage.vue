<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('survey.title') }}</h1>
    <div v-if="isPowerUser" class="powerUser-navbar">
      <q-btn
        @click="handleCreateSurvey"
        align="around"
        class="btn-fixed-width"
        color="brown-5"
        :label="$t('survey.create')"
        icon="lightbulb_outline"
      />
    </div>

    <SurveyCard v-for="survey in surveys" :key="survey.id" :survey="survey" />

    <BaseModal v-model="showModal" :title="$t('survey.create')">
      <template #body>
        <SurveyForm @submit="handleSurveySubmit" />
      </template>
    </BaseModal>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useTeamStore } from '@/stores/teamStore.ts'
import { useAuthStore } from '@/stores/authStore.ts'
import SurveyCard from '@/components/new/SurveyCard.vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import BaseModal from '@/components/modal/BaseModal.vue'
import SurveyForm from '@/components/modal/SurveyForm.vue'
import { useDateHelpers } from '@/composable/useDateHelpers.js'

const auth = getAuth()
const teamStore = useTeamStore()
const authStore = useAuthStore()
const { getDateByDateAndTime } = useDateHelpers()

const surveys = computed(() => teamStore.surveys)
const showModal = ref(false)
const backdropFilter = ref(null)

const user = computed(() => authStore.user)
const currentTeam = computed(() => teamStore.currentTeam)
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid))

function handleCreateSurvey() {
  backdropFilter.value = 'contrast(40%)'
  showModal.value = true
}

async function handleSurveySubmit(payload) {
  try {
    await teamStore.addSurvey({
      title: payload.title,
      description: payload.description,
      date: payload.date,
      time: payload.time,
      dateTime: getDateByDateAndTime(payload.date, payload.time),
      teamId: currentTeam.value.id,
    })
  } catch (err) {
  console.log(`err ${err}`);
}


  console.log('Submitted data:', payload)
  showModal.value = false
}

onMounted(async () => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      teamStore.setSurveysListener(teamStore.currentTeam.id)
    } else {
      console.error('No authenticated user found.')
    }
  })
})
</script>

<style scoped>
.powerUser-navbar {
  width: 100%;
  background-color: #007bff; /* Bootstrap Primary Blue */
  padding: 1rem;
  color: white;
  display: flex;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.powerUser-navbar ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}

.powerUser-navbar li {
  margin: 0 1rem;
}

.powerUser-navbar a {
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: color 0.3s;
}

.powerUser-navbar a:hover {
  color: #ffc107; /* Bootstrap Warning Yellow */
}
</style>
