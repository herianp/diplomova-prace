<template>
  <q-layout view="hHh LpR lFf">
    <q-header flat class="bg-transparent">
      <q-toolbar>
        <q-space />
        <LanguageSwitcher />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'
</script>
