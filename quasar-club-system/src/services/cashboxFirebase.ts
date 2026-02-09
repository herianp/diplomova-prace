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
      console.error('Error in fineRules listener:', error)
      if (error.code === 'permission-denied') {
        callback([])
      }
    })
  }

  const loadFineRules = async (teamId: string): Promise<IFineRule[]> => {
    try {
      const rulesRef = collection(doc(db, 'teams', teamId), 'fineRules')
      const snapshot = await getDocs(rulesRef)
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as IFineRule[]
    } catch (error) {
      console.error('Error loading fine rules:', error)
      return []
    }
  }

  const addFineRule = async (teamId: string, rule: Omit<IFineRule, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'fineRules'), rule)
    } catch (error) {
      console.error('Error adding fine rule:', error)
      throw error
    }
  }

  const updateFineRule = async (teamId: string, ruleId: string, data: Partial<IFineRule>): Promise<void> => {
    try {
      await updateDoc(doc(db, 'teams', teamId, 'fineRules', ruleId), data)
    } catch (error) {
      console.error('Error updating fine rule:', error)
      throw error
    }
  }

  const deleteFineRule = async (teamId: string, ruleId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'fineRules', ruleId))
    } catch (error) {
      console.error('Error deleting fine rule:', error)
      throw error
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
      console.error('Error in fines listener:', error)
      if (error.code === 'permission-denied') {
        callback([])
      }
    })
  }

  const addFine = async (teamId: string, fine: Omit<IFine, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'fines'), fine)
    } catch (error) {
      console.error('Error adding fine:', error)
      throw error
    }
  }

  const deleteFine = async (teamId: string, fineId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'fines', fineId))
    } catch (error) {
      console.error('Error deleting fine:', error)
      throw error
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
    } catch (error) {
      console.error('Error bulk adding fines:', error)
      throw error
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
      console.error('Error in payments listener:', error)
      if (error.code === 'permission-denied') {
        callback([])
      }
    })
  }

  const deletePayment = async (teamId: string, paymentId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'teams', teamId, 'payments', paymentId))
    } catch (error) {
      console.error('Error deleting payment:', error)
      throw error
    }
  }

  const addPayment = async (teamId: string, payment: Omit<IPayment, 'id'>): Promise<void> => {
    try {
      await addDoc(collection(doc(db, 'teams', teamId), 'payments'), payment)
    } catch (error) {
      console.error('Error adding payment:', error)
      throw error
    }
  }

  // ============================================================
  // Bulk Delete (for clear cashbox)
  // ============================================================

  const deleteAllFines = async (teamId: string): Promise<void> => {
    const finesRef = collection(doc(db, 'teams', teamId), 'fines')
    const snapshot = await getDocs(finesRef)
    for (let i = 0; i < snapshot.docs.length; i += 499) {
      const batch = writeBatch(db)
      snapshot.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }

  const deleteAllPayments = async (teamId: string): Promise<void> => {
    const paymentsRef = collection(doc(db, 'teams', teamId), 'payments')
    const snapshot = await getDocs(paymentsRef)
    for (let i = 0; i < snapshot.docs.length; i += 499) {
      const batch = writeBatch(db)
      snapshot.docs.slice(i, i + 499).forEach((d) => batch.delete(d.ref))
      await batch.commit()
    }
  }

  const bulkAddPayments = async (teamId: string, payments: Omit<IPayment, 'id'>[]): Promise<void> => {
    const paymentsRef = collection(doc(db, 'teams', teamId), 'payments')
    for (let i = 0; i < payments.length; i += 499) {
      const batch = writeBatch(db)
      payments.slice(i, i + 499).forEach((payment) => {
        batch.set(doc(paymentsRef), payment)
      })
      await batch.commit()
    }
  }

  // ============================================================
  // Cashbox History
  // ============================================================

  const addCashboxHistoryEntry = async (teamId: string, entry: Omit<ICashboxHistoryEntry, 'id'>): Promise<void> => {
    await addDoc(collection(doc(db, 'teams', teamId), 'cashboxHistory'), entry)
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
      console.error('Error in cashboxHistory listener:', error)
      if (error.code === 'permission-denied') {
        callback([])
      }
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
