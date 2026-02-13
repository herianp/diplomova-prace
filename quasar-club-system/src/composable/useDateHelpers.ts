import { DateTime } from "luxon";
import { SEASON_CONFIG } from '@/config/seasonConfig';

interface DatePreset {
  key: string
  label: string
  from: string
  to: string
}

export function useDateHelpers(locale = 'en') {

  /**
   * Converts YYYY-MM-DD to `D. monthName` in current locale.
   * Example: "2024-12-05" → "5. prosinec"
   */
  const formatDayAndMonth = (dateString: string): string => {
    const date = DateTime.fromISO(dateString).setLocale(locale);
    return `${date.day}. ${date.toFormat("LLLL")}`; // "5. prosinec"
  };

  const getDayName = (jsDate: Date): string => {
    const luxonDate = DateTime.fromJSDate(jsDate).setLocale(locale)
    return luxonDate.toFormat('cccc')
  }

  const getFormatDate = (jsDate: Date): string => {
    const luxonDate = DateTime.fromJSDate(jsDate).setLocale(locale)
    return luxonDate.toFormat('HH:mm (d.LLLL)')
  }

  const getDateByDateAndTime = (date: string, time: string): Date => {
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
  }

  const getDisplayedDateTime = (date: string, time: string): string => {
    const dateTime = getDateByDateAndTime(date, time)
    const dayName = getDayName(dateTime)
    const formatDate = getFormatDate(dateTime)
    return `${dayName}, ${formatDate}`
  }

  /**
   * Get current date in ISO format
   */
  const getCurrentDate = (): string => {
    return DateTime.now().toISODate()
  }

  /**
   * Format date string to display format
   */
  const formatDateForDisplay = (dateString: string): string => {
    const date = DateTime.fromISO(dateString).setLocale(locale)
    return date.toFormat('d. LLLL yyyy')
  }

  /**
   * Get date range presets for filtering
   */
  const getDatePresets = (t?: (key: string) => string): DatePreset[] => {
    const translateKey = t || ((key: string) => key)

    return [
      {
        key: 'season',
        label: translateKey('reports.thisSeason'),
        from: SEASON_CONFIG.startDate,
        to: SEASON_CONFIG.endDate
      },
      {
        key: 'thisMonth',
        label: translateKey('reports.thisMonth'),
        from: DateTime.now().startOf('month').toISODate(),
        to: DateTime.now().endOf('month').toISODate()
      },
      {
        key: 'lastMonth',
        label: translateKey('reports.lastMonth'),
        from: DateTime.now().minus({ months: 1 }).startOf('month').toISODate(),
        to: DateTime.now().minus({ months: 1 }).endOf('month').toISODate()
      },
      {
        key: 'thisWeek',
        label: translateKey('reports.thisWeek'),
        from: DateTime.now().startOf('week').toISODate(),
        to: DateTime.now().endOf('week').toISODate()
      },
      {
        key: 'lastWeek',
        label: translateKey('reports.lastWeek'),
        from: DateTime.now().minus({ weeks: 1 }).startOf('week').toISODate(),
        to: DateTime.now().minus({ weeks: 1 }).endOf('week').toISODate()
      },
      {
        key: 'nextWeek',
        label: translateKey('reports.nextWeek'),
        from: DateTime.now().plus({ weeks: 1 }).startOf('week').toISODate(),
        to: DateTime.now().plus({ weeks: 1 }).endOf('week').toISODate()
      },
      {
        key: 'nextMonth',
        label: translateKey('reports.nextMonth'),
        from: DateTime.now().plus({ months: 1 }).startOf('month').toISODate(),
        to: DateTime.now().plus({ months: 1 }).endOf('month').toISODate()
      },
      {
        key: 'last7Days',
        label: translateKey('reports.last7Days'),
        from: DateTime.now().minus({ days: 7 }).toISODate(),
        to: DateTime.now().toISODate()
      },
      {
        key: 'last30Days',
        label: translateKey('reports.last30Days'),
        from: DateTime.now().minus({ days: 30 }).toISODate(),
        to: DateTime.now().toISODate()
      }
    ]
  }

  /**
   * Get seasonal date range (default for football season)
   */
  const getSeasonDateRange = () => {
    return {
      from: SEASON_CONFIG.startDate,
      to: SEASON_CONFIG.endDate
    }
  }

  /**
   * Check if a date is within a range
   */
  const isDateInRange = (date: string, fromDate?: string, toDate?: string): boolean => {
    if (!fromDate && !toDate) return true

    const targetDate = DateTime.fromISO(date)

    if (fromDate && toDate) {
      const from = DateTime.fromISO(fromDate)
      const to = DateTime.fromISO(toDate)
      return targetDate >= from && targetDate <= to
    }

    if (fromDate) {
      const from = DateTime.fromISO(fromDate)
      return targetDate >= from
    }

    if (toDate) {
      const to = DateTime.fromISO(toDate)
      return targetDate <= to
    }

    return true
  }

  /**
   * Get relative date string (e.g., "2 days ago", "in 3 days")
   */
  const getRelativeDate = (dateString: string): string => {
    const date = DateTime.fromISO(dateString).setLocale(locale)
    const now = DateTime.now().setLocale(locale)

    return date.toRelative({ base: now }) || date.toFormat('d. LLLL yyyy')
  }

  return {
    formatDayAndMonth,
    getDayName,
    getDateByDateAndTime,
    getFormatDate,
    getDisplayedDateTime,
    getCurrentDate,
    formatDateForDisplay,
    getDatePresets,
    getSeasonDateRange,
    isDateInRange,
    getRelativeDate
  }
}

// Export types
export type { DatePreset }
