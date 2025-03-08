<template>
  <q-page class="flex flex-center">
    <RegisterFormNew v-model:credentials="credentials" @submitRegister="submitRegister"/>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import RegisterFormNew from '@/components/new/RegisterFormNew.vue'

const authStore = useAuthStore();

const credentials = ref({
  name: '',
  email: '',
  password: ''
});

function submitRegister(event) {
  if (!credentials.value.name || !credentials.value.email|| !credentials.value.password) {
    alert(`Please fill in all fields - ${event}`);
    return;
  }
  console.log(`credentials.value: ${JSON.stringify(credentials.value)}`);
  authStore.register(credentials.value);
}
</script>

<style scoped>

</style>
