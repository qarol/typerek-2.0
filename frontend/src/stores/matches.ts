import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiCollectionResponse, ApiResponse, Match } from '@/api/types'

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const error = ref<{ code: string; message: string; field: string | null } | null>(null)

  async function fetchMatches() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<ApiCollectionResponse<Match>>('/matches')
      if (response) {
        matches.value = response.data
      }
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = { code: e.code, message: e.message, field: e.field }
      } else {
        error.value = { code: 'UNKNOWN_ERROR', message: 'Unknown error', field: null }
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function updateMatchOdds(
    matchId: number,
    oddsData: Record<string, number>
  ): Promise<boolean> {
    error.value = null
    try {
      const response = await api.put<ApiResponse<Match>>(`/admin/matches/${matchId}`, oddsData)
      if (response?.data) {
        // Update match in local state
        const index = matches.value.findIndex((m) => m.id === matchId)
        if (index !== -1) {
          matches.value[index] = response.data
        }
        return true
      }
      return false
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = { code: e.code, message: e.message, field: e.field }
      } else {
        error.value = { code: 'UNKNOWN_ERROR', message: 'Unknown error', field: null }
      }
      return false
    }
  }

  async function submitMatchScore(
    matchId: number,
    homeScore: number,
    awayScore: number
  ): Promise<{ success: boolean; playersScored?: number }> {
    error.value = null
    try {
      const response = await api.post<{ data: Match; meta: { playersScored: number } }>(
        `/admin/matches/${matchId}/score`,
        { homeScore, awayScore }
      )
      if (response?.data) {
        // Update match in local state
        const index = matches.value.findIndex((m) => m.id === matchId)
        if (index !== -1) {
          matches.value[index] = response.data
        }
        return { success: true, playersScored: response.meta?.playersScored ?? 0 }
      }
      return { success: false }
    } catch (e) {
      if (e instanceof ApiClientError) {
        error.value = { code: e.code, message: e.message, field: e.field }
      } else {
        error.value = { code: 'UNKNOWN_ERROR', message: 'Unknown error', field: null }
      }
      return { success: false }
    }
  }

  return {
    matches,
    loading,
    error,
    fetchMatches,
    updateMatchOdds,
    submitMatchScore,
  }
})
