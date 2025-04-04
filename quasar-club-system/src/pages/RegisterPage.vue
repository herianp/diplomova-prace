<template>
  <q-page class="flex flex-center">
    <RegisterFormNew v-model:credentials="credentials" @submitRegister="submitRegister"/>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import RegisterFormNew from '@/components/new/RegisterFormNew.vue'
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const { registerUser } = useAuthComposable();

const credentials = ref({
  name: '',
  email: '',
  password: ''
});

async function submitRegister(event) {
  if (!credentials.value.name || !credentials.value.email|| !credentials.value.password) {
    alert(`Please fill in all fields - ${event}`);
    return;
  }
  console.log(`credentials.value: ${JSON.stringify(credentials.value)}`);
  await registerUser(credentials.value.email, credentials.value.password, credentials.value.name);
}
</script>

<style scoped>

</style>
