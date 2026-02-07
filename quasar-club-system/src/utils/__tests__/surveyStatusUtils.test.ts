import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isSurveyExpired,
  getSurveyStatus,
  getSurveyStatusDisplay,
  canModifyVotes,
  needsVerification,
  getSurveysNeedingVerification,
  getVerificationText
} from '../surveyStatusUtils'
import { ISurvey, SurveyStatus } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'

// Helper to create a mock survey
const createMockSurvey = (overrides: Partial<ISurvey> = {}): ISurvey => ({
  id: 'survey-1',
  date: '2025-12-01',
  time: '18:00',
  dateTime: new Date('2025-12-01T18:00:00'),
  title: 'Test Survey',
  description: 'Test description',
  teamId: 'team-1',
  type: SurveyTypes.Training,
  votes: [],
  ...overrides
})

describe('surveyStatusUtils', () => {
  beforeEach(() => {
    // Mock DateTime.now() to a fixed point: 2025-10-15T12:00:00
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-10-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('isSurveyExpired', () => {
    it('returns true for a past survey', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(isSurveyExpired(survey)).toBe(true)
    })

    it('returns false for a future survey', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      expect(isSurveyExpired(survey)).toBe(false)
    })

    it('returns false when date is missing', () => {
      const survey = createMockSurvey({ date: '', time: '18:00' })
      expect(isSurveyExpired(survey)).toBe(false)
    })

    it('returns false when time is missing', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '' })
      expect(isSurveyExpired(survey)).toBe(false)
    })

    it('returns true for a survey earlier today', () => {
      const survey = createMockSurvey({ date: '2025-10-15', time: '08:00' })
      expect(isSurveyExpired(survey)).toBe(true)
    })

    it('returns false for a survey later today', () => {
      const survey = createMockSurvey({ date: '2025-10-15', time: '20:00' })
      expect(isSurveyExpired(survey)).toBe(false)
    })
  })

  describe('getSurveyStatus', () => {
    it('returns explicit status when set', () => {
      const survey = createMockSurvey({ status: SurveyStatus.CLOSED })
      expect(getSurveyStatus(survey, false)).toBe(SurveyStatus.CLOSED)
    })

    it('returns ACTIVE for non-expired survey', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      expect(getSurveyStatus(survey, false)).toBe(SurveyStatus.ACTIVE)
    })

    it('returns AWAITING_VERIFICATION for expired survey when power user', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(getSurveyStatus(survey, true)).toBe(SurveyStatus.AWAITING_VERIFICATION)
    })

    it('returns CLOSED for expired survey when not power user', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(getSurveyStatus(survey, false)).toBe(SurveyStatus.CLOSED)
    })

    it('respects explicit status over expiration logic', () => {
      const survey = createMockSurvey({
        date: '2025-09-01',
        time: '18:00',
        status: SurveyStatus.CLOSED
      })
      expect(getSurveyStatus(survey, true)).toBe(SurveyStatus.CLOSED)
    })
  })

  describe('getSurveyStatusDisplay', () => {
    it('returns correct display for ACTIVE status', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      const result = getSurveyStatusDisplay(survey, false)
      expect(result.status).toBe(SurveyStatus.ACTIVE)
      expect(result.color).toBe('positive')
      expect(result.icon).toBe('schedule')
    })

    it('returns correct display for AWAITING_VERIFICATION', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      const result = getSurveyStatusDisplay(survey, true)
      expect(result.status).toBe(SurveyStatus.AWAITING_VERIFICATION)
      expect(result.color).toBe('deep-orange')
      expect(result.icon).toBe('pending_actions')
    })

    it('returns correct display for CLOSED', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      const result = getSurveyStatusDisplay(survey, false)
      expect(result.status).toBe(SurveyStatus.CLOSED)
      expect(result.color).toBe('grey-6')
      expect(result.icon).toBe('check_circle')
    })
  })

  describe('canModifyVotes', () => {
    it('returns false for non-power user', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(canModifyVotes(survey, false)).toBe(false)
    })

    it('returns true for power user on expired survey', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(canModifyVotes(survey, true)).toBe(true)
    })

    it('returns false for power user on active survey', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      expect(canModifyVotes(survey, true)).toBe(false)
    })

    it('returns true for power user on closed survey', () => {
      const survey = createMockSurvey({ status: SurveyStatus.CLOSED })
      expect(canModifyVotes(survey, true)).toBe(true)
    })
  })

  describe('needsVerification', () => {
    it('returns true for expired survey without explicit status', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(needsVerification(survey)).toBe(true)
    })

    it('returns false for non-expired survey', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      expect(needsVerification(survey)).toBe(false)
    })

    it('returns false for expired survey with explicit status', () => {
      const survey = createMockSurvey({
        date: '2025-09-01',
        time: '18:00',
        status: SurveyStatus.CLOSED
      })
      expect(needsVerification(survey)).toBe(false)
    })
  })

  describe('getSurveysNeedingVerification', () => {
    it('filters surveys that need verification', () => {
      const surveys = [
        createMockSurvey({ id: '1', date: '2025-09-01', time: '18:00' }),
        createMockSurvey({ id: '2', date: '2025-12-01', time: '18:00' }),
        createMockSurvey({ id: '3', date: '2025-08-01', time: '18:00', status: SurveyStatus.CLOSED }),
        createMockSurvey({ id: '4', date: '2025-07-15', time: '10:00' })
      ]
      const result = getSurveysNeedingVerification(surveys)
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['1', '4'])
    })

    it('returns empty array when no surveys need verification', () => {
      const surveys = [
        createMockSurvey({ date: '2025-12-01', time: '18:00' }),
        createMockSurvey({ date: '2025-09-01', time: '18:00', status: SurveyStatus.CLOSED })
      ]
      expect(getSurveysNeedingVerification(surveys)).toHaveLength(0)
    })
  })

  describe('getVerificationText', () => {
    it('returns notExpired for active survey', () => {
      const survey = createMockSurvey({ date: '2025-12-01', time: '18:00' })
      expect(getVerificationText(survey)).toBe('survey.verification.notExpired')
    })

    it('returns verified for closed survey with verifiedAt', () => {
      const survey = createMockSurvey({
        date: '2025-09-01',
        time: '18:00',
        status: SurveyStatus.CLOSED,
        verifiedAt: new Date()
      })
      expect(getVerificationText(survey)).toBe('survey.verification.verified')
    })

    it('returns readyToCheck for expired survey needing verification', () => {
      const survey = createMockSurvey({ date: '2025-09-01', time: '18:00' })
      expect(getVerificationText(survey)).toBe('survey.verification.readyToCheck')
    })

    it('returns unknown for closed survey without verifiedAt', () => {
      const survey = createMockSurvey({
        date: '2025-09-01',
        time: '18:00',
        status: SurveyStatus.CLOSED
      })
      expect(getVerificationText(survey)).toBe('survey.verification.unknown')
    })
  })
})
