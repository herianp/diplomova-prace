import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDateHelpers } from '../useDateHelpers'

describe('useDateHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T12:00:00'))
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDayAndMonth', () => {
    it('formats date with day and month name in English', () => {
      const { formatDayAndMonth } = useDateHelpers('en')
      const result = formatDayAndMonth('2025-12-05')
      expect(result).toBe('5. December')
    })

    it('formats date with day and month name in Czech', () => {
      const { formatDayAndMonth } = useDateHelpers('cs')
      const result = formatDayAndMonth('2025-12-05')
      expect(result).toBe('5. prosinec')
    })
  })

  describe('getDayName', () => {
    it('returns day name in English', () => {
      const { getDayName } = useDateHelpers('en')
      // 2025-10-15 is a Wednesday
      const result = getDayName(new Date('2025-10-15T12:00:00'))
      expect(result).toBe('Wednesday')
    })
  })

  describe('getDateByDateAndTime', () => {
    it('creates correct Date from date and time strings', () => {
      const { getDateByDateAndTime } = useDateHelpers()
      const result = getDateByDateAndTime('2025-12-25', '14:30')
      expect(result.getFullYear()).toBe(2025)
      expect(result.getMonth()).toBe(11) // December = 11
      expect(result.getDate()).toBe(25)
      expect(result.getHours()).toBe(14)
      expect(result.getMinutes()).toBe(30)
    })
  })

  describe('getDisplayedDateTime', () => {
    it('returns formatted day name and date/time', () => {
      const { getDisplayedDateTime } = useDateHelpers('en')
      const result = getDisplayedDateTime('2025-10-15', '18:00')
      // Should contain Wednesday and 18:00
      expect(result).toContain('Wednesday')
      expect(result).toContain('18:00')
    })
  })

  describe('getCurrentDate', () => {
    it('returns current date in ISO format', () => {
      const { getCurrentDate } = useDateHelpers()
      expect(getCurrentDate()).toBe('2025-10-15')
    })
  })

  describe('formatDateForDisplay', () => {
    it('formats date for display in English', () => {
      const { formatDateForDisplay } = useDateHelpers('en')
      const result = formatDateForDisplay('2025-12-25')
      expect(result).toBe('25. December 2025')
    })
  })

  describe('getDatePresets', () => {
    it('returns array of date presets', () => {
      const { getDatePresets } = useDateHelpers()
      const presets = getDatePresets()
      expect(presets.length).toBeGreaterThan(0)
      expect(presets[0].key).toBe('season')
    })

    it('season preset uses active season dates from store', () => {
      const { getDatePresets } = useDateHelpers()
      const presets = getDatePresets()
      const season = presets.find(p => p.key === 'season')
      expect(season?.from).toBe('2025-07-01')
      expect(season?.to).toBe('2026-06-30')
    })

    it('thisMonth preset covers full current month', () => {
      const { getDatePresets } = useDateHelpers()
      const presets = getDatePresets()
      const thisMonth = presets.find(p => p.key === 'thisMonth')
      expect(thisMonth?.from).toBe('2025-10-01')
      expect(thisMonth?.to).toBe('2025-10-31')
    })

    it('uses translation function when provided', () => {
      const { getDatePresets } = useDateHelpers()
      const mockT = (key: string) => `translated:${key}`
      const presets = getDatePresets(mockT)
      expect(presets[0].label).toBe('translated:reports.thisSeason')
    })
  })

  describe('getSeasonDateRange', () => {
    it('returns season date range from store', () => {
      const { getSeasonDateRange } = useDateHelpers()
      const range = getSeasonDateRange()
      expect(range.from).toBe('2025-07-01')
      expect(range.to).toBe('2026-06-30')
    })
  })

  describe('isDateInRange', () => {
    it('returns true when date is within range', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-10-15', '2025-10-01', '2025-10-31')).toBe(true)
    })

    it('returns false when date is before range', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-09-15', '2025-10-01', '2025-10-31')).toBe(false)
    })

    it('returns false when date is after range', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-11-15', '2025-10-01', '2025-10-31')).toBe(false)
    })

    it('returns true when no range is set', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-10-15')).toBe(true)
    })

    it('returns true when date equals range boundary', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-10-01', '2025-10-01', '2025-10-31')).toBe(true)
      expect(isDateInRange('2025-10-31', '2025-10-01', '2025-10-31')).toBe(true)
    })

    it('handles only fromDate', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-10-15', '2025-10-01')).toBe(true)
      expect(isDateInRange('2025-09-15', '2025-10-01')).toBe(false)
    })

    it('handles only toDate', () => {
      const { isDateInRange } = useDateHelpers()
      expect(isDateInRange('2025-10-15', undefined, '2025-10-31')).toBe(true)
      expect(isDateInRange('2025-11-15', undefined, '2025-10-31')).toBe(false)
    })
  })
})
