import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useMatchesStore } from '../matches'
import { api } from '@/api/client'
import type { ApiCollectionResponse, Match } from '@/api/types'

vi.mock('@/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string
    field: string | null

    constructor(error: { code: string; message: string; field: string | null }) {
      super(error.message)
      this.code = error.code
      this.field = error.field
    }
  },
}))

describe('useMatchesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchMatches', () => {
    it('should fetch matches successfully and populate matches list', async () => {
      const mockMatches: Match[] = [
        {
          id: 1,
          homeTeam: 'USA',
          awayTeam: 'Mexico',
          kickoffTime: '2026-06-12T18:00:00Z',
          groupLabel: 'Group B',
          homeScore: null,
          awayScore: null,
          oddsHome: null,
          oddsDraw: null,
          oddsAway: null,
          oddsHomeDraw: null,
          oddsDrawAway: null,
          oddsHomeAway: null,
        },
        {
          id: 2,
          homeTeam: 'Brazil',
          awayTeam: 'Argentina',
          kickoffTime: '2026-06-14T18:00:00Z',
          groupLabel: 'Group D',
          homeScore: 2,
          awayScore: 1,
          oddsHome: 2.1,
          oddsDraw: 3.45,
          oddsAway: 4.0,
          oddsHomeDraw: 1.25,
          oddsDrawAway: 1.8,
          oddsHomeAway: 1.5,
        },
      ]

      const mockResponse: ApiCollectionResponse<Match> = {
        data: mockMatches,
        meta: { count: 2 },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useMatchesStore()
      await store.fetchMatches()

      expect(api.get).toHaveBeenCalledWith('/matches')
      expect(store.matches).toEqual(mockMatches)
      expect(store.matches).toHaveLength(2)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set loading state during fetch', async () => {
      const mockResponse: ApiCollectionResponse<Match> = {
        data: [],
        meta: { count: 0 },
      }

      let resolvePromise: (value: unknown) => void
      const promise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      vi.mocked(api.get).mockReturnValue(promise as ReturnType<typeof api.get>)

      const store = useMatchesStore()
      const fetchPromise = store.fetchMatches()

      expect(store.loading).toBe(true)

      resolvePromise!(mockResponse)
      await fetchPromise

      expect(store.loading).toBe(false)
    })

    it('should set error code on API error', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.get).mockRejectedValue(
        new ApiClientError({ code: 'UNAUTHORIZED', message: 'Not logged in', field: null }),
      )

      const store = useMatchesStore()

      try {
        await store.fetchMatches()
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toEqual({ code: 'UNAUTHORIZED', message: 'Not logged in', field: null })
      expect(store.loading).toBe(false)
    })
  })

  describe('updateMatchOdds', () => {
    it('should update match odds successfully', async () => {
      const store = useMatchesStore()

      const existingMatch: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
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

      const updatedMatch: Match = {
        ...existingMatch,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      store.matches = [existingMatch]

      vi.mocked(api.put).mockResolvedValue({ data: updatedMatch })

      const result = await store.updateMatchOdds(1, {
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      })

      expect(api.put).toHaveBeenCalledWith('/admin/matches/1', {
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      })
      expect(result).toBe(true)
      expect(store.matches[0]).toEqual(updatedMatch)
      expect(store.error).toBeNull()
    })

    it('should return false on API error', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.put).mockRejectedValue(
        new ApiClientError({
          code: 'VALIDATION_ERROR',
          message: 'Odds home must be greater than 1.0',
          field: 'oddsHome',
        }),
      )

      const store = useMatchesStore()

      const result = await store.updateMatchOdds(1, {
        oddsHome: 0.99,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      })

      expect(result).toBe(false)
      expect(store.error).toEqual({
        code: 'VALIDATION_ERROR',
        message: 'Odds home must be greater than 1.0',
        field: 'oddsHome',
      })
    })

    it('should return false if response has no data', async () => {
      vi.mocked(api.put).mockResolvedValue(undefined)

      const store = useMatchesStore()

      const result = await store.updateMatchOdds(1, {
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      })

      expect(result).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should clear previous errors when updating odds', async () => {
      const store = useMatchesStore()
      store.error = { code: 'PREVIOUS_ERROR', message: 'Previous error', field: null }

      const match: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
        groupLabel: 'Group B',
        homeScore: null,
        awayScore: null,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      store.matches = [{ ...match, oddsHome: null, oddsDraw: null, oddsAway: null }]

      vi.mocked(api.put).mockResolvedValue({ data: match })

      await store.updateMatchOdds(1, {
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      })

      expect(store.error).toBeNull()
    })
  })

  describe('submitMatchScore', () => {
    it('should submit match score successfully', async () => {
      const store = useMatchesStore()

      const existingMatch: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
        groupLabel: 'Group B',
        homeScore: null,
        awayScore: null,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      const scoredMatch: Match = {
        ...existingMatch,
        homeScore: 2,
        awayScore: 1,
      }

      store.matches = [existingMatch]

      vi.mocked(api.post).mockResolvedValue({
        data: scoredMatch,
        meta: { playersScored: 5 },
      })

      const result = await store.submitMatchScore(1, 2, 1)

      expect(api.post).toHaveBeenCalledWith('/admin/matches/1/score', {
        homeScore: 2,
        awayScore: 1,
      })
      expect(result.success).toBe(true)
      expect(result.playersScored).toBe(5)
      expect(store.matches[0]).toEqual(scoredMatch)
      expect(store.error).toBeNull()
    })

    it('should return success false on API error', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.post).mockRejectedValue(
        new ApiClientError({
          code: 'SCORE_LOCKED',
          message: 'Results already calculated',
          field: null,
        }),
      )

      const store = useMatchesStore()

      const result = await store.submitMatchScore(1, 2, 1)

      expect(result.success).toBe(false)
      expect(store.error).toEqual({
        code: 'SCORE_LOCKED',
        message: 'Results already calculated',
        field: null,
      })
    })

    it('should return success false if response has no data', async () => {
      vi.mocked(api.post).mockResolvedValue(undefined)

      const store = useMatchesStore()

      const result = await store.submitMatchScore(1, 2, 1)

      expect(result.success).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should clear previous errors when submitting score', async () => {
      const store = useMatchesStore()
      store.error = { code: 'PREVIOUS_ERROR', message: 'Previous error', field: null }

      const match: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
        groupLabel: 'Group B',
        homeScore: 2,
        awayScore: 1,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      store.matches = [{ ...match, homeScore: null, awayScore: null }]

      vi.mocked(api.post).mockResolvedValue({
        data: match,
        meta: { playersScored: 3 },
      })

      const result = await store.submitMatchScore(1, 2, 1)

      expect(result.success).toBe(true)
      expect(store.error).toBeNull()
    })

    it('should update match in local state after successful submission', async () => {
      const store = useMatchesStore()

      const existingMatch: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
        groupLabel: 'Group B',
        homeScore: null,
        awayScore: null,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      const scoredMatch: Match = {
        ...existingMatch,
        homeScore: 3,
        awayScore: 2,
      }

      store.matches = [existingMatch]

      vi.mocked(api.post).mockResolvedValue({
        data: scoredMatch,
        meta: { playersScored: 8 },
      })

      await store.submitMatchScore(1, 3, 2)

      expect(store.matches[0].homeScore).toBe(3)
      expect(store.matches[0].awayScore).toBe(2)
    })

    it('should return 0 playersScored if meta is undefined', async () => {
      const store = useMatchesStore()

      const match: Match = {
        id: 1,
        homeTeam: 'USA',
        awayTeam: 'Mexico',
        kickoffTime: '2026-06-12T18:00:00Z',
        groupLabel: 'Group B',
        homeScore: 2,
        awayScore: 1,
        oddsHome: 2.1,
        oddsDraw: 3.45,
        oddsAway: 4.0,
        oddsHomeDraw: 1.25,
        oddsDrawAway: 1.8,
        oddsHomeAway: 1.5,
      }

      store.matches = []

      vi.mocked(api.post).mockResolvedValue({
        data: match,
        // meta is undefined or missing
      })

      const result = await store.submitMatchScore(1, 2, 1)

      expect(result.success).toBe(true)
      expect(result.playersScored).toBe(0)
    })
  })
})
