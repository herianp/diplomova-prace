<template>
  <ul class="nav nav-tabs">
    <li class="nav-item" v-for="(link, index) in navLinks" :key="index">
      <a
          class="nav-link"
          :class="{ active: activeIndex === index }"
          href="#"
          @click.prevent="setActive(index)"
      >
        {{ link }}
      </a>
    </li>
  </ul>

  <div v-if="activeIndex === 0" class="container-form">
    <h1 style="text-align: center">Login</h1>
    <LoginForm :credentials="credentials" :submit-login="submitLogin"/>
  </div>

  <div v-if="activeIndex === 1" class="container-form">
    <h1 style="text-align: center">Register</h1>
    <RegisterForm :credentials="credentials" :submit-registration="submitRegistration"/>
  </div>
</template>

<script setup>
import {reactive, ref} from "vue";
import LoginForm from "@/components/auth/LoginForm.vue";
import RegisterForm from "@/components/auth/RegisterForm.vue";
import { useAuthStore} from "@/stores/auth.js";

const authStore = useAuthStore();

const navLinks = ref(['Login', 'Register']);
const activeIndex = ref(0);

const credentials = reactive({
  name: '',
  email: '',
  password: ''
});

const setActive = (index) => {
  activeIndex.value = index;
};

function submitRegistration(event) {
  if (!credentials.name || !credentials.email|| !credentials.password) {
    alert('Please fill in all fields');
    return;
  }
  authStore.register(credentials);
}

function submitLogin() {
  if (!credentials.email || !credentials.password) {
    alert('Please fill in all fields');
    return;
  }
  authStore.login(credentials);
}
</script>

<style scoped>
.nav-tabs {
  justify-content: center;
}
.nav-link {
  color: black;
  font-size: 20px;
}
.container-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 30px 30px;
}
@media (max-width: 768px) {
  .container-form {
    max-width: 100%;
  }
}
</style>
