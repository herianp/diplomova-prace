import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { FineRuleTrigger, IFine, IPayment } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'
import { FirestoreError } from '@/errors'

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
const mockAddFineRule = vi.fn()
const mockUpdateFineRule = vi.fn()
const mockDeleteFineRule = vi.fn()
const mockAddFine = vi.fn()
const mockDeleteFine = vi.fn()
const mockAddPayment = vi.fn()
const mockDeletePayment = vi.fn()
const mockListenToFineRules = vi.fn()
const mockListenToFines = vi.fn()
const mockListenToPayments = vi.fn()
const mockListenToCashboxHistory = vi.fn()

vi.mock('@/services/cashboxFirebase', () => ({
  useCashboxFirebase: () => ({
    loadFineRules: mockLoadFineRules,
    bulkAddFines: mockBulkAddFines,
    listenToFineRules: mockListenToFineRules,
    listenToFines: mockListenToFines,
    listenToPayments: mockListenToPayments,
    addFineRule: mockAddFineRule,
    updateFineRule: mockUpdateFineRule,
    deleteFineRule: mockDeleteFineRule,
    addFine: mockAddFine,
    deleteFine: mockDeleteFine,
    addPayment: mockAddPayment,
    deletePayment: mockDeletePayment,
    listenToCashboxHistory: mockListenToCashboxHistory,
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
import { useAuthStore } from '@/stores/authStore'
import { notifyError } from '@/services/notificationService'

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

const makeFine = (playerId: string, amount: number): IFine => ({
  id: `fine-${playerId}-${amount}`,
  playerId,
  amount,
  reason: 'Test',
  source: 'manual' as const,
  createdBy: 'admin',
  createdAt: new Date(),
})

const makePayment = (playerId: string, amount: number): IPayment => ({
  id: `pay-${playerId}-${amount}`,
  playerId,
  amount,
  createdBy: 'admin',
  createdAt: new Date(),
})

// ============================================================
// TST-05: CRUD Operations, Listener Passthroughs, Calculations
// ============================================================

describe('useCashboxUseCases - CRUD, Listeners, Calculations', () => {
  let authStore: ReturnType<typeof useAuthStore>

  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    authStore = useAuthStore()
    authStore.user = { uid: 'admin-uid', displayName: 'Admin', email: 'admin@test.cz' } as never
  })

  // ===========================================================
  // Listeners
  // ===========================================================

  describe('listeners', () => {
    it('listenToFineRules passes teamId and callback through, returns unsubscribe', () => {
      const unsubscribe = vi.fn()
      mockListenToFineRules.mockReturnValue(unsubscribe)
      const callback = vi.fn()

      const { listenToFineRules } = useCashboxUseCases()
      const result = listenToFineRules('team-1', callback)

      expect(mockListenToFineRules).toHaveBeenCalledWith('team-1', callback)
      expect(result).toBe(unsubscribe)
    })

    it('listenToFines passes teamId and callback through, returns unsubscribe', () => {
      const unsubscribe = vi.fn()
      mockListenToFines.mockReturnValue(unsubscribe)
      const callback = vi.fn()

      const { listenToFines } = useCashboxUseCases()
      const result = listenToFines('team-1', callback)

      expect(mockListenToFines).toHaveBeenCalledWith('team-1', callback)
      expect(result).toBe(unsubscribe)
    })

    it('listenToPayments passes teamId and callback through, returns unsubscribe', () => {
      const unsubscribe = vi.fn()
      mockListenToPayments.mockReturnValue(unsubscribe)
      const callback = vi.fn()

      const { listenToPayments } = useCashboxUseCases()
      const result = listenToPayments('team-1', callback)

      expect(mockListenToPayments).toHaveBeenCalledWith('team-1', callback)
      expect(result).toBe(unsubscribe)
    })

    it('listenToCashboxHistory passes teamId and callback through, returns unsubscribe', () => {
      const unsubscribe = vi.fn()
      mockListenToCashboxHistory.mockReturnValue(unsubscribe)
      const callback = vi.fn()

      const { listenToCashboxHistory } = useCashboxUseCases()
      const result = listenToCashboxHistory('team-1', callback)

      expect(mockListenToCashboxHistory).toHaveBeenCalledWith('team-1', callback)
      expect(result).toBe(unsubscribe)
    })
  })

  // ===========================================================
  // addFineRule
  // ===========================================================

  describe('addFineRule', () => {
    it('success: calls cashboxFirebase.addFineRule with correct args', async () => {
      mockAddFineRule.mockResolvedValue(undefined)
      const ruleData = createRule({ id: undefined })

      const { addFineRule } = useCashboxUseCases()
      await addFineRule('team-1', ruleData as never)

      expect(mockAddFineRule).toHaveBeenCalledWith('team-1', ruleData)
    })

    it('FirestoreError transient (unavailable): notifyError with retry:true and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'write', 'Service unavailable')
      mockAddFineRule.mockRejectedValue(err)

      const { addFineRule } = useCashboxUseCases()
      await expect(addFineRule('team-1', createRule() as never)).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith(
        'Service unavailable',
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Network error')
      mockAddFineRule.mockRejectedValue(err)

      const { addFineRule } = useCashboxUseCases()
      await expect(addFineRule('team-1', createRule() as never)).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // updateFineRule
  // ===========================================================

  describe('updateFineRule', () => {
    it('success: calls cashboxFirebase.updateFineRule with (teamId, ruleId, partialData)', async () => {
      mockUpdateFineRule.mockResolvedValue(undefined)
      const partialData = { amount: 75 }

      const { updateFineRule } = useCashboxUseCases()
      await updateFineRule('team-1', 'rule-1', partialData)

      expect(mockUpdateFineRule).toHaveBeenCalledWith('team-1', 'rule-1', partialData)
    })

    it('FirestoreError transient (unavailable): notifyError with retry:true and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'write', 'Unavailable')
      mockUpdateFineRule.mockRejectedValue(err)

      const { updateFineRule } = useCashboxUseCases()
      await expect(updateFineRule('team-1', 'rule-1', {})).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith(
        'Unavailable',
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Unexpected')
      mockUpdateFineRule.mockRejectedValue(err)

      const { updateFineRule } = useCashboxUseCases()
      await expect(updateFineRule('team-1', 'rule-1', {})).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // deleteFineRule
  // ===========================================================

  describe('deleteFineRule', () => {
    it('success: calls cashboxFirebase.deleteFineRule with (teamId, ruleId)', async () => {
      mockDeleteFineRule.mockResolvedValue(undefined)

      const { deleteFineRule } = useCashboxUseCases()
      await deleteFineRule('team-1', 'rule-1')

      expect(mockDeleteFineRule).toHaveBeenCalledWith('team-1', 'rule-1')
    })

    it('FirestoreError: notifyError WITHOUT retry (destructive op) and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'delete', 'Unavailable')
      mockDeleteFineRule.mockRejectedValue(err)

      const { deleteFineRule } = useCashboxUseCases()
      await expect(deleteFineRule('team-1', 'rule-1')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('Unavailable')
      // Should NOT have been called with retry option
      expect(notifyError).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Unexpected')
      mockDeleteFineRule.mockRejectedValue(err)

      const { deleteFineRule } = useCashboxUseCases()
      await expect(deleteFineRule('team-1', 'rule-1')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // addManualFine
  // ===========================================================

  describe('addManualFine', () => {
    it('success with authStore.user: calls addFine with correct fineObj and auditContext', async () => {
      mockAddFine.mockResolvedValue(undefined)

      const { addManualFine } = useCashboxUseCases()
      await addManualFine('team-1', 'player-1', 100, 'Late', 'admin-uid')

      expect(mockAddFine).toHaveBeenCalledOnce()
      const [calledTeamId, fineObj, auditContext] = mockAddFine.mock.calls[0]
      expect(calledTeamId).toBe('team-1')
      expect(fineObj).toMatchObject({
        playerId: 'player-1',
        amount: 100,
        reason: 'Late',
        source: 'manual',
        createdBy: 'admin-uid',
      })
      expect(auditContext).toMatchObject({
        actorUid: 'admin-uid',
        actorDisplayName: 'Admin',
      })
    })

    it('success without authStore.user: calls addFine with auditContext=undefined', async () => {
      authStore.user = null
      mockAddFine.mockResolvedValue(undefined)

      const { addManualFine } = useCashboxUseCases()
      await addManualFine('team-1', 'player-1', 100, 'Late', 'admin-uid')

      const [, , auditContext] = mockAddFine.mock.calls[0]
      expect(auditContext).toBeUndefined()
    })

    it('FirestoreError transient: notifyError with retry:true and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'write', 'Unavailable')
      mockAddFine.mockRejectedValue(err)

      const { addManualFine } = useCashboxUseCases()
      await expect(addManualFine('team-1', 'player-1', 100, 'Late', 'admin-uid')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith(
        'Unavailable',
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Unexpected')
      mockAddFine.mockRejectedValue(err)

      const { addManualFine } = useCashboxUseCases()
      await expect(addManualFine('team-1', 'player-1', 100, 'Late', 'admin-uid')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // deleteFine
  // ===========================================================

  describe('deleteFine', () => {
    it('success with user and fine object: auditContext includes fineAmount and fineReason', async () => {
      mockDeleteFine.mockResolvedValue(undefined)
      const fine = makeFine('player-1', 50)
      fine.reason = 'Late'

      const { deleteFine } = useCashboxUseCases()
      await deleteFine('team-1', 'fine-1', fine)

      const [, , auditContext] = mockDeleteFine.mock.calls[0]
      expect(auditContext).toMatchObject({
        actorUid: 'admin-uid',
        actorDisplayName: 'Admin',
        fineAmount: 50,
        fineReason: 'Late',
      })
    })

    it('success without user: auditContext is undefined', async () => {
      authStore.user = null
      mockDeleteFine.mockResolvedValue(undefined)
      const fine = makeFine('player-1', 50)

      const { deleteFine } = useCashboxUseCases()
      await deleteFine('team-1', 'fine-1', fine)

      const [, , auditContext] = mockDeleteFine.mock.calls[0]
      expect(auditContext).toBeUndefined()
    })

    it('success without fine object: auditContext is undefined even when user exists', async () => {
      mockDeleteFine.mockResolvedValue(undefined)

      const { deleteFine } = useCashboxUseCases()
      await deleteFine('team-1', 'fine-1')

      const [, , auditContext] = mockDeleteFine.mock.calls[0]
      expect(auditContext).toBeUndefined()
    })

    it('FirestoreError: notifyError WITHOUT retry (destructive) and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'delete', 'Unavailable')
      mockDeleteFine.mockRejectedValue(err)

      const { deleteFine } = useCashboxUseCases()
      await expect(deleteFine('team-1', 'fine-1')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('Unavailable')
      expect(notifyError).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ retry: true })
      )
    })
  })

  // ===========================================================
  // recordPayment
  // ===========================================================

  describe('recordPayment', () => {
    it('success with note: payment object has note field', async () => {
      mockAddPayment.mockResolvedValue(undefined)

      const { recordPayment } = useCashboxUseCases()
      await recordPayment('team-1', 'player-1', 200, 'admin-uid', 'Monthly')

      const [, paymentObj] = mockAddPayment.mock.calls[0]
      expect(paymentObj).toMatchObject({
        playerId: 'player-1',
        amount: 200,
        createdBy: 'admin-uid',
        note: 'Monthly',
      })
    })

    it('success without note: payment object does NOT have note field', async () => {
      mockAddPayment.mockResolvedValue(undefined)

      const { recordPayment } = useCashboxUseCases()
      await recordPayment('team-1', 'player-1', 200, 'admin-uid')

      const [, paymentObj] = mockAddPayment.mock.calls[0]
      expect(paymentObj).not.toHaveProperty('note')
    })

    it('FirestoreError transient: notifyError with retry:true and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'write', 'Unavailable')
      mockAddPayment.mockRejectedValue(err)

      const { recordPayment } = useCashboxUseCases()
      await expect(recordPayment('team-1', 'player-1', 200, 'admin-uid')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith(
        'Unavailable',
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Unexpected')
      mockAddPayment.mockRejectedValue(err)

      const { recordPayment } = useCashboxUseCases()
      await expect(recordPayment('team-1', 'player-1', 200, 'admin-uid')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // deletePayment
  // ===========================================================

  describe('deletePayment', () => {
    it('success: calls cashboxFirebase.deletePayment with (teamId, paymentId)', async () => {
      mockDeletePayment.mockResolvedValue(undefined)

      const { deletePayment } = useCashboxUseCases()
      await deletePayment('team-1', 'payment-1')

      expect(mockDeletePayment).toHaveBeenCalledWith('team-1', 'payment-1')
    })

    it('FirestoreError: notifyError WITHOUT retry (destructive) and re-throws', async () => {
      const err = new FirestoreError('unavailable', 'delete', 'Unavailable')
      mockDeletePayment.mockRejectedValue(err)

      const { deletePayment } = useCashboxUseCases()
      await expect(deletePayment('team-1', 'payment-1')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('Unavailable')
      expect(notifyError).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ retry: true })
      )
    })

    it('generic error: notifyError with errors.unexpected and re-throws', async () => {
      const err = new Error('Unexpected')
      mockDeletePayment.mockRejectedValue(err)

      const { deletePayment } = useCashboxUseCases()
      await expect(deletePayment('team-1', 'payment-1')).rejects.toBe(err)

      expect(notifyError).toHaveBeenCalledWith('errors.unexpected')
    })
  })

  // ===========================================================
  // calculatePlayerBalance
  // ===========================================================

  describe('calculatePlayerBalance', () => {
    it('player with fines and payments: returns correct totalFined, totalPaid, balance', () => {
      const fines = [makeFine('p1', 100), makeFine('p1', 50)]
      const payments = [makePayment('p1', 75)]

      const { calculatePlayerBalance } = useCashboxUseCases()
      const result = calculatePlayerBalance('p1', 'Player One', fines, payments)

      expect(result.totalFined).toBe(150)
      expect(result.totalPaid).toBe(75)
      expect(result.balance).toBe(-75)
    })

    it('player with no fines: totalFined=0, balance=totalPaid', () => {
      const fines: IFine[] = []
      const payments = [makePayment('p1', 50)]

      const { calculatePlayerBalance } = useCashboxUseCases()
      const result = calculatePlayerBalance('p1', 'Player One', fines, payments)

      expect(result.totalFined).toBe(0)
      expect(result.totalPaid).toBe(50)
      expect(result.balance).toBe(50)
    })

    it('player with no payments: totalPaid=0, balance=-totalFined', () => {
      const fines = [makeFine('p1', 100)]
      const payments: IPayment[] = []

      const { calculatePlayerBalance } = useCashboxUseCases()
      const result = calculatePlayerBalance('p1', 'Player One', fines, payments)

      expect(result.totalFined).toBe(100)
      expect(result.totalPaid).toBe(0)
      expect(result.balance).toBe(-100)
    })

    it('player with equal fines and payments: balance=0', () => {
      const fines = [makeFine('p1', 50)]
      const payments = [makePayment('p1', 50)]

      const { calculatePlayerBalance } = useCashboxUseCases()
      const result = calculatePlayerBalance('p1', 'Player One', fines, payments)

      expect(result.balance).toBe(0)
    })

    it('ignores other players data: only counts fines/payments for requested playerId', () => {
      const fines = [makeFine('p1', 100), makeFine('p2', 200), makeFine('p3', 300)]
      const payments = [makePayment('p1', 50), makePayment('p2', 100)]

      const { calculatePlayerBalance } = useCashboxUseCases()
      const result = calculatePlayerBalance('p1', 'Player One', fines, payments)

      expect(result.totalFined).toBe(100)
      expect(result.totalPaid).toBe(50)
      expect(result.balance).toBe(-50)
    })
  })

  // ===========================================================
  // calculateAllPlayerBalances
  // ===========================================================

  describe('calculateAllPlayerBalances', () => {
    it('returns balances sorted by balance ascending (most in debt first)', () => {
      // p1: paid 100, fined 50 → balance=50
      // p2: paid 0, fined 100 → balance=-100
      // p3: paid 50, fined 50 → balance=0
      const fines = [makeFine('p1', 50), makeFine('p2', 100), makeFine('p3', 50)]
      const payments = [makePayment('p1', 100), makePayment('p3', 50)]
      const getDisplayName = (id: string) => `Player ${id}`

      const { calculateAllPlayerBalances } = useCashboxUseCases()
      const result = calculateAllPlayerBalances(['p1', 'p2', 'p3'], getDisplayName, fines, payments)

      expect(result.map(r => r.playerId)).toEqual(['p2', 'p3', 'p1'])
      expect(result[0].balance).toBe(-100)
      expect(result[1].balance).toBe(0)
      expect(result[2].balance).toBe(50)
    })

    it('uses getDisplayName callback for each player', () => {
      const fines: IFine[] = []
      const payments: IPayment[] = []
      const getDisplayName = vi.fn((id: string) => `Name of ${id}`)

      const { calculateAllPlayerBalances } = useCashboxUseCases()
      const result = calculateAllPlayerBalances(['p1', 'p2'], getDisplayName, fines, payments)

      expect(getDisplayName).toHaveBeenCalledWith('p1')
      expect(getDisplayName).toHaveBeenCalledWith('p2')
      expect(result[0].displayName).toBe('Name of p1')
      expect(result[1].displayName).toBe('Name of p2')
    })

    it('returns empty array when memberIds is empty', () => {
      const { calculateAllPlayerBalances } = useCashboxUseCases()
      const result = calculateAllPlayerBalances([], () => 'name', [], [])

      expect(result).toEqual([])
    })
  })

  // ===========================================================
  // calculateTeamSummary
  // ===========================================================

  describe('calculateTeamSummary', () => {
    it('basic summary: correct totalFined, totalPaid, totalOutstanding, totalCredits, totalFinesCount', () => {
      // p1: fined 100, paid 40 → outstanding 60
      // p2: fined 50, paid 50 → balanced
      const fines = [makeFine('p1', 100), makeFine('p2', 50)]
      const payments = [makePayment('p1', 40), makePayment('p2', 50)]

      const { calculateTeamSummary } = useCashboxUseCases()
      const result = calculateTeamSummary(fines, payments)

      expect(result.totalFined).toBe(150)
      expect(result.totalPaid).toBe(90)
      expect(result.totalOutstanding).toBe(60)
      expect(result.totalCredits).toBe(0)
      expect(result.totalFinesCount).toBe(2)
    })

    it('player with overpayment creates credit, does not offset others outstanding', () => {
      // p1: fined 100, paid 150 → credit 50
      // p2: fined 100, paid 0 → outstanding 100
      const fines = [makeFine('p1', 100), makeFine('p2', 100)]
      const payments = [makePayment('p1', 150)]

      const { calculateTeamSummary } = useCashboxUseCases()
      const result = calculateTeamSummary(fines, payments)

      expect(result.totalCredits).toBe(50)
      expect(result.totalOutstanding).toBe(100) // p2's debt NOT offset by p1's credit
    })

    it('empty fines and payments: all zeros', () => {
      const { calculateTeamSummary } = useCashboxUseCases()
      const result = calculateTeamSummary([], [])

      expect(result.totalFined).toBe(0)
      expect(result.totalPaid).toBe(0)
      expect(result.totalOutstanding).toBe(0)
      expect(result.totalCredits).toBe(0)
      expect(result.totalFinesCount).toBe(0)
    })

    it('single player with exact payment: totalOutstanding=0, totalCredits=0', () => {
      const fines = [makeFine('p1', 100)]
      const payments = [makePayment('p1', 100)]

      const { calculateTeamSummary } = useCashboxUseCases()
      const result = calculateTeamSummary(fines, payments)

      expect(result.totalOutstanding).toBe(0)
      expect(result.totalCredits).toBe(0)
    })
  })
})

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
