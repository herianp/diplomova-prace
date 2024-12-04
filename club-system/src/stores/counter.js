import { defineStore } from 'pinia'

export const useCounterStore = defineStore({
  id: 'counter',
  state: () => ({
    counter: 0,
    title: 'stored init title'
  }),
  getters: {
    doubleCount: (state) => state.counter * 2,
    isNumberEven: (state) => state.counter % 2 === 0,
  },
  actions: {
    increment() {
      this.counter++;
    },
    decrement() {
      this.counter--;
    },
    setTitle(newTitle) {
      this.title = newTitle;
    }
  }
})
