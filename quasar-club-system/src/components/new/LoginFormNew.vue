<template>
    <div class="column">
      <div class="row">
        <q-card square bordered class="q-pa-lg shadow-1">
          <q-card-section>
            <q-form class="q-gutter-md">
              <h3>Login</h3>
              <q-input square filled clearable v-model="credentials.email" type="email" label="email" />
              <q-input square filled clearable v-model="credentials.password" type="password" label="password" />
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md">
            <q-btn @click="handleLogin" unelevated color="light-green-7" size="lg" class="full-width" label="Login" />
          </q-card-actions>
          <router-link :to="RouteEnum.REGISTER.path" class="text-grey-6 cursor-pointer">
            Not registered? Create an Account
          </router-link>
        </q-card>
      </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import { RouteEnum } from '@/enums/routesEnum.ts'

const props = defineProps({
  credentials: {
    type: Object,
    default: () => ({
      email: '',
      password: '',
    }),
  },
});

const emit = defineEmits(["update:credentials", "submitLogin"]);

const credentials = computed({
  get: () => props.credentials,
  set: (newValue) => emit("update:credentials", newValue),
});

const handleLogin = () => {
  emit("submitLogin");
};
</script>

<style scoped>
:deep(.q-card) {
  width: 360px;
}

:deep(.q-form) {
  text-align: center;
}

:deep(.q-form h3) {
  margin: 0;
}
</style>
