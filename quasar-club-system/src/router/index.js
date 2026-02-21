import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import { watch } from 'vue'
import routes from './routes'
import { useAuthStore } from '@/stores/authStore.ts'
import { useTeamStore } from '@/stores/teamStore.ts'
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
    // Fire and forget - router guard waits for isAuthReady via watch
    initializeAuth()
    authInitialized = true
  }

  // Authentication Guard
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Wait for Firebase auth to resolve before guarding routes
    if (!authStore.isAuthReady) {
      await new Promise((resolve) => {
        const stop = watch(
          () => authStore.isAuthReady,
          (ready) => {
            if (ready) {
              stop()
              resolve()
            }
          }
        )
      })
    }

    // Wait for team state to resolve when user is authenticated
    if (authStore.user?.uid && !authStore.isTeamReady) {
      await new Promise((resolve) => {
        const stop = watch(
          () => authStore.isTeamReady,
          (ready) => {
            if (ready) { stop(); resolve() }
          }
        )
      })
    }

    const publicPaths = [RouteEnum.LOGIN.path, RouteEnum.REGISTER.path]
    const isPublic = publicPaths.includes(to.path)
    const onboardingPath = RouteEnum.ONBOARDING.path

    // Redirect root to dashboard or login
    if (to.path === '/') {
      next(authStore.user?.uid ? RouteEnum.DASHBOARD.path : RouteEnum.LOGIN.path)
    } else if (!authStore.user?.uid && !isPublic) {
      next(RouteEnum.LOGIN.path)
    } else if (authStore.user?.uid && isPublic) {
      next(RouteEnum.DASHBOARD.path)
    } else {
      const teamStore = useTeamStore()
      const hasNoTeam = authStore.user?.uid && authStore.isTeamReady && teamStore.teams.length === 0

      // Redirect teamless authenticated users to onboarding
      if (hasNoTeam && to.path !== onboardingPath) {
        next(onboardingPath)
      // Redirect users with a team away from onboarding to dashboard
      } else if (authStore.user?.uid && teamStore.teams.length > 0 && to.path === onboardingPath) {
        next(RouteEnum.DASHBOARD.path)
      } else if (to.meta?.requiresAdmin && !authStore.isAdmin) {
        next(RouteEnum.DASHBOARD.path)
      } else {
        next()
      }
    }
  })

  return Router
})
