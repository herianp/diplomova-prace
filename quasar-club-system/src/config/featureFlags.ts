/**
 * Feature flags for progressive migration and feature toggles.
 *
 * These flags enable safe data model migrations by allowing runtime control
 * of storage backends without code changes.
 */

const FEATURE_FLAGS = {
  /**
   * Controls vote read source:
   * - false: Read votes from surveys.votes array (current implementation)
   * - true: Read votes from surveys/{surveyId}/votes subcollection
   */
  USE_VOTE_SUBCOLLECTIONS: true,

  /**
   * Enables dual-write during migration:
   * - false: Write votes only to array (current implementation)
   * - true: Write votes to BOTH array and subcollection for safe migration
   */
  DUAL_WRITE_VOTES: false,
} as const

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS

/**
 * Type-safe feature flag getter.
 * @param flag - The feature flag key to check
 * @returns The current value of the feature flag
 */
export function isFeatureEnabled(flag: FeatureFlagKey): boolean {
  return FEATURE_FLAGS[flag]
}
