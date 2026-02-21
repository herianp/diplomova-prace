import { computed, Ref } from 'vue'
import { DateTime } from 'luxon'
import { ISurvey } from '@/interfaces/interfaces'
import { useSeasonStore } from '@/stores/seasonStore'
import { useFilterStore } from '@/stores/filterStore'

export interface SurveyFilters {
  searchName: string
  dateFrom: string
  dateTo: string
}

export function useSurveyFilters() {
  const seasonStore = useSeasonStore()
  const filterStore = useFilterStore()

  // Default filter state with season dates from store
  const defaultFilters = computed<SurveyFilters>(() => ({
    searchName: '',
    dateFrom: seasonStore.activeSeason.startDate,
    dateTo: seasonStore.activeSeason.endDate
  }))

  // Writable computed backed by filterStore — shared singleton
  const filters = computed({
    get: () => filterStore.filters,
    set: (val: SurveyFilters) => {
      filterStore.filters = val
    }
  })

  /**
   * Clamp a date within the active season boundaries
   */
  const clampToSeason = (date: string): string => {
    const season = seasonStore.activeSeason
    if (date < season.startDate) return season.startDate
    if (date > season.endDate) return season.endDate
    return date
  }

  /**
   * Filter surveys based on search name and date range
   */
  const filterSurveys = (surveys: ISurvey[], customFilters?: SurveyFilters) => {
    const activeFilters = customFilters || filters.value
    let filtered = [...surveys]

    // Apply name search filter
    if (activeFilters.searchName?.trim()) {
      const searchTerm = activeFilters.searchName.toLowerCase().trim()
      filtered = filtered.filter(survey =>
        survey.title.toLowerCase().includes(searchTerm)
      )
    }

    // Apply date range filter
    if (activeFilters.dateFrom || activeFilters.dateTo) {
      filtered = filtered.filter(survey => {
        const surveyDate = survey.date

        // If both dates are set, check if survey is within range
        if (activeFilters.dateFrom && activeFilters.dateTo) {
          return surveyDate >= activeFilters.dateFrom && surveyDate <= activeFilters.dateTo
        }

        // If only dateFrom is set, check if survey is on or after that date
        if (activeFilters.dateFrom) {
          return surveyDate >= activeFilters.dateFrom
        }

        // If only dateTo is set, check if survey is on or before that date
        if (activeFilters.dateTo) {
          return surveyDate <= activeFilters.dateTo
        }

        return true
      })
    }

    return filtered
  }

  /**
   * Create a computed property for filtered surveys
   */
  const createFilteredSurveys = (surveys: Ref<ISurvey[]>, customFilters?: Ref<SurveyFilters>) => {
    return computed(() => {
      const surveysValue = surveys.value
      const filtersValue = customFilters?.value || filters.value

      const filtered = filterSurveys(surveysValue, filtersValue)

      // Sort: oldest first (ascending order)
      return filtered.sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  /**
   * Create a computed property for recent surveys (newest first, limited)
   */
  const createRecentFilteredSurveys = (surveys: Ref<ISurvey[]>, limit = 5, customFilters?: Ref<SurveyFilters>) => {
    return computed(() => {
      const surveysValue = surveys.value
      const filtersValue = customFilters?.value || filters.value

      const filtered = filterSurveys(surveysValue, filtersValue)

      // Sort by creation date: newest first (descending order) and limit
      return filtered
        .slice()
        .sort((a, b) => parseInt(b.createdDate || '0') - parseInt(a.createdDate || '0'))
        .slice(0, limit)
    })
  }

  /**
   * Apply date preset to filters
   */
  const applyDatePreset = (preset: { from: string; to: string }) => {
    filterStore.updateFilters({ dateFrom: preset.from, dateTo: preset.to })
  }

  /**
   * Clear all filters - resets to season defaults
   */
  const clearFilters = () => {
    filterStore.resetToSeason()
  }

  /**
   * Reset filters to default season dates
   */
  const resetToSeason = () => {
    filterStore.resetToSeason()
  }

  /**
   * Set current date as dateTo (useful for "up to now" filters)
   */
  const setDateToNow = () => {
    filterStore.updateFilters({ dateTo: DateTime.now().toISODate() })
  }

  /**
   * Update filters (reactive)
   */
  const updateFilters = (newFilters: Partial<SurveyFilters>) => {
    filterStore.updateFilters(newFilters)
  }

  return {
    filters,
    defaultFilters,
    filterSurveys,
    createFilteredSurveys,
    createRecentFilteredSurveys,
    applyDatePreset,
    clearFilters,
    resetToSeason,
    setDateToNow,
    updateFilters,
    clampToSeason
  }
}
