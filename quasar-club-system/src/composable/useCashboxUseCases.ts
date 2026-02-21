import { useCashboxFirebase } from '@/services/cashboxFirebase'
import { IFine, IFineRule, IPayment, IPlayerBalance, IVote, ICashboxHistoryEntry, FineRuleTrigger } from '@/interfaces/interfaces'
import { SurveyTypes } from '@/enums/SurveyTypes'
import { Unsubscribe } from 'firebase/firestore'
import { notifyError } from '@/services/notificationService'
import { FirestoreError } from '@/errors'
import { useAuthStore } from '@/stores/authStore'

export function useCashboxUseCases() {
  const cashboxFirebase = useCashboxFirebase()
  const authStore = useAuthStore()

  // ============================================================
  // Listeners
  // ============================================================

  const listenToFineRules = (teamId: string, callback: (rules: IFineRule[]) => void): Unsubscribe => {
    return cashboxFirebase.listenToFineRules(teamId, callback)
  }

  const listenToFines = (teamId: string, callback: (fines: IFine[]) => void): Unsubscribe => {
    return cashboxFirebase.listenToFines(teamId, callback)
  }

  const listenToPayments = (teamId: string, callback: (payments: IPayment[]) => void): Unsubscribe => {
    return cashboxFirebase.listenToPayments(teamId, callback)
  }

  // ============================================================
  // Fine Rules Management
  // ============================================================

  const addFineRule = async (teamId: string, rule: Omit<IFineRule, 'id'>): Promise<void> => {
    try {
      return await cashboxFirebase.addFineRule(teamId, rule)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => addFineRule(teamId, rule) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const updateFineRule = async (teamId: string, ruleId: string, data: Partial<IFineRule>): Promise<void> => {
    try {
      return await cashboxFirebase.updateFineRule(teamId, ruleId, data)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => updateFineRule(teamId, ruleId, data) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const deleteFineRule = async (teamId: string, ruleId: string): Promise<void> => {
    try {
      return await cashboxFirebase.deleteFineRule(teamId, ruleId)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        // NO retry for destructive operations
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  // ============================================================
  // Fine Management
  // ============================================================

  const addManualFine = async (
    teamId: string,
    playerId: string,
    amount: number,
    reason: string,
    createdBy: string
  ): Promise<void> => {
    const fine: Omit<IFine, 'id'> = {
      playerId,
      amount,
      reason,
      source: 'manual',
      createdBy,
      createdAt: new Date(),
    }
    try {
      const auditContext = authStore.user ? {
        actorUid: authStore.user.uid,
        actorDisplayName: authStore.user.displayName || authStore.user.email || 'Unknown'
      } : undefined

      return await cashboxFirebase.addFine(teamId, fine, auditContext)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => addManualFine(teamId, playerId, amount, reason, createdBy) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  const deleteFine = async (teamId: string, fineId: string, fine?: IFine): Promise<void> => {
    try {
      const auditContext = authStore.user && fine ? {
        actorUid: authStore.user.uid,
        actorDisplayName: authStore.user.displayName || authStore.user.email || 'Unknown',
        fineAmount: fine.amount,
        fineReason: fine.reason
      } : undefined

      return await cashboxFirebase.deleteFine(teamId, fineId, auditContext)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        // NO retry for destructive operations
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  // ============================================================
  // Payment Management
  // ============================================================

  const recordPayment = async (
    teamId: string,
    playerId: string,
    amount: number,
    createdBy: string,
    note?: string
  ): Promise<void> => {
    const payment: Omit<IPayment, 'id'> = {
      playerId,
      amount,
      createdBy,
      createdAt: new Date(),
      ...(note && { note }),
    }
    try {
      return await cashboxFirebase.addPayment(teamId, payment)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        const shouldRetry = error.code === 'unavailable' || error.code === 'deadline-exceeded'
        notifyError(error.message, {
          retry: shouldRetry,
          onRetry: shouldRetry ? () => recordPayment(teamId, playerId, amount, createdBy, note) : undefined
        })
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  // ============================================================
  // Auto-Fine Generation
  // ============================================================

  /**
   * Generate auto-fines based on active fine rules after survey verification.
   *
   * @param teamId - The team ID
   * @param surveyId - The survey being verified
   * @param surveyTitle - Survey title for fine description
   * @param surveyType - Survey type (training/match) for rule filtering
   * @param originalVotes - Votes BEFORE verification (from the survey)
   * @param verifiedVotes - Votes AFTER verification (modified by power user)
   * @param teamMemberIds - All team member UIDs
   * @param createdBy - UID of the power user verifying
   */
  const generateAutoFines = async (
    teamId: string,
    surveyId: string,
    surveyTitle: string,
    surveyType: SurveyTypes,
    originalVotes: IVote[],
    verifiedVotes: IVote[],
    teamMemberIds: string[],
    createdBy: string
  ): Promise<number> => {
    // Load active fine rules
    const allRules = await cashboxFirebase.loadFineRules(teamId)
    const activeRules = allRules.filter((r) => r.active)

    if (activeRules.length === 0) return 0

    const finesToCreate: Omit<IFine, 'id'>[] = []

    for (const memberId of teamMemberIds) {
      const originalVote = originalVotes.find((v) => v.userUid === memberId)
      const verifiedVote = verifiedVotes.find((v) => v.userUid === memberId)

      for (const rule of activeRules) {
        // Check if rule applies to this survey type
        if (rule.surveyType && rule.surveyType !== surveyType) continue

        let shouldFine = false

        switch (rule.triggerType) {
          case FineRuleTrigger.NO_ATTENDANCE:
            // Player voted No or was marked No after verification
            shouldFine = verifiedVote?.vote === false
            break

          case FineRuleTrigger.VOTED_YES_BUT_ABSENT:
            // Player originally voted Yes but power user changed to No/removed
            shouldFine = originalVote?.vote === true && (!verifiedVote || verifiedVote.vote === false)
            break

          case FineRuleTrigger.UNVOTED:
            // Player didn't vote at all (no verified vote entry)
            shouldFine = !verifiedVote
            break
        }

        if (shouldFine) {
          finesToCreate.push({
            playerId: memberId,
            amount: rule.amount,
            reason: `${rule.name} — ${surveyTitle}`,
            source: 'auto',
            ruleId: rule.id,
            surveyId,
            surveyTitle,
            createdBy,
            createdAt: new Date(),
          })
        }
      }
    }

    if (finesToCreate.length > 0) {
      await cashboxFirebase.bulkAddFines(teamId, finesToCreate)
    }

    return finesToCreate.length
  }

  const deletePayment = async (teamId: string, paymentId: string): Promise<void> => {
    try {
      return await cashboxFirebase.deletePayment(teamId, paymentId)
    } catch (error: unknown) {
      if (error instanceof FirestoreError) {
        // NO retry for destructive operations
        notifyError(error.message)
      } else {
        notifyError('errors.unexpected')
      }
      throw error
    }
  }

  // ============================================================
  // Balance Calculations (pure functions, computed at read-time)
  // ============================================================

  const calculatePlayerBalance = (
    playerId: string,
    displayName: string,
    fines: IFine[],
    payments: IPayment[]
  ): IPlayerBalance => {
    const playerFines = fines.filter((f) => f.playerId === playerId)
    const playerPayments = payments.filter((p) => p.playerId === playerId)

    const totalFined = playerFines.reduce((sum, f) => sum + f.amount, 0)
    const totalPaid = playerPayments.reduce((sum, p) => sum + p.amount, 0)

    return {
      playerId,
      displayName,
      totalFined,
      totalPaid,
      balance: totalPaid - totalFined, // negative = owes money
    }
  }

  const calculateAllPlayerBalances = (
    memberIds: string[],
    getDisplayName: (id: string) => string,
    fines: IFine[],
    payments: IPayment[]
  ): IPlayerBalance[] => {
    return memberIds
      .map((id) => calculatePlayerBalance(id, getDisplayName(id), fines, payments))
      .sort((a, b) => a.balance - b.balance) // most in debt first
  }

  const calculateTeamSummary = (fines: IFine[], payments: IPayment[]) => {
    const totalFined = fines.reduce((sum, f) => sum + f.amount, 0)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    // Calculate outstanding and credits per-player to avoid overpayments offsetting other players' debts
    const playerIds = new Set([
      ...fines.map((f) => f.playerId),
      ...payments.map((p) => p.playerId),
    ])

    let totalOutstanding = 0
    let totalCredits = 0

    for (const playerId of playerIds) {
      const playerFined = fines
        .filter((f) => f.playerId === playerId)
        .reduce((sum, f) => sum + f.amount, 0)
      const playerPaid = payments
        .filter((p) => p.playerId === playerId)
        .reduce((sum, p) => sum + p.amount, 0)
      const playerBalance = playerPaid - playerFined

      if (playerBalance < 0) {
        totalOutstanding += Math.abs(playerBalance)
      } else if (playerBalance > 0) {
        totalCredits += playerBalance
      }
    }

    return {
      totalFined,
      totalPaid,
      totalOutstanding,
      totalCredits,
      totalFinesCount: fines.length,
    }
  }

  // ============================================================
  // Clear Cashbox
  // ============================================================

  const clearCashbox = async (
    teamId: string,
    fines: IFine[],
    payments: IPayment[],
    memberIds: string[],
    getDisplayName: (id: string) => string,
    createdBy: string,
    carryOverFineReason: string,
    carryOverPaymentNote: string
  ): Promise<void> => {
    // 1. Calculate current state
    const balances = calculateAllPlayerBalances(memberIds, getDisplayName, fines, payments)
    const summary = calculateTeamSummary(fines, payments)

    // 2. Build history snapshot
    const historyEntry: Omit<ICashboxHistoryEntry, 'id'> = {
      clearedAt: new Date(),
      clearedBy: createdBy,
      summary,
      playerBalances: balances,
      fines: fines.map((f) => ({
        playerId: f.playerId,
        amount: f.amount,
        reason: f.reason,
        source: f.source,
        createdAt: f.createdAt,
      })),
      payments: payments.map((p) => ({
        playerId: p.playerId,
        amount: p.amount,
        note: p.note ?? '',
        createdAt: p.createdAt,
      })),
    }

    // 3. Save history
    await cashboxFirebase.addCashboxHistoryEntry(teamId, historyEntry)

    // 4. Delete all current fines and payments
    await cashboxFirebase.deleteAllFines(teamId)
    await cashboxFirebase.deleteAllPayments(teamId)

    // 5. Create carry-over records for non-zero balances
    const carryOverFines: Omit<IFine, 'id'>[] = []
    const carryOverPayments: Omit<IPayment, 'id'>[] = []

    for (const player of balances) {
      if (player.balance < 0) {
        carryOverFines.push({
          playerId: player.playerId,
          amount: Math.abs(player.balance),
          reason: carryOverFineReason,
          source: 'manual',
          createdBy,
          createdAt: new Date(),
        })
      } else if (player.balance > 0) {
        carryOverPayments.push({
          playerId: player.playerId,
          amount: player.balance,
          note: carryOverPaymentNote,
          createdBy,
          createdAt: new Date(),
        })
      }
    }

    if (carryOverFines.length > 0) {
      await cashboxFirebase.bulkAddFines(teamId, carryOverFines)
    }
    if (carryOverPayments.length > 0) {
      await cashboxFirebase.bulkAddPayments(teamId, carryOverPayments)
    }
  }

  const listenToCashboxHistory = (teamId: string, callback: (entries: ICashboxHistoryEntry[]) => void): Unsubscribe => {
    return cashboxFirebase.listenToCashboxHistory(teamId, callback)
  }

  return {
    // Listeners
    listenToFineRules,
    listenToFines,
    listenToPayments,
    listenToCashboxHistory,
    // Fine Rules
    addFineRule,
    updateFineRule,
    deleteFineRule,
    // Fines
    addManualFine,
    deleteFine,
    // Payments
    recordPayment,
    deletePayment,
    // Auto-fines
    generateAutoFines,
    // Calculations
    calculatePlayerBalance,
    calculateAllPlayerBalances,
    calculateTeamSummary,
    // Clear Cashbox
    clearCashbox,
  }
}
