import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { FineRuleTrigger } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'

// ============================================================
// Mocks
// ============================================================

vi.mock('@/firebase/config', () => ({ db: {}, auth: {}, analytics: {}, perf: {} }))

vi.mock('@/services/notificationService', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn()
}))

vi.mock('src/utils/logger', () => ({
  createLogger: () => ({ debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() })
}))

const mockLoadFineRules = vi.fn()
const mockBulkAddFines = vi.fn()

vi.mock('@/services/cashboxFirebase', () => ({
  useCashboxFirebase: () => ({
    loadFineRules: mockLoadFineRules,
    bulkAddFines: mockBulkAddFines,
    listenToFineRules: vi.fn(),
    listenToFines: vi.fn(),
    listenToPayments: vi.fn(),
    addFineRule: vi.fn(),
    updateFineRule: vi.fn(),
    deleteFineRule: vi.fn(),
    addFine: vi.fn(),
    deleteFine: vi.fn(),
    addPayment: vi.fn(),
    deletePayment: vi.fn(),
    listenToCashboxHistory: vi.fn(),
    addCashboxHistoryEntry: vi.fn(),
    deleteAllFines: vi.fn(),
    deleteAllPayments: vi.fn(),
    bulkAddPayments: vi.fn()
  })
}))

// ============================================================
// Imports (after mocks)
// ============================================================

import { useCashboxUseCases } from '@/composable/useCashboxUseCases'

// ============================================================
// Helpers
// ============================================================

const createRule = (overrides: Record<string, unknown> = {}) => ({
  id: 'rule-1',
  name: 'Test Rule',
  amount: 50,
  triggerType: FineRuleTrigger.NO_ATTENDANCE,
  active: true,
  surveyType: undefined,
  createdBy: 'admin-uid',
  createdAt: new Date(),
  ...overrides
})

const BASE_ARGS = {
  teamId: 'team-1',
  surveyId: 'survey-1',
  surveyTitle: 'Training Wed',
  surveyType: SurveyTypes.Training,
  createdBy: 'admin-uid'
}

// ============================================================
// TST-05: generateAutoFines
// ============================================================

