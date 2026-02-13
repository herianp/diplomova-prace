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
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const authStore = useAuthStore();
const { loginUser } = useAuthComposable();
const $q = useQuasar()
const { t } = useI18n()

const credentials = ref({
  email: '',
  password: ''
});

async function submitLogin() {
  if (!credentials.value.email || !credentials.value.password) {
    $q.notify({
      type: 'warning',
      message: t('common.fillAllFields'),
      icon: 'warning'
    })
    return;
  }
  await loginUser(credentials.value.email, credentials.value.password);
}
</script>

<style scoped>

</style>
