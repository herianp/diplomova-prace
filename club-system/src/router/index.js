import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import AboutPage from '@/pages/AboutPage.vue'
import SurveyPage from "@/pages/SurveyPage.vue";
import DashboardPage from "@/pages/DashboardPage.vue";
import AuthPage from "@/pages/AuthPage.vue"; //@ is alias from vite.config.js

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage
    },
    {
      path: '/about',
      name: 'about',
      component: AboutPage
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardPage
    },
    {
      path: '/survey',
      name: 'survey',
      component: SurveyPage
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage
    }
  ]
})

export default router
