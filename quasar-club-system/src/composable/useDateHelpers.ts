import { DateTime } from "luxon";

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
    console.log(`date ${date}, time ${time}`)
    const dateTime = getDateByDateAndTime(date, time)
    const dayName = getDayName(dateTime)
    const formatDate = getFormatDate(dateTime)
    return `${dayName}, ${formatDate}`
  }

  return {
    formatDayAndMonth,
    getDayName,
    getDateByDateAndTime,
    getFormatDate,
    getDisplayedDateTime
  }
}
