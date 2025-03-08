import { defineStore } from 'pinia'
import { authStateListener, loginUser, logoutUser, registerUser } from "@/services/authService";
import { RouteEnum } from "@/enums/routesEnum.js";
import { useTeamStore } from "@/stores/useTeamStore.js";
import { ICredentials } from '../interfaces/interfaces'
import { ref } from 'vue'

const getInitialUser = () => ({
  uid: '1',
});

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: getInitialUser(),
    isLoading: ref(false), // Global loading state
  }),

  getters: {},
  actions: {
    init() {
      // check if user is already signed in, user is filled in after refresh
      authStateListener((user) => {
        if (user) {
          console.log(`User signed in: ${user.uid}`);
          this.user = user;
        } else {
          console.log("User signed out.");
          this.user = null;
          this.router.push(RouteEnum.HOME.path);
          useTeamStore().clearData();
        }
      });
    },

    // **Login Action**
    async login(credentials: ICredentials) {
      this.isLoading = true;

      try {
        this.user = await loginUser(credentials.email, credentials.password);
        this.router.push(RouteEnum.DASHBOARD.path);
      } catch (error) {
        console.error("Login failed:", error.message);
      } finally {
        this.isLoading = false;
      }
    },

    // **Logout Action**
    async logout() {
      try {
        await logoutUser();
        this.user = null;
        useTeamStore().clearData();
        this.router.push(RouteEnum.LOGIN.path);
      } catch (error) {
        console.error("Logout failed:", error.message);
      }
    },

    // **Register a New User**
    async register(credentials: ICredentials) {
      try {
        console.log(`registering user: ${JSON.stringify(credentials)}`);
        this.user = await registerUser(credentials.email, credentials.password, credentials.name);
        this.router.push(RouteEnum.DASHBOARD.path);
      } catch (error) {
        console.error("Registration failed:", error.message);
      }
    },
  }
})
