<template>
  <div class="container-page">

    <div v-if="isPowerUser" class="powerUser-navbar">
      <ul>
        <li style="display:flex;">
          <button class="btn btn-dark" @click="handleRequests">Requests</button>
          <p>0</p>
        </li>
      </ul>
    </div>

    <h1>{{ $t('survey.title') }}</h1>

    <button
        class="btn-danger"
        @click="openNewSurveyForm()"
    >
      {{ $t('survey.create.title') }}
    </button>

    <d-card-slots
        v-for="survey in surveys"
        :key="survey.id"
        :title="survey.title"
        :description="survey.description"
    >
      <template #statistics>
        <h5>Votes: {{ survey.votes.length }}</h5>
        <h5 style="color: gray">
          <span style="color: green">{{ teamStore.getPositiveVotes(survey.id) }}</span>
          |
          <span style="color: red">{{ teamStore.getNegativeVotes(survey.id) }}</span>
        </h5>
      </template>

      <template #footer>
        <h5>{{ useClub.getDisplayedDateTime(survey.date, survey.time) }}</h5>
        <div>
          <img
              src="@/assets/icon_settings.png"
              class="icon-settings"
              @click="openEditSurveyForm(survey)"
              alt="settings"
          />
          <a
              class="btn btn-primary me-2"
              :class="{
            'btn btn-success me-2': isSurveyActive(survey) && isPositiveVote(survey),
            'btn btn-primary me-2': !isSurveyActive(survey),
          }"
              @click="addVote(survey.id,true)"
          >
            Going
          </a>
          <a
              class="btn btn-primary"
              :class="{
            'btn btn-danger': isSurveyActive(survey) && !isPositiveVote(survey),
            'btn btn-primary': !isSurveyActive(survey),
          }"
              @click="addVote(survey.id,false)"
          >
            Not going
          </a>
        </div>
      </template>

      <template #modal v-if="isEditModalOpen">
        <SurveyEditForm
            @closeModal="closeModal"/>
      </template>
    </d-card-slots>

    <!-- Modalní okno -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <SurveyForm
          @closeModal="closeModal"
          :teamId="teamIdFromRoute"
      />
    </div>

  </div>
</template>

<script setup>
import {computed, onMounted, ref} from "vue";
import SurveyForm from "@/components/modal/SurveyForm.vue";
import {useTeamStore} from "@/stores/team.js";
import {useRoute} from "vue-router";
import DCardSlots from "@/components/base/d-card-slots.vue";
import {useTeamComposable} from "@/use/useTeamComposable.js";
import SurveyEditForm from "@/components/modal/SurveyEditForm.vue";
import {useAuthStore} from "@/stores/auth.js";

const teamStore = useTeamStore();
const authStore = useAuthStore();

const useClub = useTeamComposable();

const surveys = computed(() => teamStore.surveys);
const user = computed(() => authStore.user);
const currentTeam = computed(() => teamStore.currentTeam);
const isPowerUser = computed(() => currentTeam.value?.powerusers.includes(user.value.uid));

const route = useRoute();
const teamIdFromRoute = route.params.teamId;

const isModalOpen = ref(false);
const isEditModalOpen = ref(false);

function openNewSurveyForm() {
  isModalOpen.value = true;
}

function openEditSurveyForm(survey) {
  teamStore.editedSurvey = survey;
  isEditModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  isEditModalOpen.value = false;
  console.log('close modal');
}

function isSurveyActive(survey) {
  return survey.votes.some((vote) => vote.uid === user.uid);
}

function isPositiveVote(survey) {
  return survey.votes.some((vote) => vote.uid === user.uid && vote.vote);
}

function addVote(surveyId, vote) {
  console.log(`add vote ${vote} to survey ${surveyId} from user ${user.uid}`);
  teamStore.addVote(surveyId, user.uid, vote)
}

function handleRequests() {
  alert('Logic for modal okno s requesty');
}

onMounted(() => {
  console.log('fetch surveys by team id', teamIdFromRoute);
  teamStore.getSurveysByTeamId(teamIdFromRoute);
  teamStore.getTeamById(teamIdFromRoute);
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
  box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.1);
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
