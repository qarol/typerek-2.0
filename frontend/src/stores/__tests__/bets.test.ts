import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBetsStore } from '../bets'
import { api } from '@/api/client'
import type { ApiResponse, ApiCollectionResponse, Bet, RevealedBet } from '@/api/types'

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

describe('useBetsStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('placeBet', () => {
    it('should add bet to store on successful create', async () => {
      const mockBet: Bet = {
        id: 1,
        matchId: 5,
        userId: 3,
        betType: '1',
        pointsEarned: 0,
      }

      const mockResponse: ApiResponse<Bet> = { data: mockBet }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      const result = await store.placeBet(5, '1')

      expect(api.post).toHaveBeenCalledWith('/bets', { matchId: 5, betType: '1' })
      expect(store.bets).toHaveLength(1)
      expect(store.bets[0]).toEqual(mockBet)
      expect(result).toEqual(mockBet)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set error on API failure', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.post).mockRejectedValue(
        new ApiClientError({ code: 'BET_LOCKED', message: 'Match has started', field: null }),
      )

      const store = useBetsStore()

      try {
        await store.placeBet(5, '1')
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('BET_LOCKED')
      expect(store.bets).toHaveLength(0)
      expect(store.loading).toBe(false)
    })
  })

  describe('updateBet', () => {
    it('should update existing bet in store', async () => {
      const existingBet: Bet = {
        id: 1,
        matchId: 5,
        userId: 3,
        betType: '1',
        pointsEarned: 0,
      }

      const updatedBet: Bet = {
        ...existingBet,
        betType: 'X',
      }

      const mockResponse: ApiResponse<Bet> = { data: updatedBet }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      store.bets.push(existingBet)

      const result = await store.updateBet(1, 'X')

      expect(api.put).toHaveBeenCalledWith('/bets/1', { betType: 'X' })
      expect(store.bets).toHaveLength(1)
      expect(store.bets[0].betType).toBe('X')
      expect(result).toEqual(updatedBet)
      expect(store.error).toBeNull()
    })

    it('should set error on update failure', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.put).mockRejectedValue(
        new ApiClientError({ code: 'NOT_FOUND', message: 'Bet not found', field: null }),
      )

      const store = useBetsStore()
      const existingBet: Bet = {
        id: 1,
        matchId: 5,
        userId: 3,
        betType: '1',
        pointsEarned: 0,
      }
      store.bets.push(existingBet)

      try {
        await store.updateBet(1, 'X')
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('NOT_FOUND')
      expect(store.bets[0].betType).toBe('1')
    })
  })

  describe('removeBet', () => {
    it('should remove bet from store', async () => {
      vi.mocked(api.delete).mockResolvedValue(undefined)

      const store = useBetsStore()
      const bet1: Bet = { id: 1, matchId: 5, userId: 3, betType: '1', pointsEarned: 0 }
      const bet2: Bet = { id: 2, matchId: 6, userId: 3, betType: 'X', pointsEarned: 0 }

      store.bets.push(bet1)
      store.bets.push(bet2)

      await store.removeBet(1)

      expect(api.delete).toHaveBeenCalledWith('/bets/1')
      expect(store.bets).toHaveLength(1)
      expect(store.bets[0].id).toBe(2)
      expect(store.error).toBeNull()
    })

    it('should set error on remove failure', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.delete).mockRejectedValue(
        new ApiClientError({ code: 'FORBIDDEN', message: 'Access denied', field: null }),
      )

      const store = useBetsStore()
      const bet: Bet = { id: 1, matchId: 5, userId: 3, betType: '1', pointsEarned: 0 }
      store.bets.push(bet)

      try {
        await store.removeBet(1)
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('FORBIDDEN')
      expect(store.bets).toHaveLength(1)
    })
  })

  describe('fetchBets', () => {
    it('should fetch and populate bets from API', async () => {
      const mockBets: Bet[] = [
        { id: 1, matchId: 5, userId: 3, betType: '1', pointsEarned: 0 },
        { id: 2, matchId: 6, userId: 3, betType: 'X', pointsEarned: 0 },
      ]

      const mockResponse: ApiCollectionResponse<Bet> = {
        data: mockBets,
        meta: { count: 2 },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      await store.fetchBets()

      expect(api.get).toHaveBeenCalledWith('/bets')
      expect(store.bets).toEqual(mockBets)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should set error on API failure', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.get).mockRejectedValue(
        new ApiClientError({ code: 'UNAUTHORIZED', message: 'Not authenticated', field: null }),
      )

      const store = useBetsStore()

      try {
        await store.fetchBets()
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('UNAUTHORIZED')
      expect(store.bets).toHaveLength(0)
      expect(store.loading).toBe(false)
    })

    it('should handle empty response', async () => {
      const mockResponse: ApiCollectionResponse<Bet> = {
        data: [],
        meta: { count: 0 },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      await store.fetchBets()

      expect(store.bets).toHaveLength(0)
      expect(store.error).toBeNull()
    })
  })

  describe('getBetForMatch', () => {
    it('should return bet for a given match', () => {
      const store = useBetsStore()
      const bet1: Bet = { id: 1, matchId: 5, userId: 3, betType: '1', pointsEarned: 0 }
      const bet2: Bet = { id: 2, matchId: 6, userId: 3, betType: 'X', pointsEarned: 0 }

      store.bets.push(bet1)
      store.bets.push(bet2)

      const result = store.getBetForMatch(5)

      expect(result).toEqual(bet1)
    })

    it('should return undefined if no bet exists for match', () => {
      const store = useBetsStore()
      const bet: Bet = { id: 1, matchId: 5, userId: 3, betType: '1', pointsEarned: 0 }

      store.bets.push(bet)

      const result = store.getBetForMatch(99)

      expect(result).toBeUndefined()
    })
  })

  describe('fetchMatchBets', () => {
    it('should fetch and store revealed bets and allPlayers for a match', async () => {
      const mockBets: RevealedBet[] = [
        { id: 1, userId: 3, matchId: 5, betType: '1', pointsEarned: 0, nickname: 'tomek' },
        { id: 2, userId: 1, matchId: 5, betType: '2', pointsEarned: 0, nickname: 'admin' },
      ]

      const mockResponse: ApiCollectionResponse<RevealedBet> = {
        data: mockBets,
        meta: { count: 2, allPlayers: ['admin', 'tomek'] },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      await store.fetchMatchBets(5)

      expect(api.get).toHaveBeenCalledWith('/matches/5/bets')
      expect(store.getRevealedBets(5)).toEqual(mockBets)
      expect(store.getAllPlayers(5)).toEqual(['admin', 'tomek'])
    })

    it('should handle API errors gracefully without throwing', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.get).mockRejectedValue(
        new ApiClientError({ code: 'UNAUTHORIZED', message: 'Not authenticated', field: null }),
      )

      const store = useBetsStore()

      // Should not throw - errors are logged only
      await expect(store.fetchMatchBets(5)).resolves.toBeUndefined()
      expect(store.getRevealedBets(5)).toBeUndefined()
    })

    it('should return undefined for unloaded match', () => {
      const store = useBetsStore()
      const result = store.getRevealedBets(999)
      expect(result).toBeUndefined()
    })

    it('should store allPlayers when available', async () => {
      const mockBets: RevealedBet[] = []
      const mockResponse: ApiCollectionResponse<RevealedBet> = {
        data: mockBets,
        meta: { count: 0, allPlayers: ['admin', 'tomek', 'maciek'] },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      await store.fetchMatchBets(7)

      expect(store.getAllPlayers(7)).toEqual(['admin', 'tomek', 'maciek'])
    })

    it('should not store allPlayers when undefined', async () => {
      const mockBets: RevealedBet[] = [
        { id: 1, userId: 3, matchId: 5, betType: '1', pointsEarned: 0, nickname: 'tomek' },
      ]
      const mockResponse: ApiCollectionResponse<RevealedBet> = {
        data: mockBets,
        meta: { count: 1 },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useBetsStore()
      await store.fetchMatchBets(5)

      expect(store.getAllPlayers(5)).toBeUndefined()
    })
  })
})
