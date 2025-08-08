import { computed, ref } from 'vue'
import { DateTime } from 'luxon'

interface SurveyFilters {
  searchName: string
  dateFrom: string
  dateTo: string
}

interface Survey {
  id: string
  title: string
  date: string
  time: string
  createdDate: string
  [key: string]: any
}

export function useSurveyFilters() {
  // Default filter state with season dates
  const defaultFilters: SurveyFilters = {
    searchName: '',
    dateFrom: '2025-07-13', // Season start
    dateTo: '2026-06-30'    // Season end
  }

  const filters = ref<SurveyFilters>({ ...defaultFilters })

  /**
   * Filter surveys based on search name and date range
   */
  const filterSurveys = (surveys: Survey[], customFilters?: SurveyFilters) => {
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
  const createFilteredSurveys = (surveys: any, customFilters?: any) => {
    return computed(() => {
      const surveysValue = Array.isArray(surveys.value) ? surveys.value : surveys
      const filtersValue = customFilters?.value || filters.value

      const filtered = filterSurveys(surveysValue, filtersValue)

      // Sort: oldest first (ascending order)
      return filtered.sort((a, b) => a.date.localeCompare(b.date))
    })
  }

  /**
   * Create a computed property for recent surveys (newest first, limited)
   */
  const createRecentFilteredSurveys = (surveys: any, limit = 5, customFilters?: any) => {
    return computed(() => {
      const surveysValue = Array.isArray(surveys.value) ? surveys.value : surveys
      const filtersValue = customFilters?.value || filters.value

      const filtered = filterSurveys(surveysValue, filtersValue)

      // Sort by creation date: newest first (descending order) and limit
      return filtered
        .slice()
        .sort((a, b) => parseInt(b.createdDate) - parseInt(a.createdDate))
        .slice(0, limit)
    })
  }

  /**
   * Apply date preset to filters
   */
  const applyDatePreset = (preset: { from: string; to: string }) => {
    filters.value.dateFrom = preset.from
    filters.value.dateTo = preset.to
  }

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    filters.value = { ...defaultFilters }
  }

  /**
   * Reset filters to default season dates
   */
  const resetToSeason = () => {
    filters.value = { ...defaultFilters }
  }

  /**
   * Set current date as dateTo (useful for "up to now" filters)
   */
  const setDateToNow = () => {
    filters.value.dateTo = DateTime.now().toISODate()
  }

  /**
   * Update filters (reactive)
   */
  const updateFilters = (newFilters: Partial<SurveyFilters>) => {
    Object.assign(filters.value, newFilters)
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
    updateFilters
  }
}

// Export types for use in other files
export type { SurveyFilters, Survey }
