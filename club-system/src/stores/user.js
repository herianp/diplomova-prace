import { defineStore } from 'pinia'

export const useUserStore = defineStore({
    id: 'user',
    state: () => ({
        user: {
            id: 4,
            name: 'User Name',
            email: 'email@seznam.cz',
        }
    }),
    getters: {
    },
    actions: {
    }
})