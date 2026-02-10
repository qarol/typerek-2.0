import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiResponse, Bet } from '@/api/types'

export const useBetsStore = defineStore('bets', () => {
  const bets = ref<Bet[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const getBetForMatch = computed(() => (matchId: number) =>
    bets.value.find((b) => b.matchId === matchId)
  )

  async function fetchBets() {
    loading.value = true
    error.value = null
    try {
      // Placeholder: GET /bets endpoint not in this story
      // This will be populated by BetSelector component in Story 3.2
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

  async function placeBet(matchId: number, betType: string): Promise<Bet> {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<Bet>>('/bets', { matchId, betType })
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

  return { bets, loading, error, getBetForMatch, fetchBets, placeBet, updateBet, removeBet }
})
