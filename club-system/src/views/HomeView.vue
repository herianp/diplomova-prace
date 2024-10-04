<script setup>
import Dashboard from "@/components/Dashboard.vue";
</script>

<template>
  <div class="homeView">
    <Dashboard />
  </div>
</template>

<style>
@media (min-width: 1024px) {
  .homeView {
    min-height: 100%;
    display: flex;
    align-items: start;
    justify-content: center;
    margin-top: 5%;
  }
}
</style>
