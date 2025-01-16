import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import SurveyPage from "@/pages/SurveyPage.vue";
import DashboardPage from "@/pages/DashboardPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
import {RouteEnum} from "@/enums/routesEnum.js";
import TeamsPage from "@/pages/TeamsPage.vue";
import {useAuthStore} from "@/stores/auth.js";
import {getAuth, onAuthStateChanged} from "firebase/auth"; //@ is alias from vite.config.js

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: RouteEnum.HOME.path,
      name: RouteEnum.HOME.name,
      component: HomePage
    },
    {
      path: RouteEnum.ABOUT.path,
      name: RouteEnum.ABOUT.name,
      component: AboutPage
    },
    {
      path: RouteEnum.DASHBOARD.path,
      name: RouteEnum.DASHBOARD.name,
      component: DashboardPage
    },
    {
      path: RouteEnum.SURVEY.path,
      name: RouteEnum.SURVEY.name,
      component: SurveyPage
    },
    {
      path: RouteEnum.AUTH.path,
      name: RouteEnum.AUTH.name,
      component: AuthPage
    },
    {
      path: RouteEnum.TEAM.path,
      name: RouteEnum.TEAM.name,
      component: TeamsPage
    },
    {
      path: "/:teamId/surveys",
      name: "TeamSurveys",
      component: SurveyPage,
    },
  ]
})

router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  // Wait for the user's authentication state to load
  const auth = getAuth();
  if (!authStore.isInitialized) {
    await new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        authStore.user = user; // Update the user in your store
        resolve(); // Continue once user state is resolved
      });
    });
    authStore.isInitialized = true; // Add a flag to mark auth initialization
  }

  if (!authStore.user?.uid && to.path !== RouteEnum.AUTH.path && to.path !== RouteEnum.ABOUT.path) {
    router.push(RouteEnum.AUTH.path);
  } else if (authStore.user?.uid && to.path === RouteEnum.AUTH.path) {
    router.push(RouteEnum.HOME.path);
  }
})

export default router
