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
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const authStore = useAuthStore();
const { loginUser } = useAuthComposable();

const credentials = ref({
  email: '',
  password: ''
});

async function submitLogin() {
  if (!credentials.value.email || !credentials.value.password) {
    alert('Please fill in all fields');
    return;
  }
  await loginUser(credentials.value.email, credentials.value.password);
}
</script>

<style scoped>

</style>
