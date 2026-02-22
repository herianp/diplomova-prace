import { ref, type Ref } from 'vue'
import { DateTime } from 'luxon'

interface WeatherData {
  icon: string
  tempMax: number
  tempMin: number
  description: string
}

interface ForecastCache {
  data: {
    daily: {
      time: string[]
      temperature_2m_max: number[]
      temperature_2m_min: number[]
      weathercode: number[]
    }
  } | null
  fetchedAt: number
}

// Module-level cache shared across all composable instances
const cache: ForecastCache = {
  data: null,
  fetchedAt: 0,
}

const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

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

async function fetchForecast(): Promise<ForecastCache['data']> {
  const now = Date.now()
  if (cache.data && now - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.data
  }

  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=50.08&longitude=14.42&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe/Prague&forecast_days=16'
    const response = await fetch(url)
    if (!response.ok) return null
    const json = await response.json()
    cache.data = json
    cache.fetchedAt = now
    return cache.data
  } catch {
    return null
  }
}

export function useWeatherService() {
  function getWeatherForDate(dateString: string): Ref<WeatherData | null> {
    const result = ref<WeatherData | null>(null)

    const today = DateTime.now().startOf('day')
    const targetDate = DateTime.fromISO(dateString).startOf('day')
    const diffDays = targetDate.diff(today, 'days').days

    if (diffDays < 0 || diffDays > 15) {
      return result
    }

    fetchForecast().then((forecast) => {
      if (!forecast) return

      const index = forecast.daily.time.indexOf(dateString)
      if (index === -1) return

      const code = forecast.daily.weathercode[index]
      result.value = {
        icon: weathercodeToIcon(code),
        tempMax: Math.round(forecast.daily.temperature_2m_max[index]),
        tempMin: Math.round(forecast.daily.temperature_2m_min[index]),
        description: `weather.code.${weathercodeToCategory(code)}`,
      }
    })

    return result
  }

  return { getWeatherForDate }
}
