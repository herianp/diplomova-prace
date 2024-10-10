<script setup>
import { RouterLink, RouterView } from 'vue-router'
import {useClubStore} from "@/stores/club.js";

const clubStore = useClubStore();
</script>

<template>
  <nav class="navbar navbar-expand-md bg-dark navbar-dark">
    <RouterLink to="/" class="navbar-brand">{{clubStore.clubName}}</RouterLink>

    <!-- Toggler button for mobile view -->
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
      <span class="navbar-toggler-icon"></span>
    </button>

    <!-- Navbar links -->
    <div class="collapse navbar-collapse" id="navbarContent">
      <ul class="navbar-nav me-auto">
        <li class="nav-item">
          <RouterLink to="/" class="nav-link">Home</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/about" class="nav-link">About</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/dashboard" class="nav-link">Dashboard</RouterLink>
        </li>
        <li class="nav-item">
          <RouterLink to="/survey" class="nav-link">Survey</RouterLink>
        </li>
      </ul>

      <!-- Right-aligned links (sign up, login) -->
      <ul class="navbar-nav">
        <li class="nav-item">
          <RouterLink to="/login" class="nav-link">Login</RouterLink>
        </li>
      </ul>
    </div>
  </nav>

  <!-- RouterView for dynamic content -->
  <RouterView />
</template>

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
