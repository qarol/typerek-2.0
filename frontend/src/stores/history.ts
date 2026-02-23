import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiCollectionResponse, HistoryEntry } from '@/api/types'

export const useHistoryStore = defineStore('history', () => {
  const entries = ref<HistoryEntry[]>([])
  const loading = ref(false)
  const error = ref<{ code: string; message: string; field: string | null } | null>(null)

  async function fetchHistory(userId: number) {
    loading.value = true
    error.value = null
    entries.value = []
    try {
      const response = await api.get<ApiCollectionResponse<HistoryEntry>>(`/users/${userId}/history`)
      if (response) {
        entries.value = response.data
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

  return { entries, loading, error, fetchHistory }
})
