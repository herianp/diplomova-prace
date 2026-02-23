import { ref, type Ref } from 'vue'
import { DateTime } from 'luxon'

interface WeatherData {
  icon: string
  temp: number
  description: string
}

interface HourlyForecast {
  hourly: {
    time: string[]
    temperature_2m: number[]
    weather_code: number[]
  }
}

interface ForecastCacheEntry {
  data: HourlyForecast | null
  fetchedAt: number
}

// Module-level in-memory cache keyed by "lat,lng"
const cacheMap = new Map<string, ForecastCacheEntry>()

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
const SESSION_STORAGE_KEY = 'weatherForecastCache'

function weathercodeToIcon(code: number): string {
  if (code === 0) return 'wb_sunny'
  if (code >= 1 && code <= 3) return 'cloud'
  if (code === 45 || code === 48) return 'foggy'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return 'water_drop'
  if ([71, 73, 75, 77].includes(code)) return 'ac_unit'
  if ([80, 81, 82].includes(code)) return 'grain'
  if ([95, 96, 99].includes(code)) return 'thunderstorm'
  return 'cloud'
}

function weathercodeToCategory(code: number): string {
  if (code === 0) return 'clear'
  if (code >= 1 && code <= 3) return 'partlyCloudy'
  if (code === 45 || code === 48) return 'fog'
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return 'rain'
  if ([71, 73, 75, 77].includes(code)) return 'snow'
  if ([80, 81, 82].includes(code)) return 'showers'
  if ([95, 96, 99].includes(code)) return 'thunderstorm'
  return 'unknown'
}

// Restore cache from sessionStorage on module load
function restoreFromSession(): void {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return
    const entries: Record<string, ForecastCacheEntry> = JSON.parse(stored)
    const now = Date.now()
    for (const [key, entry] of Object.entries(entries)) {
      if (entry.data && now - entry.fetchedAt < CACHE_TTL_MS) {
        cacheMap.set(key, entry)
      }
    }
  } catch {
    // Ignore parse errors
  }
}

function saveToSession(): void {
  try {
    const obj: Record<string, ForecastCacheEntry> = {}
    cacheMap.forEach((value, key) => { obj[key] = value })
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(obj))
  } catch {
    // Ignore quota errors
  }
}

restoreFromSession()

async function fetchForecast(latitude: number, longitude: number): Promise<HourlyForecast | null> {
  const cacheKey = `${latitude},${longitude}`
  const cached = cacheMap.get(cacheKey)
  const now = Date.now()
  if (cached?.data && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m,weather_code&timezone=Europe/Prague&forecast_days=16`
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    cacheMap.set(cacheKey, { data: json, fetchedAt: now })
    saveToSession()
    return json
  } catch {
    return null
  }
}

export function useWeatherService() {
  /**
   * Get weather for a specific date and time.
   * @param dateString - Survey date in YYYY-MM-DD format
   * @param time - Survey time in HH:MM format (e.g. "18:00")
   * @param latitude - Location latitude (defaults to Prague)
   * @param longitude - Location longitude (defaults to Prague)
   */
  function getWeatherForDate(dateString: string, time = '12:00', latitude = 50.08, longitude = 14.42): Ref<WeatherData | null> {
    const result = ref<WeatherData | null>(null)

    const today = DateTime.now().startOf('day')
    const targetDate = DateTime.fromISO(dateString).startOf('day')
    const diffDays = targetDate.diff(today, 'days').days

    if (diffDays < 0 || diffDays > 15) {
      return result
    }

    fetchForecast(latitude, longitude).then((forecast) => {
      if (!forecast) return

      // Build the target hourly key: "YYYY-MM-DDTHH:00" (Open-Meteo uses full hours)
      const hour = time.split(':')[0].padStart(2, '0')
      const targetKey = `${dateString}T${hour}:00`

      const index = forecast.hourly.time.indexOf(targetKey)
      if (index === -1) return

      const code = forecast.hourly.weather_code[index]
      result.value = {
        icon: weathercodeToIcon(code),
        temp: Math.round(forecast.hourly.temperature_2m[index]),
        description: `weather.code.${weathercodeToCategory(code)}`,
      }
    })

    return result
  }

  return { getWeatherForDate }
}
