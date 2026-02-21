import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import { useSurveyFilters } from '../useSurveyFilters'
import { ISurvey } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'

// Helper to create mock survey
const createMockSurvey = (overrides: Partial<ISurvey> = {}): ISurvey => ({
  id: 'survey-1',
  createdDate: '1700000000',
  date: '2025-10-15',
  time: '18:00',
  dateTime: new Date('2025-10-15T18:00:00'),
  title: 'Test Survey',
  description: 'Test',
  teamId: 'team-1',
  type: SurveyTypes.Training,
  votes: [],
  ...overrides
})

describe('useSurveyFilters', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T12:00:00'))
    localStorage.removeItem('sharedFilters')
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('default filters', () => {
    it('has season date range as defaults', () => {
      const { filters } = useSurveyFilters()
      expect(filters.value.dateFrom).toBe('2025-07-01')
      expect(filters.value.dateTo).toBe('2026-06-30')
      expect(filters.value.searchName).toBe('')
    })
  })

  describe('filterSurveys', () => {
    const surveys: ISurvey[] = [
      createMockSurvey({ id: '1', date: '2025-08-01', title: 'Training Monday' }),
      createMockSurvey({ id: '2', date: '2025-09-15', title: 'Match vs FC' }),
      createMockSurvey({ id: '3', date: '2025-11-20', title: 'Training Wednesday' }),
      createMockSurvey({ id: '4', date: '2024-06-01', title: 'Old Survey' }),
      createMockSurvey({ id: '5', date: '2026-05-01', title: 'Future Training' })
    ]

    it('filters by search name (case-insensitive)', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys(surveys, {
        searchName: 'training',
        dateFrom: '',
        dateTo: ''
      })
      expect(result).toHaveLength(3)
      expect(result.map(s => s.id)).toEqual(['1', '3', '5'])
    })

    it('filters by date range', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys(surveys, {
        searchName: '',
        dateFrom: '2025-09-01',
        dateTo: '2025-12-31'
      })
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['2', '3'])
    })

    it('filters by both name and date range', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys(surveys, {
        searchName: 'training',
        dateFrom: '2025-07-01',
        dateTo: '2025-12-31'
      })
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['1', '3'])
    })

    it('returns all surveys when no filters active', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys(surveys, {
        searchName: '',
        dateFrom: '',
        dateTo: ''
      })
      expect(result).toHaveLength(5)
    })

    it('handles empty surveys array', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys([], {
        searchName: 'test',
        dateFrom: '',
        dateTo: ''
      })
      expect(result).toHaveLength(0)
    })

    it('trims search name whitespace', () => {
      const { filterSurveys } = useSurveyFilters()
      const result = filterSurveys(surveys, {
        searchName: '  match  ',
        dateFrom: '',
        dateTo: ''
      })
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('2')
    })
  })

  describe('applyDatePreset', () => {
    it('updates filter dates from preset', () => {
      const { filters, applyDatePreset } = useSurveyFilters()
      applyDatePreset({ from: '2025-01-01', to: '2025-06-30' })
      expect(filters.value.dateFrom).toBe('2025-01-01')
      expect(filters.value.dateTo).toBe('2025-06-30')
    })
  })

  describe('clearFilters', () => {
    it('resets filters to defaults', () => {
      const { filters, clearFilters } = useSurveyFilters()
      filters.value.searchName = 'test'
      filters.value.dateFrom = '2025-01-01'
      clearFilters()
      expect(filters.value.searchName).toBe('')
      expect(filters.value.dateFrom).toBe('2025-07-01')
      expect(filters.value.dateTo).toBe('2026-06-30')
    })
  })

  describe('setDateToNow', () => {
    it('sets dateTo to current date', () => {
      const { filters, setDateToNow } = useSurveyFilters()
      setDateToNow()
      expect(filters.value.dateTo).toBe('2025-10-15')
    })
  })

  describe('updateFilters', () => {
    it('merges partial filter updates', () => {
      const { filters, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: 'new search' })
      expect(filters.value.searchName).toBe('new search')
      // Other filters unchanged
      expect(filters.value.dateFrom).toBe('2025-07-01')
    })
  })

  describe('createFilteredSurveys', () => {
    it('returns computed sorted by date ascending', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', date: '2025-09-15', title: 'B' }),
        createMockSurvey({ id: '2', date: '2025-08-01', title: 'A' }),
        createMockSurvey({ id: '3', date: '2025-11-20', title: 'C' }),
      ])
      const { createFilteredSurveys, updateFilters } = useSurveyFilters()
      // Clear date filters so all surveys pass through
      updateFilters({ dateFrom: '', dateTo: '' })
      const result = createFilteredSurveys(surveys)
      expect(result.value.map(s => s.id)).toEqual(['2', '1', '3'])
    })

    it('filters by searchName reactively', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', date: '2025-09-15', title: 'Training Monday' }),
        createMockSurvey({ id: '2', date: '2025-08-01', title: 'Match vs FC' }),
        createMockSurvey({ id: '3', date: '2025-10-20', title: 'Training Wednesday' }),
      ])
      const { createFilteredSurveys, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: 'training', dateFrom: '', dateTo: '' })
      const result = createFilteredSurveys(surveys)
      expect(result.value).toHaveLength(2)
      expect(result.value.map(s => s.id)).toEqual(['1', '3'])
    })

    it('uses custom filters ref when provided', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', date: '2025-09-15', title: 'Match' }),
        createMockSurvey({ id: '2', date: '2025-08-01', title: 'Training' }),
      ])
      const customFilters = ref({ searchName: 'match', dateFrom: '', dateTo: '' })
      const { createFilteredSurveys } = useSurveyFilters()
      const result = createFilteredSurveys(surveys, customFilters)
      expect(result.value).toHaveLength(1)
      expect(result.value[0].id).toBe('1')
    })

    it('updates reactively when surveys ref changes', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', date: '2025-09-15', title: 'A' }),
      ])
      const { createFilteredSurveys, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: '', dateFrom: '', dateTo: '' })
      const result = createFilteredSurveys(surveys)
      expect(result.value).toHaveLength(1)

      surveys.value = [
        createMockSurvey({ id: '1', date: '2025-09-15', title: 'A' }),
        createMockSurvey({ id: '2', date: '2025-08-01', title: 'B' }),
      ]
      expect(result.value).toHaveLength(2)
    })
  })

  describe('createRecentFilteredSurveys', () => {
    it('returns computed sorted by createdDate descending, limited to 5 by default', () => {
      const surveys = ref(
        Array.from({ length: 8 }, (_, i) =>
          createMockSurvey({ id: `${i}`, createdDate: `${1700000000 + i * 1000}`, date: '2025-10-15' })
        )
      )
      const { createRecentFilteredSurveys, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: '', dateFrom: '', dateTo: '' })
      const result = createRecentFilteredSurveys(surveys)
      expect(result.value).toHaveLength(5)
      // Newest first: id 7 has highest createdDate
      expect(result.value[0].id).toBe('7')
    })

    it('respects custom limit parameter', () => {
      const surveys = ref(
        Array.from({ length: 8 }, (_, i) =>
          createMockSurvey({ id: `${i}`, createdDate: `${1700000000 + i * 1000}`, date: '2025-10-15' })
        )
      )
      const { createRecentFilteredSurveys, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: '', dateFrom: '', dateTo: '' })
      const result = createRecentFilteredSurveys(surveys, 3)
      expect(result.value).toHaveLength(3)
      expect(result.value[0].id).toBe('7')
    })

    it('applies searchName filter before limiting', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', title: 'Training A', createdDate: '1700005000', date: '2025-10-15' }),
        createMockSurvey({ id: '2', title: 'Match', createdDate: '1700004000', date: '2025-10-15' }),
        createMockSurvey({ id: '3', title: 'Training B', createdDate: '1700003000', date: '2025-10-15' }),
        createMockSurvey({ id: '4', title: 'Match 2', createdDate: '1700002000', date: '2025-10-15' }),
        createMockSurvey({ id: '5', title: 'Training C', createdDate: '1700001000', date: '2025-10-15' }),
        createMockSurvey({ id: '6', title: 'Training D', createdDate: '1700000000', date: '2025-10-15' }),
      ])
      const customFilters = ref({ searchName: 'training', dateFrom: '', dateTo: '' })
      const { createRecentFilteredSurveys } = useSurveyFilters()
      const result = createRecentFilteredSurveys(surveys, 5, customFilters)
      // Only Training surveys (4 total), all returned since limit=5
      expect(result.value.every(s => s.title.toLowerCase().includes('training'))).toBe(true)
      expect(result.value).toHaveLength(4)
      // Newest first
      expect(result.value[0].id).toBe('1')
    })

    it('handles missing createdDate gracefully (sorts with 0 fallback)', () => {
      const surveys = ref([
        createMockSurvey({ id: '1', createdDate: '1700005000', date: '2025-10-15' }),
        createMockSurvey({ id: '2', createdDate: undefined, date: '2025-10-15' }),
        createMockSurvey({ id: '3', createdDate: '1700003000', date: '2025-10-15' }),
      ])
      const { createRecentFilteredSurveys, updateFilters } = useSurveyFilters()
      updateFilters({ searchName: '', dateFrom: '', dateTo: '' })
      // Should not throw; undefined createdDate sorts as 0 (oldest)
      expect(() => createRecentFilteredSurveys(surveys).value).not.toThrow()
      const result = createRecentFilteredSurveys(surveys)
      expect(result.value).toHaveLength(3)
      // id '1' has highest createdDate, should be first
      expect(result.value[0].id).toBe('1')
    })
  })
})
