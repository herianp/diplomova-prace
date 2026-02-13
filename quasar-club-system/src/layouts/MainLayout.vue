<template>
  <q-layout view="hHh LpR lFf">
    <q-header elevated>
      <q-toolbar class="q-gutter-x-md">
        <q-btn flat dense round icon="menu" aria-label="Menu" @click="drawerOpen = !drawerOpen" />
        <q-toolbar-title>{{ $t('app.title') }}</q-toolbar-title>

        <!-- 🔽 Team Dropdown Button -->
        <TeamDropdown />

        <!-- 🔔 Notifications Dropdown -->
        <NotificationsDropdown />

        <UserAvatarMenu />
      </q-toolbar>
    </q-header>

    <CustomDrawer v-model="drawerOpen" />

    <!--style="padding-top: 0"-->
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from "vue";
import CustomDrawer from "@/components/new/CustomDrawer.vue";
import TeamDropdown from '@/components/new/TeamDropdown.vue'
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown.vue'
import UserAvatarMenu from '@/components/UserAvatarMenu.vue'

const drawerOpen = ref(true);
</script>
