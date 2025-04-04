<template>
  <nav class="navbar navbar-expand-md bg-dark navbar-dark">
    <RouterLink to="/" class="navbar-brand">LOGO here</RouterLink>

    <!-- Toggler button for mobile view -->
    <button class="navbar-toggler" @click="toggleDropdown"
            type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
            aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Navbar links -->
    <div :class="{'collapse': !isDropdownOpen, 'navbar-collapse': true}" id="navbarContent">
      <!-- Left-aligned links (home, about, dashboard, survey)-->
      <!-- User logged in: (home, about, dashboard, survey)-->
      <ul v-if="authStore.user?.uid" class="navbar-nav me-auto">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link" @click="closeDropdown">
            {{ $t('home.title') }}
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/about" class="nav-link" @click="closeDropdown">{{ $t('about.title') }}</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/dashboard" class="nav-link" @click="closeDropdown">{{ $t('dashboard.title') }}</RouterLink>
        </li>
<!--        <li class="nav-item">-->
<!--          <RouterLink to="/survey" class="nav-link" @click="closeDropdown"> {{ $t('survey.title') }}</RouterLink>-->
<!--        </li>-->
        <li class="nav-item">
          <RouterLink to="/team" class="nav-link" @click="closeDropdown">Teams</RouterLink>
        </li>
      </ul>
      <!-- User logged out: (about)-->
      <ul v-else class="navbar-nav me-auto">
        <li class="nav-item">
          <RouterLink to="/about" class="nav-link" @click="closeDropdown">{{ $t('about.title') }}</RouterLink>
        </li>
      </ul>

      <!-- Right-aligned links (sign up, login) -->
      <!-- User logged in: Logout, Translate -->
      <ul v-if="authStore.user?.uid" class="navbar-nav">
        <li class="nav-item">
          <RouterLink to="/auth" class="nav-link" @click="closeDropdownAndLogout">Logout</RouterLink>
        </li>
        <li class="nav-item btn" >
          <LanguageSwitcher class="nav-link" />
        </li>
      </ul>

      <!-- User logged out: Login -->
      <ul v-else class="navbar-nav nav-section">
        <li class="nav-item">
          <RouterLink to="/auth" class="nav-link" @click="closeDropdown">{{ $t('login.title') }}</RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import {RouterLink} from "vue-router";
import LanguageSwitcher from "@/components/LanguageSwitcher.vue";
import {ref} from "vue";
import {useAuthStore} from "@/stores/authStore.ts";
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const authStore = useAuthStore();
const { logoutUser } = useAuthComposable();

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
function closeDropdown() {
  isDropdownOpen.value = false;
}

function closeDropdownAndLogout() {
  isDropdownOpen.value = false;
  logoutUser();
}
</script>

<style scoped>
nav {
  width: 100%;
  font-size: 20px;
}

.navbar-brand {
  font-size: 24px;
  font-weight: bold;
}
.nav-section {
  margin: 0 10px;
}
</style>
