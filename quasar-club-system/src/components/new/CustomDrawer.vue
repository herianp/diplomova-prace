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

      <q-item clickable v-ripple class="logout" @click="authStore.logout">
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
import { useAuthStore } from "@/stores/useAuthStore.ts";
import { RouteEnum } from '@/enums/routesEnum.ts'

const router = useRouter();
const authStore = useAuthStore();
const drawerOpen = ref(true);

// Dummy user data (Replace with real data from store)
const user = ref({
  name: "John Doe",
  email: "johndoe@example.com",
});

// Top navigation links
const topLinks = [
  { title: "Dashboard", icon: "dashboard", route: RouteEnum.DASHBOARD.path },
  { title: "Teams", icon: "groups", route: RouteEnum.TEAM.path },
  { title: "Surveys", icon: "poll", route: RouteEnum.SURVEY.path },
  { title: "Reports", icon: "bar_chart", route: RouteEnum.CASHBOX.path },
  { title: "Messages", icon: "chat", route: "/messages" },
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
