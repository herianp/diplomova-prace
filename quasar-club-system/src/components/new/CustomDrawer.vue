<template>
  <q-drawer v-model="drawerOpen" show-if-above bordered class="drawer">
    <q-list>
      <!-- 🚀 Top 5 Buttons -->
      <q-item clickable v-ripple v-for="link in topLinks" :key="link.title" @click="navigateTo(link.route)">
        <q-item-section avatar>
          <q-icon :name="link.icon" />
        </q-item-section>
        <q-item-section>{{ link.title }}</q-item-section>
      </q-item>
    </q-list>

    <!-- 🚀 Bottom Section -->
    <q-space />

    <q-list class="bottom-links">

      <q-separator />

      <q-item v-if="isAdmin" clickable v-ripple @click="navigateTo(RouteEnum.ADMIN.path)">
        <q-item-section avatar>
          <q-icon name="admin_panel_settings" color="red" />
        </q-item-section>
        <q-item-section>{{ $t('admin.title') }}</q-item-section>
      </q-item>

      <q-item clickable v-ripple @click="navigateTo(RouteEnum.SETTINGS.path)">
        <q-item-section avatar>
          <q-icon name="settings" />
        </q-item-section>
        <q-item-section>Settings</q-item-section>
      </q-item>

      <q-item clickable v-ripple class="logout" @click="logoutUser">
        <q-item-section avatar>
          <q-icon name="logout" color="red" />
        </q-item-section>
        <q-item-section>Logout</q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { RouteEnum } from '@/enums/routesEnum.ts'
import { useAuthComposable } from '@/composable/useAuthComposable.js'

const router = useRouter();
const { logoutUser, isAdmin } = useAuthComposable();

const drawerOpen = ref(true);

// Top navigation links
const topLinks = [
  { title: "Dashboard", icon: "dashboard", route: RouteEnum.DASHBOARD.path },
  { title: "Teams", icon: "groups", route: RouteEnum.TEAM.path },
  { title: "Surveys", icon: "poll", route: RouteEnum.SURVEY.path },
  { title: "Reports", icon: "bar_chart", route: RouteEnum.REPORTS.path },
  { title: "Messages", icon: "chat", route: RouteEnum.MESSAGES.path },
];

// Navigation function
const navigateTo = (route) => {
  router.push(route);
};
</script>

<style scoped>
.drawer {
  width: 250px;
  display: flex;
  flex-direction: column;
}

/* Push bottom section down */
.bottom-links {
  margin-top: auto;
}

</style>
