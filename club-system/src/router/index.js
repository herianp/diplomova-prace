import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import SurveyPage from "@/pages/SurveyPage.vue";
import DashboardPage from "@/pages/DashboardPage.vue";
import AuthPage from "@/pages/AuthPage.vue";
import {RouteEnum} from "@/enums/routesEnum.js";
import TeamsPage from "@/pages/TeamsPage.vue"; //@ is alias from vite.config.js

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

export default router
