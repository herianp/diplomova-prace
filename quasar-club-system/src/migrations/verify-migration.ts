import { db } from '@/firebase/config'
import { collection, getDocs } from 'firebase/firestore'
import { ISurvey, IVote } from '@/interfaces/interfaces'
import { createLogger } from 'src/utils/logger'

const log = createLogger('migration-verify')

export interface VoteMismatch {
  surveyId: string
  type: 'count_mismatch' | 'missing_in_subcollection' | 'missing_in_array' | 'value_mismatch'
  details: string  // e.g. "array: 12, subcollection: 11" or "userUid xyz missing"
}

export interface VerificationResult {
  totalSurveys: number
  surveysChecked: number
  surveysWithVotes: number
  perfectMatches: number
  mismatchCount: number
  mismatches: VoteMismatch[]
  passed: boolean  // true only if mismatchCount === 0
  durationMs: number
}

/**
 * Verify migration integrity by comparing array votes vs subcollection votes
 *
 * This is a read-only script that checks data consistency without modifying anything.
 * Compares every survey's votes array against its subcollection and reports mismatches.
 *
 * Checks performed:
 * 1. Count equality: array length === subcollection size
 * 2. Value equality: each array vote matches its subcollection counterpart
 * 3. Orphan detection: no extra votes in either direction
 *
 * @returns VerificationResult with passed/failed status and detailed mismatch list
 */
export async function verifyMigrationIntegrity(): Promise<VerificationResult> {
  const startTime = Date.now()

  const result: VerificationResult = {
    totalSurveys: 0,
    surveysChecked: 0,
    surveysWithVotes: 0,
    perfectMatches: 0,
    mismatchCount: 0,
    mismatches: [],
    passed: false,
    durationMs: 0
  }

  try {
    log.info('Starting migration verification')

    // Fetch all surveys
    const surveysSnapshot = await getDocs(collection(db, 'surveys'))
    result.totalSurveys = surveysSnapshot.docs.length

    log.info(`Found ${result.totalSurveys} surveys to verify`)

    // Check each survey
    for (const surveyDoc of surveysSnapshot.docs) {
      const surveyId = surveyDoc.id
      const surveyData = surveyDoc.data() as ISurvey
      const arrayVotes = surveyData.votes || []

      result.surveysChecked++

      // Read subcollection votes
      const subcollectionSnapshot = await getDocs(collection(db, 'surveys', surveyId, 'votes'))
      const subcollectionVotes = subcollectionSnapshot.docs.map(doc => ({
        userUid: doc.id,
        vote: doc.data().vote as boolean
      }))

      // Track if this survey has votes
      if (arrayVotes.length > 0) {
        result.surveysWithVotes++
      }

      // Check 1: Count equality
      if (arrayVotes.length !== subcollectionVotes.length) {
        result.mismatchCount++
        result.mismatches.push({
          surveyId,
          type: 'count_mismatch',
          details: `array: ${arrayVotes.length}, subcollection: ${subcollectionVotes.length}`
        })
        log.warn(`Count mismatch in survey ${surveyId}`, {
          surveyId,
          arrayCount: arrayVotes.length,
          subcollectionCount: subcollectionVotes.length
        })
        continue // Skip further checks if counts don't match
      }

      let hasMismatch = false

      // Check 2: Value equality - each array vote must match subcollection
      for (const arrayVote of arrayVotes) {
        const subcollectionVote = subcollectionVotes.find(v => v.userUid === arrayVote.userUid)

        if (!subcollectionVote) {
          result.mismatchCount++
          result.mismatches.push({
            surveyId,
            type: 'missing_in_subcollection',
            details: `userUid ${arrayVote.userUid} exists in array but not in subcollection`
          })
          log.warn(`Missing vote in subcollection`, {
            surveyId,
            userUid: arrayVote.userUid
          })
          hasMismatch = true
        } else if (subcollectionVote.vote !== arrayVote.vote) {
          result.mismatchCount++
          result.mismatches.push({
            surveyId,
            type: 'value_mismatch',
            details: `userUid ${arrayVote.userUid}: array=${arrayVote.vote}, subcollection=${subcollectionVote.vote}`
          })
          log.warn(`Vote value mismatch`, {
            surveyId,
            userUid: arrayVote.userUid,
            arrayVote: arrayVote.vote,
            subcollectionVote: subcollectionVote.vote
          })
          hasMismatch = true
        }
      }

      // Check 3: Orphan detection - each subcollection vote must exist in array
      for (const subcollectionVote of subcollectionVotes) {
        const arrayVote = arrayVotes.find(v => v.userUid === subcollectionVote.userUid)

        if (!arrayVote) {
          result.mismatchCount++
          result.mismatches.push({
            surveyId,
            type: 'missing_in_array',
            details: `userUid ${subcollectionVote.userUid} exists in subcollection but not in array`
          })
          log.warn(`Orphan vote in subcollection`, {
            surveyId,
            userUid: subcollectionVote.userUid
          })
          hasMismatch = true
        }
      }

      // Track perfect matches
      if (!hasMismatch && arrayVotes.length === subcollectionVotes.length) {
        result.perfectMatches++
        log.debug(`Perfect match for survey ${surveyId}`, {
          surveyId,
          voteCount: arrayVotes.length
        })
      }
    }

    result.passed = result.mismatchCount === 0
    result.durationMs = Date.now() - startTime

    if (result.passed) {
      log.info('✓ Verification PASSED - all surveys match perfectly', {
        totalSurveys: result.totalSurveys,
        surveysChecked: result.surveysChecked,
        surveysWithVotes: result.surveysWithVotes,
        perfectMatches: result.perfectMatches,
        durationMs: result.durationMs
      })
    } else {
      log.error('✗ Verification FAILED - mismatches detected', {
        totalSurveys: result.totalSurveys,
        surveysChecked: result.surveysChecked,
        surveysWithVotes: result.surveysWithVotes,
        perfectMatches: result.perfectMatches,
        mismatchCount: result.mismatchCount,
        durationMs: result.durationMs
      })
    }

    return result

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    log.error('Verification failed catastrophically', { error: errorMessage })
    result.durationMs = Date.now() - startTime
    throw error
  }
}
