import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/authStore.ts'
import { useAuthUseCases } from '@/composable/useAuthUseCases.ts'
import { RouteEnum } from '@/enums/routesEnum.ts'

let authInitialized = false

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Initialize auth once - this will handle team setup automatically
  if (!authInitialized) {
    const { initializeAuth } = useAuthUseCases()
    initializeAuth()
    authInitialized = true
  }

  // Authentication Guard
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Route Protection
    if (!authStore.user?.uid && to.path !== RouteEnum.LOGIN.path && to.path !== RouteEnum.REGISTER.path && to.path !== RouteEnum.ABOUT.path) {
      next(RouteEnum.LOGIN.path)
    } else if (authStore.user?.uid && to.path === RouteEnum.LOGIN.path) {
      next(RouteEnum.DASHBOARD.path)
    } else {
      next()
    }
  })

  return Router
})
