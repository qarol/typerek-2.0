import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiResponse, ApiCollectionResponse, Bet, RevealedBet } from '@/api/types'

export const useBetsStore = defineStore('bets', () => {
  const bets = ref<Bet[]>([])
  const revealedBets = ref<Map<number, RevealedBet[]>>(new Map())
  const allPlayersByMatch = ref<Map<number, string[]>>(new Map())
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getBetForMatch = computed(() => (matchId: number) =>
    bets.value.find((b) => b.matchId === matchId)
  )

  async function fetchBets(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<ApiCollectionResponse<Bet>>('/bets')
      if (!response) throw new Error('Empty response')
      bets.value = response.data
    } catch (e) {
      if (e instanceof ApiClientError) error.value = e.code
      else error.value = 'UNKNOWN_ERROR'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function placeBet(matchId: number, betType: string): Promise<Bet> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<Bet>>('/bets', { matchId, betType })
      if (!response) {
        throw new Error('Empty response from POST /bets')
      }
      bets.value.push(response.data)
      return response.data
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = e.code
      } else {
        error.value = 'UNKNOWN_ERROR'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateBet(betId: number, betType: string): Promise<Bet> {
    loading.value = true
    error.value = null
    try {
      const response = await api.put<ApiResponse<Bet>>(`/bets/${betId}`, { betType })
      if (!response) {
        throw new Error('Empty response from PUT /bets/:id')
      }
      const index = bets.value.findIndex((b) => b.id === betId)
      if (index !== -1) {
        bets.value[index] = response.data
      }
      return response.data
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = e.code
      } else {
        error.value = 'UNKNOWN_ERROR'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function removeBet(betId: number): Promise<void> {
    loading.value = true
    error.value = null
    try {
      await api.delete(`/bets/${betId}`)
      bets.value = bets.value.filter((b) => b.id !== betId)
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = e.code
      } else {
        error.value = 'UNKNOWN_ERROR'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMatchBets(matchId: number): Promise<void> {
    try {
      const response = await api.get<ApiCollectionResponse<RevealedBet>>(`/matches/${matchId}/bets`)
      if (!response) throw new Error('Empty response')
      revealedBets.value.set(matchId, response.data)
      if (response.meta.allPlayers) {
        allPlayersByMatch.value.set(matchId, response.meta.allPlayers)
      }
    } catch (e) {
      // Don't throw — RevealList handles display gracefully
      // Silent fail: errors are expected in some scenarios (network, auth)
    }
  }

  function getRevealedBets(matchId: number): RevealedBet[] | undefined {
    return revealedBets.value.get(matchId)
  }

  function getAllPlayers(matchId: number): string[] | undefined {
    return allPlayersByMatch.value.get(matchId)
  }

  return { bets, revealedBets, allPlayersByMatch, loading, error, getBetForMatch, getRevealedBets, getAllPlayers, fetchBets, fetchMatchBets, placeBet, updateBet, removeBet }
})
