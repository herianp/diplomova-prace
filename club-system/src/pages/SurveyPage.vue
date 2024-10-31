<template>
  <div class="container">
    <h1>Survey</h1>
    <d-card
        v-for="survey in clubStore.activeSurveys"
        :key="survey.id"
        :surveyId="survey.id"
        class="card"
    />
  </div>
</template>

<script setup>
import DCard from "@/components/base/d-card.vue";
import {useClubStore} from "@/stores/club.js";

const clubStore = useClubStore();
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
