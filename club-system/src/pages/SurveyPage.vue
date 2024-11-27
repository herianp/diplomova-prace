<template>
  <div class="container">
    <h1>{{ $t('survey.title') }}</h1>
    <button
        class="btn-danger"
        @click="openNewSurveyForm()"
    >
      {{ $t('survey.create.title') }}
    </button>
    <d-card
        v-for="survey in clubStore.activeSurveys"
        :key="survey.id"
        :surveyId="survey.id"
    />

    <!-- Modalní okno -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <SurveyForm
          @closeModal="closeModal"
      />
    </div>

  </div>
</template>

<script setup>
import DCard from "@/components/base/d-card.vue";
import {useClubStore} from "@/stores/club.js";
import {ref} from "vue";
import SurveyForm from "@/components/modal/SurveyForm.vue";

const clubStore = useClubStore();

const isModalOpen = ref(false);

function openNewSurveyForm() {
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  console.log('close modal');
}
</script>

<style scoped>
.container {
  display: flex;
  justify-content: start;
  align-items: center;
  height: 100%;
  margin-top: 15px;
  padding-bottom: 50px;
  flex-direction: column;
}
.card {
  margin-top: 15px;
}
</style>
