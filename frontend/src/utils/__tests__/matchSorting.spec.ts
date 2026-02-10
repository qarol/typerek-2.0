import { describe, it, expect } from 'vitest'
import { sortMatchesForDisplay } from '../matchSorting'
import type { Match } from '@/api/types'

describe('matchSorting.sortMatchesForDisplay', () => {
  const createMatch = (overrides: Partial<Match> = {}): Match => ({
    id: 1,
    homeTeam: 'Team A',
    awayTeam: 'Team B',
    kickoffTime: new Date().toISOString(),
    groupLabel: 'Group A',
    homeScore: null,
    awayScore: null,
    oddsHome: null,
    oddsDraw: null,
    oddsAway: null,
    oddsHomeDraw: null,
    oddsDrawAway: null,
    oddsHomeAway: null,
    ...overrides,
  })

  it('today\'s open matches appear before future open matches', () => {
    const now = new Date()
    // Create a match time for today that's 23:59 (guaranteed to be in future or current)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0)

    const todayOpenMatch = createMatch({
      id: 1,
      kickoffTime: today.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const futureOpenMatch = createMatch({
      id: 2,
      kickoffTime: tomorrow.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const result = sortMatchesForDisplay([futureOpenMatch, todayOpenMatch])
    expect(result[0].id).toBe(1) // today's match first
    expect(result[1].id).toBe(2) // future match second
  })

  it('future open matches sort before locked matches', () => {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const futureOpenMatch = createMatch({
      id: 1,
      kickoffTime: tomorrow.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const lockedMatch = createMatch({
      id: 2,
      kickoffTime: yesterday.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const result = sortMatchesForDisplay([lockedMatch, futureOpenMatch])
    expect(result[0].id).toBe(1) // open match first
    expect(result[1].id).toBe(2) // locked match second
  })

  it('locked matches sort before scored matches', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const lockedMatch = createMatch({
      id: 1,
      kickoffTime: yesterday.toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const scoredMatch = createMatch({
      id: 2,
      kickoffTime: yesterday.toISOString(),
      homeScore: 2,
      awayScore: 1,
    })

    const result = sortMatchesForDisplay([scoredMatch, lockedMatch])
    expect(result[0].id).toBe(1) // locked match first
    expect(result[1].id).toBe(2) // scored match second
  })

  it('within same priority group, matches sort by kickoffTime ascending', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const laterMatch = createMatch({
      id: 1,
      kickoffTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 21, 0).toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const earlierMatch = createMatch({
      id: 2,
      kickoffTime: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0).toISOString(),
      homeScore: null,
      awayScore: null,
    })

    const result = sortMatchesForDisplay([laterMatch, earlierMatch])
    expect(result[0].id).toBe(2) // earlier match first
    expect(result[1].id).toBe(1) // later match second
  })

  it('returns new array without mutating input', () => {
    const match1 = createMatch({ id: 1 })
    const match2 = createMatch({ id: 2 })
    const originalArray = [match1, match2]
    const originalLength = originalArray.length

    const result = sortMatchesForDisplay(originalArray)

    expect(originalArray.length).toBe(originalLength)
    expect(result).not.toBe(originalArray)
  })

  it('handles empty array', () => {
    const result = sortMatchesForDisplay([])
    expect(result).toEqual([])
  })

  it('handles single match', () => {
    const match = createMatch({ id: 1 })
    const result = sortMatchesForDisplay([match])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe(1)
  })
})
