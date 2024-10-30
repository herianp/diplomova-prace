<template>
  <nav class="navbar navbar-expand-md bg-dark navbar-dark">
    <RouterLink to="/" class="navbar-brand">{{clubStore.clubName}}</RouterLink>

    <!-- Toggler button for mobile view -->
    <button class="navbar-toggler" @click="toggleDropdown"
            type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
            aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Navbar links -->
    <div :class="{'collapse': !isDropdownOpen, 'navbar-collapse': true}" id="navbarContent">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link" @click="closeDropdown">
            Home
          </RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/about" class="nav-link" @click="closeDropdown">About</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/dashboard" class="nav-link" @click="closeDropdown">Dashboard</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/survey" class="nav-link" @click="closeDropdown">Survey</RouterLink>
        </li>
      </ul>

      <!-- Right-aligned links (sign up, login) -->
      <ul class="navbar-nav">
        <li class="nav-item">
          <RouterLink to="/login" class="nav-link" @click="closeDropdown">Login</RouterLink>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import {RouterLink} from "vue-router";
import {useClubStore} from "@/stores/club.js";
import {ref} from "vue";

const clubStore = useClubStore();

const isDropdownOpen = ref(false);

const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value;
};
function closeDropdown() {
  isDropdownOpen.value = false;}
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

</style>
