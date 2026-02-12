import { describe, it, expect } from 'vitest'
import {
  determineMatchResult,
  isBetCorrect,
  getMatchState,
} from '../matchSorting'
import type { Match } from '@/api/types'

describe('matchSorting utilities', () => {
  describe('determineMatchResult', () => {
    it('should return "1" for home win', () => {
      expect(determineMatchResult(2, 1)).toBe('1')
      expect(determineMatchResult(3, 0)).toBe('1')
      expect(determineMatchResult(1, 0)).toBe('1')
    })

    it('should return "X" for draw', () => {
      expect(determineMatchResult(0, 0)).toBe('X')
      expect(determineMatchResult(1, 1)).toBe('X')
      expect(determineMatchResult(3, 3)).toBe('X')
    })

    it('should return "2" for away win', () => {
      expect(determineMatchResult(1, 2)).toBe('2')
      expect(determineMatchResult(0, 3)).toBe('2')
      expect(determineMatchResult(0, 1)).toBe('2')
    })
  })

  describe('isBetCorrect', () => {
    describe('simple bets (1, X, 2)', () => {
      it('should return true for correct 1 bet (home win)', () => {
        expect(isBetCorrect('1', 2, 1)).toBe(true)
        expect(isBetCorrect('1', 3, 0)).toBe(true)
      })

      it('should return false for incorrect 1 bet', () => {
        expect(isBetCorrect('1', 1, 2)).toBe(false)
        expect(isBetCorrect('1', 1, 1)).toBe(false)
      })

      it('should return true for correct X bet (draw)', () => {
        expect(isBetCorrect('X', 0, 0)).toBe(true)
        expect(isBetCorrect('X', 2, 2)).toBe(true)
      })

      it('should return false for incorrect X bet', () => {
        expect(isBetCorrect('X', 2, 1)).toBe(false)
        expect(isBetCorrect('X', 0, 1)).toBe(false)
      })

      it('should return true for correct 2 bet (away win)', () => {
        expect(isBetCorrect('2', 1, 2)).toBe(true)
        expect(isBetCorrect('2', 0, 3)).toBe(true)
      })

      it('should return false for incorrect 2 bet', () => {
        expect(isBetCorrect('2', 2, 1)).toBe(false)
        expect(isBetCorrect('2', 1, 1)).toBe(false)
      })
    })

    describe('compound bets (1X, X2, 12)', () => {
      it('should return true for correct 1X bet (home win or draw)', () => {
        expect(isBetCorrect('1X', 2, 1)).toBe(true) // home win
        expect(isBetCorrect('1X', 1, 0)).toBe(true) // home win
        expect(isBetCorrect('1X', 1, 1)).toBe(true) // draw
      })

      it('should return false for incorrect 1X bet', () => {
        expect(isBetCorrect('1X', 1, 2)).toBe(false) // away win
        expect(isBetCorrect('1X', 0, 3)).toBe(false) // away win
      })

      it('should return true for correct X2 bet (draw or away win)', () => {
        expect(isBetCorrect('X2', 0, 0)).toBe(true) // draw
        expect(isBetCorrect('X2', 1, 1)).toBe(true) // draw
        expect(isBetCorrect('X2', 1, 2)).toBe(true) // away win
      })

      it('should return false for incorrect X2 bet', () => {
        expect(isBetCorrect('X2', 2, 0)).toBe(false) // home win
        expect(isBetCorrect('X2', 3, 1)).toBe(false) // home win
      })

      it('should return true for correct 12 bet (home win or away win)', () => {
        expect(isBetCorrect('12', 2, 1)).toBe(true) // home win
        expect(isBetCorrect('12', 1, 2)).toBe(true) // away win
      })

      it('should return false for incorrect 12 bet', () => {
        expect(isBetCorrect('12', 1, 1)).toBe(false) // draw
        expect(isBetCorrect('12', 2, 2)).toBe(false) // draw
      })
    })

    describe('invalid bet types', () => {
      it('should return false for unknown bet types', () => {
        expect(isBetCorrect('INVALID', 1, 0)).toBe(false)
        expect(isBetCorrect('ZZ', 0, 0)).toBe(false)
      })
    })
  })

  describe('getMatchState', () => {
    const baseMatch: Match = {
      id: 1,
      homeTeam: 'USA',
      awayTeam: 'Mexico',
      kickoffTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour in future
      groupLabel: 'Group B',
      homeScore: null,
      awayScore: null,
      oddsHome: null,
      oddsDraw: null,
      oddsAway: null,
      oddsHomeDraw: null,
      oddsDrawAway: null,
      oddsHomeAway: null,
    }

    it('should return "scored" when both scores are present', () => {
      const scoredMatch: Match = {
        ...baseMatch,
        homeScore: 2,
        awayScore: 1,
      }
      expect(getMatchState(scoredMatch)).toBe('scored')
    })

    it('should return "open" for future match with no scores', () => {
      expect(getMatchState(baseMatch)).toBe('open')
    })

    it('should return "locked" when match time has passed but no scores', () => {
      const lockedMatch: Match = {
        ...baseMatch,
        kickoffTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      }
      expect(getMatchState(lockedMatch)).toBe('locked')
    })
  })
})
