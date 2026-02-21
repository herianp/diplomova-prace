import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore'
import { IAuditLog, AuditOperation } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { createLogger } from 'src/utils/logger'

const log = createLogger('auditLogFirebase')

export function useAuditLogFirebase() {
  /**
   * Fire-and-forget audit log write. Do NOT await — audit failures must not block operations.
   */
  const writeAuditLog = (entry: Omit<IAuditLog, 'id'>): Promise<void> => {
    const auditLogsRef = collection(doc(db, 'teams', entry.teamId), 'auditLogs')

    return addDoc(auditLogsRef, { ...entry, timestamp: new Date() })
      .then(() => {
        log.info('Audit log written', {
          teamId: entry.teamId,
          operation: entry.operation,
          actorUid: entry.actorUid,
          entityId: entry.entityId
        })
      })
      .catch((error) => {
        log.error('Failed to write audit log', {
          teamId: entry.teamId,
          operation: entry.operation,
          actorUid: entry.actorUid,
          entityId: entry.entityId,
          error: error instanceof Error ? error.message : String(error)
        })
        // Do NOT throw - audit failures are non-blocking
      })
  }

  const getAuditLogs = async (
    teamId: string,
    filters?: { operation?: AuditOperation; limitCount?: number }
  ): Promise<IAuditLog[]> => {
    try {
      const auditLogsRef = collection(doc(db, 'teams', teamId), 'auditLogs')

      // Build query with filters
      const constraints: ReturnType<typeof orderBy | typeof where | typeof limit>[] = [
        orderBy('timestamp', 'desc')
      ]

      if (filters?.operation) {
        constraints.push(where('operation', '==', filters.operation))
      }

      constraints.push(limit(filters?.limitCount ?? 100))

      const q = query(auditLogsRef, ...constraints)
      const snapshot = await getDocs(q)

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as IAuditLog))
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to get audit logs', {
        teamId,
        filters,
        error: firestoreError.message
      })
      throw firestoreError
    }
  }

  return {
    writeAuditLog,
    getAuditLogs,
  }
}
