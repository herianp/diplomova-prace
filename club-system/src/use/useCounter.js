import { useCounterStore } from '@/stores/counter' // Assuming the store is saved in /stores/counter.js
import { computed } from 'vue'
import { storeToRefs } from 'pinia'

export function useCounter() {
    const counterStore= useCounterStore()

    const bigTitle = computed(() => counterStore.title.toUpperCase());
    // Return state, getters, and actions
    return {
        bigTitle
    }
}
