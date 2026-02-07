import { describe, it, expect } from 'vitest'
import { countPositiveVotes, countNegativeVotes } from '../voteUtils'
import { IVote } from '@/interfaces/interfaces'

describe('voteUtils', () => {
  const mockVotes: IVote[] = [
    { userUid: 'user1', vote: true },
    { userUid: 'user2', vote: false },
    { userUid: 'user3', vote: true },
    { userUid: 'user4', vote: true },
    { userUid: 'user5', vote: false }
  ]

  describe('countPositiveVotes', () => {
    it('counts true votes correctly', () => {
      expect(countPositiveVotes(mockVotes)).toBe(3)
    })

    it('returns 0 for empty array', () => {
      expect(countPositiveVotes([])).toBe(0)
    })

    it('returns 0 when all votes are negative', () => {
      const allNegative: IVote[] = [
        { userUid: 'user1', vote: false },
        { userUid: 'user2', vote: false }
      ]
      expect(countPositiveVotes(allNegative)).toBe(0)
    })

    it('counts all when all votes are positive', () => {
      const allPositive: IVote[] = [
        { userUid: 'user1', vote: true },
        { userUid: 'user2', vote: true }
      ]
      expect(countPositiveVotes(allPositive)).toBe(2)
    })
  })

  describe('countNegativeVotes', () => {
    it('counts false votes correctly', () => {
      expect(countNegativeVotes(mockVotes)).toBe(2)
    })

    it('returns 0 for empty array', () => {
      expect(countNegativeVotes([])).toBe(0)
    })

    it('returns 0 when all votes are positive', () => {
      const allPositive: IVote[] = [
        { userUid: 'user1', vote: true },
        { userUid: 'user2', vote: true }
      ]
      expect(countNegativeVotes(allPositive)).toBe(0)
    })

    it('counts all when all votes are negative', () => {
      const allNegative: IVote[] = [
        { userUid: 'user1', vote: false },
        { userUid: 'user2', vote: false }
      ]
      expect(countNegativeVotes(allNegative)).toBe(2)
    })
  })
})
