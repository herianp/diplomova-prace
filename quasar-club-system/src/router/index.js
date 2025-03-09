import { defineRouter } from '#q-app/wrappers'
import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/useAuthStore'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { RouteEnum } from '@/enums/routesEnum.ts'
import { useTeamStore } from '@/stores/useTeamStore.ts'

export default defineRouter(function () {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  // Authentication Guard
  Router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const teamStore = useTeamStore();
    const auth = getAuth();

    // Wait for the authentication state
    if (!authStore.isInitialized) {
      await new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          authStore.user = user; // Update user in Pinia store
          if (user) {
            await teamStore.setTeamListener(user.uid); // ✅ Restore Firestore listener
          }
          resolve();
        });
      });
      authStore.isInitialized = true;
    }

    // Route Protection
    if (!authStore.user?.uid && to.path !== RouteEnum.LOGIN.path && to.path !== RouteEnum.REGISTER.path && to.path !== RouteEnum.ABOUT.path) {
      next(RouteEnum.LOGIN.path);
    } else if (authStore.user?.uid && to.path === RouteEnum.LOGIN.path) {
      next(RouteEnum.DASHBOARD.path);
    } else {
      next();
    }
  });

  return Router
})
