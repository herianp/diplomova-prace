<template>
  <div>
    <h1 style="text-align: center" class="q-ma-none q-pa-none">{{ $t('survey.title') }}</h1>
    <div v-if="isPowerUser" class="powerUser-navbar">
      <q-btn @click="handleCreateSurvey" align="around" class="btn-fixed-width" color="brown-5" :label="$t('survey.create')" icon="lightbulb_outline">
        <q-dialog v-model="dialog" :backdrop-filter="backdropFilter">
          <q-card>
            <q-card-section class="row items-center q-pb-none text-h6">
              Dialog
            </q-card-section>

            <q-card-section>
              This dialog has a backdrop filter of {{ backdropFilter }}.
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="Close" color="primary" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>
      </q-btn>
    </div>

    <SurveyCard
      v-for="survey in surveys"
      :key="survey.id"
    />

  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import {useTeamStore} from "@/stores/useTeamStore.ts";
import {useAuthStore} from "@/stores/useAuthStore.ts";
import SurveyCard from '@/components/new/surveyCard.vue'

const teamStore = useTeamStore();
const authStore = useAuthStore();

const surveys = computed(() => teamStore.currentTeam.surveys);
const dialog = ref(false)
const backdropFilter = ref(null)

const user = computed(() => authStore.user);
const currentTeam = computed(() => teamStore.currentTeam);
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid));

function handleCreateSurvey() {
  backdropFilter.value = 'contrast(40%)'
  dialog.value = true
}

onMounted(async () => {
  console.log(`Current team1: ${teamStore.teams.length}`);
  // console.log(`Current team2: ${teamStore.currentTeam.name}`);
  console.log(`Current team3: ${currentTeam.value.name}`);
  // teamStore.setSurveysListener(teamStore.currentTeam.id);
});
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
