import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type { ApiResponse, User } from '@/api/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => user.value !== null)
  const isAdmin = computed(() => user.value?.admin ?? false)

  async function login(nickname: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const response = await api.post<ApiResponse<User>>('/sessions', { nickname, password })
      user.value = response.data
    } catch (e) {
      if (e instanceof ApiClientError) {
        // Store error code for i18n translation in components
        error.value = e.error.code
      } else {
        error.value = 'UNKNOWN_ERROR'
      }
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await api.delete('/sessions')
    } finally {
      user.value = null
    }
  }

  async function checkSession() {
    try {
      const response = await api.get<ApiResponse<User>>('/me')
      user.value = response.data
    } catch (e) {
      // Distinguish between "not authenticated" (401) and network errors
      if (e instanceof ApiClientError && e.error.code === 'UNAUTHORIZED') {
        user.value = null // Not logged in - expected
      } else {
        // Network error or API down - preserve existing state if any
        // Only clear user if we don't have one
        if (!user.value) {
          user.value = null
        }
        // Could log this error for debugging
      }
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    user,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    checkSession,
    clearError,
  }
})
