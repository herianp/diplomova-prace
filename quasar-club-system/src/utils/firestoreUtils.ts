import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase/config'

const FIRESTORE_IN_LIMIT = 30

/**
 * Query Firestore documents by IDs with automatic chunking
 * to respect the Firestore IN-query limit of 30 items.
 */
export async function queryByIdsInChunks<T extends { uid: string }>(
  collectionName: string,
  ids: string[],
  fieldPath: string = '__name__'
): Promise<T[]> {
  if (!ids?.length) return []

  const results: T[] = []

  for (let i = 0; i < ids.length; i += FIRESTORE_IN_LIMIT) {
    const chunk = ids.slice(i, i + FIRESTORE_IN_LIMIT)
    const q = query(
      collection(db, collectionName),
      where(fieldPath, 'in', chunk)
    )
    const snapshot = await getDocs(q)
    const chunkResults = snapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    })) as T[]
    results.push(...chunkResults)
  }

  return results
}
