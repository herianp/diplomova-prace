<template>
  <q-drawer v-model="drawerOpen" show-if-above bordered class="drawer">
    <!-- Season & Team selectors for mobile (hidden on desktop where they appear in header) -->
    <div class="lt-md q-pa-sm">
      <q-list dense>
        <!-- Season selector -->
        <q-item-label header class="q-pb-xs">{{ $t('season.label') }}</q-item-label>
        <q-item
          v-for="season in seasonStore.seasons"
          :key="season.key"
          clickable
          dense
          v-ripple
          @click="seasonStore.selectSeason(season.key)"
          :active="seasonStore.selectedSeasonKey === season.key"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon
              :name="seasonStore.selectedSeasonKey === season.key ? 'radio_button_checked' : 'radio_button_unchecked'"
              :color="seasonStore.selectedSeasonKey === season.key ? 'primary' : 'grey'"
              size="xs"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ season.label }}</q-item-label>
            <q-item-label caption v-if="season.key === seasonStore.currentSeasonKey">
              {{ $t('season.current') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-separator class="q-my-sm" />

        <!-- Team selector -->
        <q-item-label header class="q-pb-xs">{{ $t('team.switchTeam') }}</q-item-label>
        <q-item
          v-for="team in userTeams"
          :key="team.id"
          clickable
          dense
          v-ripple
          @click="selectTeam(team)"
          :active="currentTeam?.id === team.id"
          active-class="text-primary"
        >
          <q-item-section avatar>
            <q-icon
              :name="currentTeam?.id === team.id ? 'radio_button_checked' : 'radio_button_unchecked'"
              :color="currentTeam?.id === team.id ? 'primary' : 'grey'"
              size="xs"
            />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ team.name }}</q-item-label>
            <q-item-label caption>{{ team.members?.length || 0 }} {{ $t('team.members') }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-separator class="q-my-sm" />
    </div>

    <q-list>
      <!-- Navigation links -->
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
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { RouteEnum } from '@/enums/routesEnum.ts'
import { useAuthComposable } from '@/composable/useAuthComposable.js'
import { useSeasonStore } from '@/stores/seasonStore'
import { useTeamStore } from '@/stores/teamStore'
import { useSurveyUseCases } from '@/composable/useSurveyUseCases'
import { listenerRegistry } from '@/services/listenerRegistry'

const router = useRouter();
const { logoutUser, isAdmin } = useAuthComposable();
const seasonStore = useSeasonStore();
const teamStore = useTeamStore();
const { setSurveysListener } = useSurveyUseCases();

const userTeams = computed(() => teamStore.teams);
const currentTeam = computed(() => teamStore.currentTeam);

const selectTeam = (team) => {
  listenerRegistry.unregisterByScope('team');
  teamStore.currentTeam = team;
  setSurveysListener(team.id);
};

const drawerOpen = ref(true);

// Top navigation links
const topLinks = [
  { title: "Dashboard", icon: "dashboard", route: RouteEnum.DASHBOARD.path },
  { title: "Teams", icon: "groups", route: RouteEnum.TEAM.path },
  { title: "Surveys", icon: "poll", route: RouteEnum.SURVEY.path },
  { title: "Reports", icon: "bar_chart", route: RouteEnum.REPORTS.path },
  { title: "Players", icon: "person", route: RouteEnum.PLAYERS.path },
  { title: "Cashbox", icon: "account_balance_wallet", route: RouteEnum.CASHBOX.path },
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
