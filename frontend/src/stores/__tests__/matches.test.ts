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

      expect(store.error).toBe('UNAUTHORIZED')
      expect(store.loading).toBe(false)
    })
  })
})
