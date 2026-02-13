import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('default filters', () => {
    it('has season date range as defaults', () => {
      const { filters } = useSurveyFilters()
      expect(filters.value.dateFrom).toBe('2025-07-13')
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
        dateFrom: '2025-07-13',
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
      expect(filters.value.dateFrom).toBe('2025-07-13')
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
      expect(filters.value.dateFrom).toBe('2025-07-13')
    })
  })
})
