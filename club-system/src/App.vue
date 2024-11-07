<template>
  <NavBar />
  <!-- RouterView for dynamic content -->
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from "@/components/NavBar.vue";
import { useClubStore } from "@/stores/club.js";
import {onMounted} from "vue";

const clubStore = useClubStore();

onMounted(() => {
  clubStore.getActiveSurveys();
});
</script>

<style scoped>

</style>
