import { useSeasonStore } from '@/stores/seasonStore'

// Dynamic getter that reads from the season store
// Falls back to hardcoded values if store is not yet initialized
export const SEASON_CONFIG = {
  get startDate(): string {
    try {
      const store = useSeasonStore()
      return store.activeSeason.startDate
    } catch {
      return '2025-07-01'
    }
  },
  get endDate(): string {
    try {
      const store = useSeasonStore()
      return store.activeSeason.endDate
    } catch {
      return '2026-06-30'
    }
  }
}
