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
        <img
          src="@/assets/icon_settings.png"
          class="icon-settings"
          @click="openSurveyEditForm"
          alt="settings"/>
        <div>
          <a
              class="btn btn-primary me-2"
              :class="{
              'btn btn-success me-2': isActive && isActivePositive,
              'btn btn-primary me-2': !isActive
            }"
              @click="clubStore.addVote(survey.id, user.id, true)"
          >
            Going</a>
          <a
              class="btn btn-primary"
              :class="{
              'btn btn-danger': isActive && !isActivePositive,
              'btn btn-primary': !isActive
            }"
              @click="clubStore.addVote(survey.id, user.id, false)"
          >
            Not going</a>
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
import {useUserStore} from "@/stores/user.js";
import {computed, ref} from "vue";
import SurveyEditForm from "@/components/modal/SurveyEditForm.vue";

const props = defineProps({
  surveyId: {
    type: String,
    default: 0
  }
});

const clubStore = useClubStore();
const userStore = useUserStore();

const user = computed(() => userStore.user);
const survey = computed(() => clubStore.getSurveyById(props.surveyId));
const positiveVotes = computed(() => clubStore.getPositiveVotes(survey.value.id));
const negativeVotes = computed(() => clubStore.getNegativeVotes(survey.value.id));

const isModalOpen = ref(false);

const isActive = computed(() => {
  return survey.value.votes.some(vote => vote.user.id === userStore.user.id);
});

const isActivePositive = computed(() => {
  return survey.value.votes.some(vote => {
    if (vote.user.id === userStore.user.id) {
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
  width: 100% !important;
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
}

.icon-settings:hover {
  cursor: pointer;
  width: 35px;
  height: 35px;
}
</style>
