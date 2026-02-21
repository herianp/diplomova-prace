import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { DateTime } from 'luxon'

export interface Season {
  key: string
  label: string
  startDate: string
  endDate: string
}

function generateSeasons(): Season[] {
  const now = DateTime.now()
  // A season runs July 1 → June 30. If we're in Jan-Jun, current season started last year.
  const currentSeasonStartYear = now.month >= 7 ? now.year : now.year - 1

  const seasons: Season[] = []
  // Generate: previous, current, next
  for (let i = -1; i <= 1; i++) {
    const startYear = currentSeasonStartYear + i
    const endYear = startYear + 1
    seasons.push({
      key: `${startYear}/${endYear}`,
      label: `${startYear}/${endYear}`,
      startDate: `${startYear}-07-01`,
      endDate: `${endYear}-06-30`
    })
  }
  return seasons
}

function detectCurrentSeasonKey(): string {
  const now = DateTime.now()
  const startYear = now.month >= 7 ? now.year : now.year - 1
  return `${startYear}/${startYear + 1}`
}

const STORAGE_KEY = 'selectedSeason'

export const useSeasonStore = defineStore('season', () => {
  const seasons = generateSeasons()
  const currentSeasonKey = detectCurrentSeasonKey()

  // Read from localStorage or fallback to current season
  const stored = localStorage.getItem(STORAGE_KEY)
  const initialKey = stored && seasons.some(s => s.key === stored) ? stored : currentSeasonKey

  const selectedSeasonKey = ref(initialKey)

  const activeSeason = computed<Season>(() => {
    return seasons.find(s => s.key === selectedSeasonKey.value) || seasons.find(s => s.key === currentSeasonKey)!
  })

  function selectSeason(key: string) {
    if (seasons.some(s => s.key === key)) {
      selectedSeasonKey.value = key
      localStorage.setItem(STORAGE_KEY, key)
    }
  }

  return {
    seasons,
    currentSeasonKey,
    selectedSeasonKey,
    activeSeason,
    selectSeason
  }
})
