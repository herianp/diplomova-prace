import { IVote } from '@/interfaces/interfaces'

export const countPositiveVotes = (votes: IVote[]): number => {
  return votes.filter(v => v.vote).length
}

export const countNegativeVotes = (votes: IVote[]): number => {
  return votes.filter(v => !v.vote).length
}
