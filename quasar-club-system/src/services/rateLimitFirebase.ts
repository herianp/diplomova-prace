import { db } from '@/firebase/config'
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  increment,
} from 'firebase/firestore'
import { IRateLimitConfig } from '@/interfaces/interfaces'

const RATE_LIMITS_COLLECTION = 'rateLimits'
const GLOBAL_DOC_ID = 'global'

const DEFAULT_CONFIG: IRateLimitConfig = {
  teamCreation: 5,
  messages: 50,
  joinRequests: 5,
  surveys: 10,
  fines: 500,
}

export function useRateLimitFirebase() {
  /**
   * Get the global rate limit config document.
   * If it doesn't exist, creates it with defaults and returns defaults.
   */
  const getRateLimitConfig = async (): Promise<IRateLimitConfig> => {
    const ref = doc(db, RATE_LIMITS_COLLECTION, GLOBAL_DOC_ID)
    const snapshot = await getDoc(ref)

    if (!snapshot.exists()) {
      await setDoc(ref, DEFAULT_CONFIG)
      return { ...DEFAULT_CONFIG }
    }

    return snapshot.data() as IRateLimitConfig
  }

  /**
   * Set up a real-time listener on the global rate limit config document.
   * Returns the unsubscribe function.
   */
  const setRateLimitListener = (callback: (config: IRateLimitConfig) => void): (() => void) => {
    const ref = doc(db, RATE_LIMITS_COLLECTION, GLOBAL_DOC_ID)
    return onSnapshot(ref, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as IRateLimitConfig)
      } else {
        // Seed defaults if document doesn't exist yet
        setDoc(ref, DEFAULT_CONFIG).then(() => {
          callback({ ...DEFAULT_CONFIG })
        })
      }
    })
  }

  /**
   * Update a single field on the global rate limit config document.
   */
  const updateRateLimitConfig = async (
    field: keyof IRateLimitConfig,
    value: number
  ): Promise<void> => {
    const ref = doc(db, RATE_LIMITS_COLLECTION, GLOBAL_DOC_ID)
    await updateDoc(ref, { [field]: value })
  }

  /**
   * Read the usage sub-object from a user document.
   */
  const getUserUsage = async (userId: string): Promise<Record<string, unknown>> => {
    const ref = doc(db, 'users', userId)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return {}
    const data = snapshot.data()
    return (data.usage as Record<string, unknown>) ?? {}
  }

  /**
   * Increment a usage counter field on the user document using Firestore increment.
   */
  const incrementUserUsage = async (
    userId: string,
    field: string,
    value = 1
  ): Promise<void> => {
    const ref = doc(db, 'users', userId)
    await updateDoc(ref, { [`usage.${field}`]: increment(value) })
  }

  /**
   * Reset a weekly counter on the user document to 0 and set the weekStart to now.
   */
  const resetWeeklyCounter = async (
    userId: string,
    field: string,
    weekStartField: string
  ): Promise<void> => {
    const ref = doc(db, 'users', userId)
    await updateDoc(ref, {
      [`usage.${field}`]: 0,
      [`usage.${weekStartField}`]: new Date(),
    })
  }

  /**
   * Read the usage sub-object from a team document.
   */
  const getTeamUsage = async (teamId: string): Promise<Record<string, unknown>> => {
    const ref = doc(db, 'teams', teamId)
    const snapshot = await getDoc(ref)
    if (!snapshot.exists()) return {}
    const data = snapshot.data()
    return (data.usage as Record<string, unknown>) ?? {}
  }

  /**
   * Increment a usage counter field on the team document using Firestore increment.
   */
  const incrementTeamUsage = async (teamId: string, field: string): Promise<void> => {
    const ref = doc(db, 'teams', teamId)
    await updateDoc(ref, { [`usage.${field}`]: increment(1) })
  }

  /**
   * Reset a daily counter on the team document to 0 and set the dateStart to now.
   */
  const resetDailyCounter = async (
    teamId: string,
    field: string,
    dateStartField: string
  ): Promise<void> => {
    const ref = doc(db, 'teams', teamId)
    await updateDoc(ref, {
      [`usage.${field}`]: 0,
      [`usage.${dateStartField}`]: new Date(),
    })
  }

  return {
    getRateLimitConfig,
    setRateLimitListener,
    updateRateLimitConfig,
    getUserUsage,
    incrementUserUsage,
    resetWeeklyCounter,
    getTeamUsage,
    incrementTeamUsage,
    resetDailyCounter,
  }
}
