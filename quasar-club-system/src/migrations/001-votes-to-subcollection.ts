import { db } from '@/firebase/config'
import { collection, getDocs, doc, writeBatch } from 'firebase/firestore'
import { ISurvey, IVote } from '@/interfaces/interfaces'
import { createLogger } from 'src/utils/logger'

const log = createLogger('migration')

export interface MigrationResult {
  totalSurveys: number
  surveysWithVotes: number
  surveysSkipped: number  // surveys with 0 votes
  successCount: number
  failedCount: number
  totalVotesMigrated: number
  errors: Array<{ surveyId: string; error: string }>
  durationMs: number
}

/**
 * Migrate all existing votes from survey document arrays to subcollections
 *
 * This script is idempotent - it can be safely re-run without duplicating data.
 * Uses rate-limited batch writes to avoid Firestore quota errors.
 *
 * Each vote is written to: surveys/{surveyId}/votes/{userUid}
 * with structure: { userUid: string, vote: boolean, updatedAt: Date }
 *
 * @returns MigrationResult with counts, errors, and timing
 */
export async function migrateAllSurveyVotes(): Promise<MigrationResult> {
  const startTime = Date.now()

  const result: MigrationResult = {
    totalSurveys: 0,
    surveysWithVotes: 0,
    surveysSkipped: 0,
    successCount: 0,
    failedCount: 0,
    totalVotesMigrated: 0,
    errors: [],
    durationMs: 0
  }

  try {
    log.info('Starting votes migration to subcollections')

    // Fetch all surveys
    const surveysSnapshot = await getDocs(collection(db, 'surveys'))
    result.totalSurveys = surveysSnapshot.docs.length

    log.info(`Found ${result.totalSurveys} surveys to process`)

    let batchCount = 0

    // Process each survey
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyId = surveyDoc.id
      const surveyData = surveyDoc.data() as ISurvey
      const votes = surveyData.votes || []

      // Skip surveys with no votes
      if (votes.length === 0) {
        result.surveysSkipped++
        log.debug(`Skipping survey ${surveyId} - no votes`)
        continue
      }

      result.surveysWithVotes++

      try {
        // Batch write votes to subcollection
        // Use chunks of 499 operations (Firestore limit is 500)
        for (let i = 0; i < votes.length; i += 499) {
          const batch = writeBatch(db)
          const chunk = votes.slice(i, i + 499)

          chunk.forEach((vote: IVote) => {
            const voteRef = doc(db, 'surveys', surveyId, 'votes', vote.userUid)
            // Use set() for idempotency - overwrites existing docs
            batch.set(voteRef, {
              userUid: vote.userUid,
              vote: vote.vote,
              updatedAt: new Date()
            })
          })

          await batch.commit()
          batchCount++

          // Rate limiting: 200ms delay after each batch
          await new Promise(resolve => setTimeout(resolve, 200))

          // Extra pause every 10 batches (approximately 5000 writes)
          if (batchCount % 10 === 0) {
            log.debug(`Processed ${batchCount} batches, pausing for 1s`)
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }

        result.successCount++
        result.totalVotesMigrated += votes.length
        log.info(`Migrated survey ${surveyId}`, { voteCount: votes.length })

      } catch (error) {
        result.failedCount++
        const errorMessage = error instanceof Error ? error.message : String(error)
        result.errors.push({ surveyId, error: errorMessage })
        log.error(`Failed to migrate survey ${surveyId}`, {
          surveyId,
          voteCount: votes.length,
          error: errorMessage
        })
        // Continue to next survey - don't abort entire migration
      }
    }

    result.durationMs = Date.now() - startTime

    log.info('Migration completed', {
      totalSurveys: result.totalSurveys,
      surveysWithVotes: result.surveysWithVotes,
      surveysSkipped: result.surveysSkipped,
      successCount: result.successCount,
      failedCount: result.failedCount,
      totalVotesMigrated: result.totalVotesMigrated,
      durationMs: result.durationMs,
      errorCount: result.errors.length
    })

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('Migration failed catastrophically', { error: errorMessage })
    result.durationMs = Date.now() - startTime
    throw error
  }
}
