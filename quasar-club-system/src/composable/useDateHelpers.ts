import { DateTime } from "luxon";
import { useI18n } from "vue-i18n";

export function useDateHelpers() {
  const { locale } = useI18n();

  /**
   * Converts YYYY-MM-DD to `D. monthName` in current locale.
   * Example: "2024-12-05" → "5. prosinec"
   */
  const formatDayAndMonth = (dateString: string): string => {
    const date = DateTime.fromISO(dateString).setLocale(locale.value);
    return `${date.day}. ${date.toFormat("LLLL")}`; // "5. prosinec"
  };


  const getDayName = (jsDate: Date): string => {
    const luxonDate = DateTime.fromJSDate(jsDate).setLocale(locale.value)
    return luxonDate.toFormat('cccc')
  }

  const getFormatDate = (jsDate: Date): string => {
    const luxonDate = DateTime.fromJSDate(jsDate).setLocale(locale.value)
    return luxonDate.toFormat('HH:mm (d.LLLL)')
  }

  const getDateByDateAndTime = (date: string, time: string): Date => {
    const [year, month, day] = date.split('-').map(Number)
    const [hour, minute] = time.split(':').map(Number)
    return new Date(year, month - 1, day, hour, minute)
  }

  return {
    formatDayAndMonth,
    getDayName,
    getDateByDateAndTime,
    getFormatDate
  }
}
