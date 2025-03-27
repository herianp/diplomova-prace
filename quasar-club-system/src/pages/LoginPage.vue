<template>
  <q-page class="flex flex-center">
    <q-spinner v-if="authStore.isLoading" color="primary" size="40px" />
    <LoginFormNew v-else v-model:credentials="credentials" @submitLogin="submitLogin"/>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/authStore.ts";
import LoginFormNew from '@/components/new/LoginFormNew.vue'

const authStore = useAuthStore();


const credentials = ref({
  email: '',
  password: ''
});

async function submitLogin() {
  if (!credentials.value.email || !credentials.value.password) {
    alert('Please fill in all fields');
    return;
  }
  await authStore.login(credentials.value);
}
</script>

<style scoped>

</style>
