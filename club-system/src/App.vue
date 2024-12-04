<template>
  <NavBar />
  <!-- RouterView for dynamic content -->
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
import NavBar from "@/components/NavBar.vue";
import {onMounted} from "vue";
import {useAuthStore} from "@/stores/auth.js";

const authStore = useAuthStore();

onMounted(() => {
  authStore.init();
});
</script>

<style scoped>

</style>
