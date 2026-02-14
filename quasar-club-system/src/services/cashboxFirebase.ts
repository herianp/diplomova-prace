import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
  writeBatch,
  Unsubscribe,
  getDocs,
} from 'firebase/firestore'
import { IFineRule, IFine, IPayment, ICashboxHistoryEntry } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { ListenerError } from '@/errors'

export function useCashboxFirebase() {
  // ============================================================
  // Fine Rules
  // ============================================================

  const listenToFineRules = (teamId: string, callback: (rules: IFineRule[]) => void): Unsubscribe => {
    const rulesRef = collection(doc(db, 'teams', teamId), 'fineRules')
    return onSnapshot(rulesRef, (snapshot) => {
      const rules = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IFineRule[]
      callback(rules)
    }, (error) => {
      const listenerError = new ListenerError('fineRules', 'errors.listener.failed', { code: error.code })
      console.warn('FineRules listener error:', listenerError.message)
      callback([])
    })
  }

  const loadFineRules = async (teamId: string): Promise<IFineRule[]> => {
    try {
      const rulesRef = collection(doc(db, 'teams', teamId), 'fineRules')
      const snapshot = await getDocs(rulesRef)
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IFineRule[]
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      console.error('Error loading fine rules:', firestoreError.message)
      return []
    }
  }

  const addFineRule = async (teamId: string, rule: Omit<IFineRule, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'fineRules'), rule)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding fine rule:', firestoreError.message)
      throw firestoreError
    }
  }

  const updateFineRule = async (teamId: string, ruleId: string, data: Partial<IFineRule>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'teams', teamId, 'fineRules', ruleId), data)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error updating fine rule:', firestoreError.message)
      throw firestoreError
    }
  }

  const deleteFineRule = async (teamId: string, ruleId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'fineRules', ruleId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting fine rule:', firestoreError.message)
      throw firestoreError
    }
  }

  // ============================================================
  // Fines
  // ============================================================

  const listenToFines = (teamId: string, callback: (fines: IFine[]) => void): Unsubscribe => {
    const finesRef = collection(doc(db, 'teams', teamId), 'fines')
    return onSnapshot(finesRef, (snapshot) => {
      const fines = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IFine[]
      callback(fines)
    }, (error) => {
      const listenerError = new ListenerError('fines', 'errors.listener.failed', { code: error.code })
      console.warn('Fines listener error:', listenerError.message)
      callback([])
    })
  }

  const addFine = async (teamId: string, fine: Omit<IFine, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'fines'), fine)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding fine:', firestoreError.message)
      throw firestoreError
    }
  }

  const deleteFine = async (teamId: string, fineId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'fines', fineId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting fine:', firestoreError.message)
      throw firestoreError
    }
  }

  const bulkAddFines = async (teamId: string, fines: Omit<IFine, 'id'>[]): Promise<void> => {
    try {
      const finesRef = collection(doc(db, 'teams', teamId), 'fines')
      for (let i = 0; i < fines.length; i += 499) {
        const batch = writeBatch(db)
        const chunk = fines.slice(i, i + 499)
        chunk.forEach((fine) => {
          const newDocRef = doc(finesRef)
          batch.set(newDocRef, fine)
        })
        await batch.commit()
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error bulk adding fines:', firestoreError.message)
      throw firestoreError
    }
  }

  // ============================================================
  // Payments
  // ============================================================

  const listenToPayments = (teamId: string, callback: (payments: IPayment[]) => void): Unsubscribe => {
    const paymentsRef = collection(doc(db, 'teams', teamId), 'payments')
    return onSnapshot(paymentsRef, (snapshot) => {
      const payments = snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IPayment[]
      callback(payments)
    }, (error) => {
      const listenerError = new ListenerError('payments', 'errors.listener.failed', { code: error.code })
      console.warn('Payments listener error:', listenerError.message)
      callback([])
    })
  }

  const deletePayment = async (teamId: string, paymentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'payments', paymentId))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting payment:', firestoreError.message)
      throw firestoreError
    }
  }

  const addPayment = async (teamId: string, payment: Omit<IPayment, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'payments'), payment)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding payment:', firestoreError.message)
      throw firestoreError
    }
  }

  // ============================================================
  // Bulk Delete (for clear cashbox)
  // ============================================================

  const deleteAllFines = async (teamId: string): Promise<void> => {
    try {
      const finesRef = collection(doc(db, 'teams', teamId), 'fines')
      const snapshot = await getDocs(finesRef)
      for (let i = 0; i < snapshot.docs.length; i += 499) {
        const batch = writeBatch(db)
        snapshot.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref))
        await batch.commit()
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting all fines:', firestoreError.message)
      throw firestoreError
    }
  }

  const deleteAllPayments = async (teamId: string): Promise<void> => {
    try {
      const paymentsRef = collection(doc(db, 'teams', teamId), 'payments')
      const snapshot = await getDocs(paymentsRef)
      for (let i = 0; i < snapshot.docs.length; i += 499) {
        const batch = writeBatch(db)
        snapshot.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref))
        await batch.commit()
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      console.error('Error deleting all payments:', firestoreError.message)
      throw firestoreError
    }
  }

  const bulkAddPayments = async (teamId: string, payments: Omit<IPayment, 'id'>[]): Promise<void> => {
    try {
      const paymentsRef = collection(doc(db, 'teams', teamId), 'payments')
      for (let i = 0; i < payments.length; i += 499) {
        const batch = writeBatch(db)
        payments.slice(i, i + 499).forEach((payment) => {
          batch.set(doc(paymentsRef), payment)
        })
        await batch.commit()
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error bulk adding payments:', firestoreError.message)
      throw firestoreError
    }
  }

  // ============================================================
  // Cashbox History
  // ============================================================

  const addCashboxHistoryEntry = async (teamId: string, entry: Omit<ICashboxHistoryEntry, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'cashboxHistory'), entry)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      console.error('Error adding cashbox history entry:', firestoreError.message)
      throw firestoreError
    }
  }

  const listenToCashboxHistory = (teamId: string, callback: (entries: ICashboxHistoryEntry[]) => void): Unsubscribe => {
    const historyRef = collection(doc(db, 'teams', teamId), 'cashboxHistory')
    return onSnapshot(historyRef, (snapshot) => {
      const entries = snapshot.docs
        .map((d) => ({ id: d.id, ...d.data() })) as ICashboxHistoryEntry[]
      entries.sort((a, b) => {
        const aTime = (a.clearedAt as any)?.seconds || 0
        const bTime = (b.clearedAt as any)?.seconds || 0
        return bTime - aTime
      })
      callback(entries)
    }, (error) => {
      const listenerError = new ListenerError('cashboxHistory', 'errors.listener.failed', { code: error.code })
      console.warn('CashboxHistory listener error:', listenerError.message)
      callback([])
    })
  }

  return {
    listenToFineRules,
    loadFineRules,
    addFineRule,
    updateFineRule,
    deleteFineRule,
    listenToFines,
    addFine,
    deleteFine,
    bulkAddFines,
    listenToPayments,
    addPayment,
    deletePayment,
    deleteAllFines,
    deleteAllPayments,
    bulkAddPayments,
    addCashboxHistoryEntry,
    listenToCashboxHistory,
  }
}
