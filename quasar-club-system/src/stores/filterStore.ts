import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { useSeasonStore } from '@/stores/seasonStore'

export interface SharedFilters {
  searchName: string
  dateFrom: string
  dateTo: string
}

const STORAGE_KEY = 'sharedFilters'

export const useFilterStore = defineStore('filter', () => {
  const seasonStore = useSeasonStore()

  const getSeasonDefaults = (): SharedFilters => ({
    searchName: '',
    dateFrom: seasonStore.activeSeason.startDate,
    dateTo: seasonStore.activeSeason.endDate
  })

  const loadFromStorage = (): SharedFilters | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as SharedFilters
      if (parsed.dateFrom && parsed.dateTo) return parsed
      return null
    } catch {
      return null
    }
  }

  const filters = ref<SharedFilters>(loadFromStorage() || getSeasonDefaults())

  // Persist to localStorage on every change
  watch(filters, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  // Reset filters when season changes
  watch(() => seasonStore.selectedSeasonKey, () => {
    filters.value = getSeasonDefaults()
  })

  function updateFilters(partial: Partial<SharedFilters>) {
    Object.assign(filters.value, partial)
  }

  function resetToSeason() {
    filters.value = getSeasonDefaults()
  }

  return {
    filters,
    getSeasonDefaults,
    updateFilters,
    resetToSeason
  }
})
