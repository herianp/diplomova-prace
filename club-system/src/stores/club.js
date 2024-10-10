import { defineStore } from 'pinia'

export const useClubStore = defineStore({
  id: 'club',
  state: () => ({
    clubName: 'Club Name',
  }),
  getters: {
  },
  actions: {
    setClubName(newName) {
      this.clubName = newName;
    }
  }
})
