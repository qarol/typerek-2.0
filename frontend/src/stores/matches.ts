import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiCollectionResponse, Match } from '@/api/types'

export const useMatchesStore = defineStore('matches', () => {
  const matches = ref<Match[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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
        error.value = e.code
      } else {
        error.value = 'UNKNOWN_ERROR'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    matches,
    loading,
    error,
    fetchMatches,
  }
})