describe('useCashboxUseCases - generateAutoFines (TST-05)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    mockBulkAddFines.mockResolvedValue(undefined)
  })

  // ===========================================================
  // Edge cases: no / inactive rules
  // ===========================================================

  describe('edge cases — no active rules', () => {
    it('returns 0 and does not call bulkAddFines when no rules exist', async () => {
      mockLoadFineRules.mockResolvedValue([])

      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType, [], [], ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
      expect(mockBulkAddFines).not.toHaveBeenCalled()
    })

    it('filters out inactive rules and returns 0 when all rules are inactive', async () => {
      mockLoadFineRules.mockResolvedValue([createRule({ active: false })])

      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType, [], [], ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
      expect(mockBulkAddFines).not.toHaveBeenCalled()
    })
  })

  // ===========================================================
  // Survey type filtering
  // ===========================================================

  describe('survey type filtering', () => {
    it('skips rule when rule surveyType does not match survey type', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ surveyType: SurveyTypes.Match, triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      // Survey is Training, rule targets Match → should skip
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        SurveyTypes.Training,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
      expect(mockBulkAddFines).not.toHaveBeenCalled()
    })

    it('applies rule when rule surveyType matches survey type', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ surveyType: SurveyTypes.Training, triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        SurveyTypes.Training,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
    })

    it('applies rule to all survey types when rule has no surveyType filter (undefined)', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ surveyType: undefined, triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      // Works for Training
      const count1 = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        SurveyTypes.Training,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )
      expect(count1).toBe(1)

      vi.clearAllMocks()
      mockBulkAddFines.mockResolvedValue(undefined)
      mockLoadFineRules.mockResolvedValue([
        createRule({ surveyType: undefined, triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      // Works for Match too
      const count2 = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        SurveyTypes.Match,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )
      expect(count2).toBe(1)
    })
  })

  // ===========================================================
  // FineRuleTrigger.NO_ATTENDANCE
  // ===========================================================

  describe('FineRuleTrigger.NO_ATTENDANCE', () => {
    beforeEach(() => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])
    })

    it('creates a fine when verified vote is false (player did not attend)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType, [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
      expect(mockBulkAddFines).toHaveBeenCalledOnce()
    })

    it('does not create a fine when verified vote is true (player attended)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType, [], [{ userUid: 'player-1', vote: true }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
      expect(mockBulkAddFines).not.toHaveBeenCalled()
    })

    it('creates exactly 1 fine when only 1 of 3 players has vote=false', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [],
        [
          { userUid: 'player-1', vote: true },
          { userUid: 'player-2', vote: false },
          { userUid: 'player-3', vote: true }
        ],
        ['player-1', 'player-2', 'player-3'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
    })
  })

  // ===========================================================
  // FineRuleTrigger.VOTED_YES_BUT_ABSENT
  // ===========================================================

  describe('FineRuleTrigger.VOTED_YES_BUT_ABSENT', () => {
    beforeEach(() => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ triggerType: FineRuleTrigger.VOTED_YES_BUT_ABSENT })
      ])
    })

    it('creates fine when original vote=true but verified vote=false (absent despite yes)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [{ userUid: 'player-1', vote: true }],
        [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
    })

    it('creates fine when original vote=true but no verified vote entry', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [{ userUid: 'player-1', vote: true }],
        [], // no verified vote for player-1
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
    })

    it('does not create fine when original vote=false (player never voted yes)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [{ userUid: 'player-1', vote: false }],
        [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
    })

    it('does not create fine when original vote=true and verified vote=true (attended)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [{ userUid: 'player-1', vote: true }],
        [{ userUid: 'player-1', vote: true }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
    })
  })

  // ===========================================================
  // FineRuleTrigger.UNVOTED
  // ===========================================================

  describe('FineRuleTrigger.UNVOTED', () => {
    beforeEach(() => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ triggerType: FineRuleTrigger.UNVOTED })
      ])
    })

    it('creates fine when member has no verified vote entry (did not vote)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [], // no original votes
        [], // no verified votes
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(1)
    })

    it('does not create fine when member has a verified vote (true)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [],
        [{ userUid: 'player-1', vote: true }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
    })

    it('does not create fine when member has a verified vote (false)', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [],
        [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(0)
    })

    it('creates fines for all members when verifiedVotes is empty', async () => {
      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [], // empty original votes
        [], // empty verified votes
        ['player-1', 'player-2', 'player-3'], BASE_ARGS.createdBy
      )

      expect(count).toBe(3)
    })
  })

  // ===========================================================
  // Fine creation format
  // ===========================================================

  describe('fine creation format', () => {
    it('creates fine with correct reason format: "{rule.name} — {surveyTitle}"', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ name: 'Absence Fine', triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, 'Training Wed',
        BASE_ARGS.surveyType,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      const fines = mockBulkAddFines.mock.calls[0][1]
      expect(fines[0].reason).toBe('Absence Fine — Training Wed')
    })

    it('creates fine with source: "auto"', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [], [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      const fines = mockBulkAddFines.mock.calls[0][1]
      expect(fines[0].source).toBe('auto')
    })

    it('returns the correct count of created fines', async () => {
      mockLoadFineRules.mockResolvedValue([
        createRule({ triggerType: FineRuleTrigger.NO_ATTENDANCE })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [],
        [
          { userUid: 'player-1', vote: false },
          { userUid: 'player-2', vote: false }
        ],
        ['player-1', 'player-2', 'player-3'], BASE_ARGS.createdBy
      )

      // player-3 has no verified vote → UNVOTED not triggered, NO_ATTENDANCE needs vote=false
      // player-1 and player-2 voted false → fined
      expect(count).toBe(2)
    })
  })

  // ===========================================================
  // Multiple rules and members
  // ===========================================================

  describe('multiple rules and members', () => {
    it('generates correct number of fines with 2 rules and 3 members', async () => {
      // Rule 1: NO_ATTENDANCE
      // Rule 2: UNVOTED
      mockLoadFineRules.mockResolvedValue([
        createRule({ id: 'rule-1', triggerType: FineRuleTrigger.NO_ATTENDANCE, amount: 50 }),
        createRule({ id: 'rule-2', triggerType: FineRuleTrigger.UNVOTED, amount: 30 })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      // player-1: verified vote=false → NO_ATTENDANCE fires (1 fine)
      // player-2: no verified vote → UNVOTED fires (1 fine)
      // player-3: verified vote=true → neither rule fires
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [],
        [
          { userUid: 'player-1', vote: false },
          { userUid: 'player-3', vote: true }
        ],
        ['player-1', 'player-2', 'player-3'], BASE_ARGS.createdBy
      )

      expect(count).toBe(2)
      expect(mockBulkAddFines).toHaveBeenCalledOnce()
      const fines = mockBulkAddFines.mock.calls[0][1]
      expect(fines).toHaveLength(2)
    })

    it('generates fines for each rule-member combination that matches', async () => {
      // Both NO_ATTENDANCE and VOTED_YES_BUT_ABSENT active
      mockLoadFineRules.mockResolvedValue([
        createRule({ id: 'rule-1', triggerType: FineRuleTrigger.NO_ATTENDANCE }),
        createRule({ id: 'rule-2', triggerType: FineRuleTrigger.VOTED_YES_BUT_ABSENT })
      ])

      const { generateAutoFines } = useCashboxUseCases()
      // player-1: originally yes, verified no → VOTED_YES_BUT_ABSENT fires + NO_ATTENDANCE fires (2 fines)
      const count = await generateAutoFines(
        BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
        BASE_ARGS.surveyType,
        [{ userUid: 'player-1', vote: true }],
        [{ userUid: 'player-1', vote: false }],
        ['player-1'], BASE_ARGS.createdBy
      )

      expect(count).toBe(2)
    })
  })

  // ===========================================================
  // bulkAddFines not called when no fines generated
  // ===========================================================

  it('does not call bulkAddFines when no fines are generated', async () => {
    mockLoadFineRules.mockResolvedValue([
      createRule({ triggerType: FineRuleTrigger.NO_ATTENDANCE })
    ])

    const { generateAutoFines } = useCashboxUseCases()
    // player-1 voted true → no fine for NO_ATTENDANCE
    await generateAutoFines(
      BASE_ARGS.teamId, BASE_ARGS.surveyId, BASE_ARGS.surveyTitle,
      BASE_ARGS.surveyType,
      [], [{ userUid: 'player-1', vote: true }],
      ['player-1'], BASE_ARGS.createdBy
    )

    expect(mockBulkAddFines).not.toHaveBeenCalled()
  })
})
