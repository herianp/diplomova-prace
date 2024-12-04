<template>
  <div class="card" style="width: 18rem;">
    <div class="card-body">
      <div class="card-custom-header">
        <h5 class="card-title">{{ survey.title }}</h5>
        <div class="card-statistics">
          <h5>Votes: {{ survey.votes.length }}</h5>
          <h5 style="color: gray">
            <span style="color: green">{{ positiveVotes }}</span>
            |
            <span style="color: red">{{ negativeVotes }}</span>
          </h5>
        </div>
      </div>
      <p class="card-text">{{ survey.description }}</p>
      <div class="d-flex justify-content-between">
        <h5>{{ useClub.getDisplayedDateTime(survey.date, survey.time) }}</h5>
        <div>
          <img
              src="@/assets/icon_settings.png"
              class="icon-settings"
              @click="openSurveyEditForm"
              alt="settings"/>
          <a
              class="btn btn-primary me-2"
              :class="{
              'btn btn-success me-2': isActive && isActivePositive,
              'btn btn-primary me-2': !isActive
            }"
              @click="clubStore.addVote(survey.id, user.uid, true)"
          >
            Going
          </a>
          <a
              class="btn btn-primary"
              :class="{
              'btn btn-danger': isActive && !isActivePositive,
              'btn btn-primary': !isActive
            }"
              @click="clubStore.addVote(survey.id, user.uid, false)"
          >
            Not going
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Modalní okno -->
  <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
    <SurveyEditForm
        @closeModal="closeModal"
        :survey="survey"
    />
  </div>
</template>

<script setup>
import {useClubStore} from "@/stores/club.js";
import {useAuthStore} from "@/stores/auth.js";
import {computed, ref} from "vue";
import SurveyEditForm from "@/components/modal/SurveyEditForm.vue";
import {useClubComposable} from "@/use/useClubComposable.js";

const props = defineProps({
  surveyId: {
    type: String,
    default: 0
  }
});

const clubStore = useClubStore();
const userStore = useAuthStore();

const useClub= useClubComposable();

const user = computed(() => userStore.user);
const survey = computed(() => clubStore.getSurveyById(props.surveyId));
const positiveVotes = computed(() => clubStore.getPositiveVotes(survey.value.id));
const negativeVotes = computed(() => clubStore.getNegativeVotes(survey.value.id));

const isModalOpen = ref(false);

const isActive = computed(() => {
  if (survey.value.votes.length === 0) {
    return false;
  }
  return survey.value.votes.some(vote => vote.user.uid === userStore.user.uid);
});

const isActivePositive = computed(() => {
  return survey.value.votes.some(vote => {
    if (vote.user.uid === userStore.user.uid) {
      return vote.vote;
    }
  });
});

function openSurveyEditForm() {
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}
</script>

<style scoped>

.card {
  min-width: 500px;
  margin-top: 20px;
}

@media (max-width: 1024px){
  .card {
    width: calc(100% - 20px) !important;
    margin-top: 20px;
    min-width: 350px;
  }
}

.card-custom-header {
  display: flex;
  justify-content: space-between;
}

.card-statistics {
  display: flex;
  flex-direction: column;
  align-items: end;
  width: 100px;
}

.icon-settings {
  width: 30px;
  height: 30px;
  transition: width 0.3s ease, height 0.3s ease; /* Přidáme přechod */
  margin: 0 5px;
}

.icon-settings:hover {
  cursor: pointer;
  width: 35px;
  height: 35px;
}
</style>
