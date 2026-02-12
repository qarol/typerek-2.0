import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiCollectionResponse, LeaderboardEntry } from '@/api/types'

export const useLeaderboardStore = defineStore('leaderboard', () => {
  const standings = ref<LeaderboardEntry[]>([])
  const loading = ref(false)
  const error = ref<{ code: string; message: string; field: string | null } | null>(null)

  async function fetchLeaderboard() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<ApiCollectionResponse<LeaderboardEntry>>('/leaderboard')
      if (response) {
        standings.value = response.data
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

  return { standings, loading, error, fetchLeaderboard }
})
