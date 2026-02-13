import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Firebase before importing the module under test
const mockGetDocs = vi.fn()
const mockCollection = vi.fn()
const mockQuery = vi.fn()
const mockWhere = vi.fn()

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args)
}))

vi.mock('@/firebase/config', () => ({
  db: 'mock-db'
}))

import { queryByIdsInChunks } from '../firestoreUtils'

interface MockUser {
  uid: string
  name: string
}

describe('firestoreUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollection.mockReturnValue('mock-collection-ref')
    mockQuery.mockReturnValue('mock-query')
    mockWhere.mockReturnValue('mock-where-clause')
  })

  describe('queryByIdsInChunks', () => {
    it('returns empty array for empty ids', async () => {
      const result = await queryByIdsInChunks<MockUser>('users', [])
      expect(result).toEqual([])
      expect(mockGetDocs).not.toHaveBeenCalled()
    })

    it('returns empty array for null/undefined ids', async () => {
      const result = await queryByIdsInChunks<MockUser>('users', null as unknown as string[])
      expect(result).toEqual([])
    })

    it('queries single chunk for <= 30 ids', async () => {
      const ids = Array.from({ length: 5 }, (_, i) => `id-${i}`)

      mockGetDocs.mockResolvedValue({
        docs: ids.map(id => ({
          id,
          data: () => ({ name: `User ${id}` })
        }))
      })

      const result = await queryByIdsInChunks<MockUser>('users', ids)

      expect(mockGetDocs).toHaveBeenCalledTimes(1)
      expect(mockWhere).toHaveBeenCalledWith('__name__', 'in', ids)
      expect(result).toHaveLength(5)
      expect(result[0]).toEqual({ uid: 'id-0', name: 'User id-0' })
    })

    it('chunks queries for > 30 ids', async () => {
      const ids = Array.from({ length: 45 }, (_, i) => `id-${i}`)

      mockGetDocs
        .mockResolvedValueOnce({
          docs: ids.slice(0, 30).map(id => ({
            id,
            data: () => ({ name: `User ${id}` })
          }))
        })
        .mockResolvedValueOnce({
          docs: ids.slice(30).map(id => ({
            id,
            data: () => ({ name: `User ${id}` })
          }))
        })

      const result = await queryByIdsInChunks<MockUser>('users', ids)

      expect(mockGetDocs).toHaveBeenCalledTimes(2)
      expect(result).toHaveLength(45)
    })

    it('uses custom fieldPath when provided', async () => {
      mockGetDocs.mockResolvedValue({
        docs: [{ id: 'id-1', data: () => ({ name: 'User 1' }) }]
      })

      await queryByIdsInChunks<MockUser>('users', ['id-1'], 'uid')

      expect(mockWhere).toHaveBeenCalledWith('uid', 'in', ['id-1'])
    })

    it('merges results from multiple chunks', async () => {
      const ids = Array.from({ length: 65 }, (_, i) => `id-${i}`)

      mockGetDocs
        .mockResolvedValueOnce({
          docs: ids.slice(0, 30).map(id => ({
            id,
            data: () => ({ name: `User ${id}` })
          }))
        })
        .mockResolvedValueOnce({
          docs: ids.slice(30, 60).map(id => ({
            id,
            data: () => ({ name: `User ${id}` })
          }))
        })
        .mockResolvedValueOnce({
          docs: ids.slice(60).map(id => ({
            id,
            data: () => ({ name: `User ${id}` })
          }))
        })

      const result = await queryByIdsInChunks<MockUser>('users', ids)

      expect(mockGetDocs).toHaveBeenCalledTimes(3)
      expect(result).toHaveLength(65)
    })
  })
})
