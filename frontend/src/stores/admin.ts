import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api, ApiClientError } from '@/api/client'
import type {
  ApiResponse,
  ApiCollectionResponse,
  AdminUser,
  InviteResponse,
} from '@/api/types'

export const useAdminStore = defineStore('admin', () => {
  const users = ref<AdminUser[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const inviteUrl = ref<string | null>(null)

  async function fetchUsers() {
    loading.value = true
    error.value = null
    try {
      const response = await api.get<ApiCollectionResponse<AdminUser>>('/admin/users')
      users.value = response.data
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

  async function toggleAdmin(userId: number, isAdmin: boolean) {
    loading.value = true
    error.value = null
    try {
      const response = await api.put<ApiResponse<AdminUser>>(`/admin/users/${userId}`, {
        admin: isAdmin,
      })
      // Update user in local list
      const index = users.value.findIndex((u) => u.id === userId)
      if (index !== -1) {
        users.value[index] = response.data
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

  async function createInvite(nickname: string) {
    loading.value = true
    error.value = null
    inviteUrl.value = null
    try {
      const response = await api.post<ApiResponse<InviteResponse>>('/admin/invitations', {
        nickname,
      })
      // Add new user to local list
      const newUser: AdminUser = {
        id: response.data.id,
        nickname: response.data.nickname,
        admin: false,
        activated: false,
      }
      users.value.push(newUser)
      // Sort by nickname after adding
      users.value.sort((a, b) => a.nickname.localeCompare(b.nickname))

      // Store invite URL
      inviteUrl.value = response.data.inviteUrl
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

  function clearError() {
    error.value = null
  }

  function clearInviteUrl() {
    inviteUrl.value = null
  }

  return {
    users,
    loading,
    error,
    inviteUrl,
    fetchUsers,
    toggleAdmin,
    createInvite,
    clearError,
    clearInviteUrl,
  }
})
