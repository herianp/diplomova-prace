<template>
    <div class="column">
      <div class="row">
        <h5 class="text-h5 text-white q-my-md">Company & Co</h5>
      </div>
      <div class="row">
        <q-card square bordered class="q-pa-lg shadow-1">
          <q-card-section>
            <q-form class="q-gutter-md">
              <h3>Register</h3>
              <q-input square filled clearable v-model="credentials.name" type="text" label="name" />
              <q-input square filled clearable v-model="credentials.email" type="email" label="email" />
              <q-input square filled clearable v-model="credentials.password" type="password" label="password" />
            </q-form>
          </q-card-section>
          <q-card-actions class="q-px-md">
            <q-btn @click="handleRegister" unelevated color="light-green-7" size="lg" class="full-width" label="Register" />
          </q-card-actions>
          <router-link to="/login" class="text-grey-6 cursor-pointer">
            Already registered? Log in.
          </router-link>
        </q-card>
      </div>
    </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  credentials: {
    type: Object,
    default: () => ({
      name: '',
      email: '',
      password: '',
    }),
  },
});

const emit = defineEmits(["update:credentials", "submitRegister"]);

const credentials = computed({
  get: () => props.credentials,
  set: (newValue) => emit("update:credentials", newValue),
});

const handleRegister = () => {
  emit("submitRegister");
};
</script>

<style>
.q-card {
  width: 360px;
}

.q-form {
  text-align: center;
}

.q-form h3 {
  margin: 0;
}
</style>
