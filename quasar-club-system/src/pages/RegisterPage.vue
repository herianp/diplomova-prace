<template>
  <q-page class="flex flex-center">
    <RegisterFormNew v-model:credentials="credentials" @submitRegister="submitRegister"/>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import RegisterFormNew from '@/components/new/RegisterFormNew.vue'
import { useAuthComposable } from '@/composable/useAuthComposable'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'

const { registerUser } = useAuthComposable();
const $q = useQuasar()
const { t } = useI18n()

const credentials = ref({
  name: '',
  email: '',
  password: ''
});

async function submitRegister() {
  if (!credentials.value.name || !credentials.value.email || !credentials.value.password) {
    $q.notify({
      type: 'warning',
      message: t('common.fillAllFields'),
      icon: 'warning'
    })
    return;
  }
  await registerUser(credentials.value.email, credentials.value.password, credentials.value.name);
}
</script>

<style scoped>

</style>
