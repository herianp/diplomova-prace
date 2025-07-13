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
      <q-item clickable v-ripple>
        <q-item-section avatar>
          <q-avatar size="40px">
            <img src="https://cdn.quasar.dev/img/avatar.png" alt="img" />
          </q-avatar>
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ user.name }}</q-item-label>
          <q-item-label caption>{{ user.email }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-separator />

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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { RouteEnum } from '@/enums/routesEnum.ts'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import { useAuthStore } from '@/stores/authStore.ts'

const router = useRouter();
const { logoutUser } = useAuthComposable();
const authStore = useAuthStore();

const drawerOpen = ref(true);

// Get user data from auth store
const user = computed(() => ({
  name: authStore.user?.displayName || authStore.user?.email || "User",
  email: authStore.user?.email || "No email"
}));

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
