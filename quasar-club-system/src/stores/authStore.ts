import { defineStore } from 'pinia'
import { authStateListener } from "@/services/authService";
import { RouteEnum } from "@/enums/routesEnum";
import { useTeamStore } from "@/stores/teamStore";
import { ref } from 'vue'
import { getAuth, signOut as firebaseSignOut } from 'firebase/auth'

const getInitialUser = () => ({
  uid: '1',
});

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: getInitialUser(),
    isLoading: ref(false), // Global loading state
    isAdmin: ref(true), // Global loading state
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

    //setters
    setUser(user: any) {
      this.user = user;
    },
    setLoading(user: any) {
      this.isLoading = user;
    },

    async refreshUser() {
      const auth = getAuth()
      if (auth.currentUser) {
        await auth.currentUser.reload()
        this.user = auth.currentUser
      }
    },

    async signOut() {
      const auth = getAuth()
      await firebaseSignOut(auth)
      this.user = null
      useTeamStore().clearData()
    },
  }
})
