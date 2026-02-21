import { db } from '@/firebase/config'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  getDoc,
  getDocs,
  setDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore'
import { ISurvey, IVote, SurveyStatus, ISurveyNotificationData } from '@/interfaces/interfaces'
import { mapFirestoreError } from '@/errors/errorMapper'
import { FirestoreError } from '@/errors'
import { createLogger } from 'src/utils/logger'
import { isFeatureEnabled } from '@/config/featureFlags'
import { useAuditLogFirebase } from '@/services/auditLogFirebase'

const log = createLogger('surveyFirebase')

export function useSurveyFirebase() {
  const getSurveysByTeamId = (
    teamId: string,
    callback: (surveys: ISurvey[]) => void,
    onError?: (error: FirestoreError) => void
  ): Unsubscribe => {
    const surveysQuery = query(collection(db, 'surveys'), where('teamId', '==', teamId))

    return onSnapshot(surveysQuery, async (snapshot) => {
      let surveys = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ISurvey))

      // If using subcollection for votes, enrich surveys with subcollection data
      if (isFeatureEnabled('USE_VOTE_SUBCOLLECTIONS')) {
        try {
          // Parallelize subcollection reads across all surveys
          surveys = await Promise.all(
            surveys.map(async (survey) => {
              // Skip surveys without ID (shouldn't happen but protects against undefined)
              if (!survey.id) {
                log.warn('Survey missing ID, skipping subcollection enrichment', { survey })
                return survey
              }

              try {
                const subcollectionVotes = await getVotesFromSubcollection(survey.id)
                return { ...survey, votes: subcollectionVotes }
              } catch (error) {
                // If subcollection read fails, fall back to array votes
                log.warn('Failed to read votes from subcollection, using array fallback', {
                  surveyId: survey.id,
                  error: error instanceof Error ? error.message : String(error)
                })
                return survey
              }
            })
          )
        } catch (error) {
          log.warn('Failed to enrich surveys with subcollection votes', {
            teamId,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      callback(surveys)
    }, (error) => {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Survey listener failed', { teamId, code: error.code, error: firestoreError.message })

      if (error.code === 'permission-denied' && onError) {
        onError(firestoreError)
      } else {
        callback([]) // Graceful degradation for transient errors
      }
    })
  }

  const getSurveyById = async (surveyId: string): Promise<ISurvey | null> => {
    try {
      const surveyRef = doc(db, 'surveys', surveyId)
      const surveyDoc = await getDoc(surveyRef)

      if (!surveyDoc.exists()) return null

      return { id: surveyDoc.id, ...surveyDoc.data() } as ISurvey
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'read')
      log.error('Failed to get survey', { surveyId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const deleteSurvey = async (
    surveyId: string,
    auditContext?: { teamId: string; actorUid: string; actorDisplayName: string; surveyTitle?: string }
  ) => {
    try {
      await deleteDoc(doc(db, 'surveys', surveyId))

      // Audit log (non-blocking, SEC-01)
      if (auditContext) {
        const { writeAuditLog } = useAuditLogFirebase()
        writeAuditLog({
          teamId: auditContext.teamId,
          operation: 'survey.delete',
          actorUid: auditContext.actorUid,
          actorDisplayName: auditContext.actorDisplayName,
          timestamp: new Date(),
          entityId: surveyId,
          entityType: 'survey',
          before: auditContext.surveyTitle ? { title: auditContext.surveyTitle } : undefined
        })
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'delete')
      log.error('Failed to delete survey', { surveyId, error: firestoreError.message })
      throw firestoreError
    }
  }

  const addSurvey = async (
    newSurvey: ISurvey,
    teamMembers: string[] = [],
    auditContext?: { actorUid: string; actorDisplayName: string }
  ): Promise<ISurveyNotificationData> => {
    try {
      // Create the survey
      const surveyRef = await addDoc(collection(db, 'surveys'), {
        ...newSurvey,
        createdDate: new Date().getTime().toString(),
        votes: [],
      })

      // Audit log (non-blocking, SEC-01)
      if (auditContext) {
        const { writeAuditLog } = useAuditLogFirebase()
        writeAuditLog({
          teamId: newSurvey.teamId,
          operation: 'survey.create',
          actorUid: auditContext.actorUid,
          actorDisplayName: auditContext.actorDisplayName,
          timestamp: new Date(),
          entityId: surveyRef.id,
          entityType: 'survey',
          metadata: {
            title: newSurvey.title,
            ...(newSurvey.description && { description: newSurvey.description }),
            ...(newSurvey.date && { date: newSurvey.date }),
            ...(newSurvey.time && { time: newSurvey.time }),
            ...(newSurvey.type && { type: newSurvey.type })
          }
        })
      }

      // Return survey data for notifications (to be handled by composable)
      return {
        id: surveyRef.id,
        title: newSurvey.title,
        teamId: newSurvey.teamId,
        teamMembers
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to add survey', { teamId: newSurvey.teamId, title: newSurvey.title, error: firestoreError.message })
      throw firestoreError
    }
  }

  const updateSurvey = async (
    surveyId: string,
    updatedSurvey: Partial<ISurvey>,
    auditContext?: { teamId: string; actorUid: string; actorDisplayName: string; before?: Partial<ISurvey> }
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, 'surveys', surveyId), updatedSurvey)

      // Audit log (non-blocking, SEC-01)
      if (auditContext) {
        const { writeAuditLog } = useAuditLogFirebase()

        // Only log fields that actually changed
        const changes: Record<string, unknown> = {}
        const before = auditContext.before || {}
        const trackedFields = ['title', 'description', 'date', 'time', 'type'] as const
        for (const field of trackedFields) {
          if (field in updatedSurvey && updatedSurvey[field] !== before[field]) {
            changes[field] = `${before[field] ?? ''} → ${updatedSurvey[field]}`
          }
        }

        writeAuditLog({
          teamId: auditContext.teamId,
          operation: 'survey.update',
          actorUid: auditContext.actorUid,
          actorDisplayName: auditContext.actorDisplayName,
          timestamp: new Date(),
          entityId: surveyId,
          entityType: 'survey',
          metadata: Object.keys(changes).length > 0 ? changes : { note: 'no visible changes' }
        })
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to update survey', { surveyId, error: firestoreError.message })
      throw firestoreError
    }
  }

  // Internal helper: Write vote to subcollection
  // NOTE: Subcollection architecture eliminates IN query limit issues (DAT-03).
  // Votes are queried per-survey via getDocs on the subcollection, not by user ID list.
  const addVoteToSubcollection = async (surveyId: string, userUid: string, vote: boolean): Promise<void> => {
    const voteRef = doc(db, 'surveys', surveyId, 'votes', userUid)
    await setDoc(voteRef, {
      userUid,
      vote,
      updatedAt: new Date()
    }, { merge: true })
  }

  // Internal helper: Dual-write vote to both array and subcollection atomically
  const addVoteDualWrite = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]): Promise<void> => {
    const batch = writeBatch(db)
    const surveyRef = doc(db, 'surveys', surveyId)
    const voteRef = doc(db, 'surveys', surveyId, 'votes', userUid)

    // Prepare updated array votes
    const existingVote = votes.find((vote) => vote.userUid === userUid)
    let updatedVotes: IVote[]

    if (existingVote) {
      updatedVotes = votes.map((vote) =>
        vote.userUid === userUid ? { ...vote, vote: newVote } : vote
      )
    } else {
      updatedVotes = [...votes, { userUid, vote: newVote }]
    }

    // Operation 1: Update array in survey document
    batch.update(surveyRef, { votes: updatedVotes })

    // Operation 2: Write to subcollection
    batch.set(voteRef, {
      userUid,
      vote: newVote,
      updatedAt: new Date()
    }, { merge: true })

    // Commit atomically
    await batch.commit()
  }

  // Read all votes from subcollection
  const getVotesFromSubcollection = async (surveyId: string): Promise<IVote[]> => {
    const votesCollection = collection(db, 'surveys', surveyId, 'votes')
    const votesSnapshot = await getDocs(votesCollection)
    return votesSnapshot.docs.map((doc) => ({
      userUid: doc.id,
      vote: doc.data().vote
    }))
  }

  // Unified voting function - handles both new votes and vote updates
  const addOrUpdateVote = async (surveyId: string, userUid: string, newVote: boolean, votes: IVote[]) => {
    try {
      // Check if vote unchanged (optimization - works for both backends)
      const existingVote = votes.find((vote) => vote.userUid === userUid)
      if (existingVote && existingVote.vote === newVote) {
        return
      }

      if (isFeatureEnabled('DUAL_WRITE_VOTES')) {
        // Transition mode: Write to both array and subcollection atomically
        await addVoteDualWrite(surveyId, userUid, newVote, votes)
      } else if (isFeatureEnabled('USE_VOTE_SUBCOLLECTIONS')) {
        // Post-migration mode: Write only to subcollection
        await addVoteToSubcollection(surveyId, userUid, newVote)
      } else {
        // Current array-only mode (default)
        const surveyRef = doc(db, 'surveys', surveyId)
        let updatedVotes: IVote[]

        if (existingVote) {
          // Update existing vote
          updatedVotes = votes.map((vote) =>
            vote.userUid === userUid ? { ...vote, vote: newVote } : vote
          )
        } else {
          // Add new vote
          updatedVotes = [...votes, { userUid, vote: newVote }]
        }

        await updateDoc(surveyRef, { votes: updatedVotes })
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to add/update vote', { surveyId, userUid, vote: newVote, error: firestoreError.message })
      throw firestoreError
    }
  }


  const updateSurveyStatus = async (surveyId: string, status: SurveyStatus, verifiedBy?: string) => {
    try {
      const updateData: Partial<ISurvey> = { status }

      if (status === SurveyStatus.CLOSED && verifiedBy) {
        updateData.verifiedAt = new Date()
        updateData.verifiedBy = verifiedBy
      }

      await updateDoc(doc(db, 'surveys', surveyId), updateData)
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to update survey status', { surveyId, status, verifiedBy, error: firestoreError.message })
      throw firestoreError
    }
  }

  const verifySurvey = async (
    surveyId: string,
    verifiedBy: string,
    updatedVotes?: IVote[],
    auditContext?: { teamId: string; actorDisplayName: string }
  ) => {
    try {
      const updateData: Partial<ISurvey> = {
        status: SurveyStatus.CLOSED,
        verifiedAt: new Date(),
        verifiedBy: verifiedBy
      }

      if (updatedVotes) {
        updateData.votes = updatedVotes
      }

      // If dual-write enabled and votes provided, also write to subcollection
      if (isFeatureEnabled('DUAL_WRITE_VOTES') && updatedVotes) {
        const batch = writeBatch(db)
        const surveyRef = doc(db, 'surveys', surveyId)

        // Update survey document
        batch.update(surveyRef, updateData)

        // Write each vote to subcollection
        updatedVotes.forEach((vote) => {
          const voteRef = doc(db, 'surveys', surveyId, 'votes', vote.userUid)
          batch.set(voteRef, {
            userUid: vote.userUid,
            vote: vote.vote,
            updatedAt: new Date()
          }, { merge: true })
        })

        await batch.commit()
      } else {
        // Array-only mode
        await updateDoc(doc(db, 'surveys', surveyId), updateData)
      }

      // Audit log (non-blocking, SEC-01)
      if (auditContext) {
        const { writeAuditLog } = useAuditLogFirebase()
        writeAuditLog({
          teamId: auditContext.teamId,
          operation: 'vote.verify',
          actorUid: verifiedBy,
          actorDisplayName: auditContext.actorDisplayName,
          timestamp: new Date(),
          entityId: surveyId,
          entityType: 'vote',
          metadata: updatedVotes ? { voteCount: updatedVotes.length } : undefined
        })
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to verify survey', { surveyId, verifiedBy, error: firestoreError.message })
      throw firestoreError
    }
  }

  const updateSurveyVotes = async (surveyId: string, votes: IVote[]) => {
    try {
      // If dual-write enabled, sync votes to subcollection as well
      if (isFeatureEnabled('DUAL_WRITE_VOTES')) {
        const batch = writeBatch(db)
        const surveyRef = doc(db, 'surveys', surveyId)

        // Update array
        batch.update(surveyRef, { votes })

        // Write each vote to subcollection
        votes.forEach((vote) => {
          const voteRef = doc(db, 'surveys', surveyId, 'votes', vote.userUid)
          batch.set(voteRef, {
            userUid: vote.userUid,
            vote: vote.vote,
            updatedAt: new Date()
          }, { merge: true })
        })

        await batch.commit()
      } else {
        // Array-only mode
        await updateDoc(doc(db, 'surveys', surveyId), { votes })
      }
    } catch (error: unknown) {
      const firestoreError = mapFirestoreError(error, 'write')
      log.error('Failed to update survey votes', { surveyId, voteCount: votes.length, error: firestoreError.message })
      throw firestoreError
    }
  }

  return {
    getSurveysByTeamId,
    getSurveyById,
    deleteSurvey,
    addSurvey,
    updateSurvey,
    addOrUpdateVote,
    updateSurveyStatus,
    verifySurvey,
    updateSurveyVotes,
    getVotesFromSubcollection,
  }
}