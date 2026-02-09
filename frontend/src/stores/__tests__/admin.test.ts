import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAdminStore } from '../admin'
import { api } from '@/api/client'
import type { ApiCollectionResponse, ApiResponse, AdminUser, InviteResponse } from '@/api/types'

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

describe('useAdminStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('fetchUsers', () => {
    it('should fetch users successfully', async () => {
      const mockUsers: AdminUser[] = [
        { id: 1, nickname: 'admin', admin: true, activated: true },
        { id: 2, nickname: 'player', admin: false, activated: true },
        { id: 3, nickname: 'pending', admin: false, activated: false },
      ]

      const mockResponse: ApiCollectionResponse<AdminUser> = {
        data: mockUsers,
        meta: { count: 3 },
      }

      vi.mocked(api.get).mockResolvedValue(mockResponse)

      const store = useAdminStore()
      await store.fetchUsers()

      expect(api.get).toHaveBeenCalledWith('/admin/users')
      expect(store.users).toEqual(mockUsers)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle API errors', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.get).mockRejectedValue(
        new ApiClientError({ code: 'FORBIDDEN', message: 'Admin access required', field: null })
      )

      const store = useAdminStore()

      try {
        await store.fetchUsers()
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('FORBIDDEN')
      expect(store.loading).toBe(false)
    })
  })

  describe('toggleAdmin', () => {
    it('should toggle admin role successfully', async () => {
      const mockUser: AdminUser = {
        id: 2,
        nickname: 'player',
        admin: true,
        activated: true,
      }

      const mockResponse: ApiResponse<AdminUser> = {
        data: mockUser,
      }

      vi.mocked(api.put).mockResolvedValue(mockResponse)

      const store = useAdminStore()
      store.users = [
        { id: 1, nickname: 'admin', admin: true, activated: true },
        { id: 2, nickname: 'player', admin: false, activated: true },
      ]

      await store.toggleAdmin(2, true)

      expect(api.put).toHaveBeenCalledWith('/admin/users/2', { admin: true })
      const updatedUser = store.users.find((u) => u.id === 2)
      expect(updatedUser?.admin).toBe(true)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should handle API errors when toggling admin', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.put).mockRejectedValue(
        new ApiClientError({
          code: 'SELF_ROLE_CHANGE',
          message: 'Cannot remove your own admin role',
          field: 'admin',
        })
      )

      const store = useAdminStore()
      store.users = [{ id: 1, nickname: 'admin', admin: true, activated: true }]

      try {
        await store.toggleAdmin(1, false)
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('SELF_ROLE_CHANGE')
      expect(store.loading).toBe(false)
    })
  })

  describe('createInvite', () => {
    it('should create invite successfully', async () => {
      const mockInvite: InviteResponse = {
        id: 4,
        nickname: 'newuser',
        inviteUrl: 'http://localhost:5173/activate?token=abc123',
      }

      const mockResponse: ApiResponse<InviteResponse> = {
        data: mockInvite,
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const store = useAdminStore()
      store.users = [
        { id: 1, nickname: 'admin', admin: true, activated: true },
        { id: 2, nickname: 'player', admin: false, activated: true },
      ]

      await store.createInvite('newuser')

      expect(api.post).toHaveBeenCalledWith('/admin/invitations', { nickname: 'newuser' })
      expect(store.users).toHaveLength(3)
      expect(store.users.find((u) => u.nickname === 'newuser')).toEqual({
        id: 4,
        nickname: 'newuser',
        admin: false,
        activated: false,
      })
      expect(store.inviteUrl).toBe('http://localhost:5173/activate?token=abc123')
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('should sort users by nickname after adding new user', async () => {
      const mockInvite: InviteResponse = {
        id: 4,
        nickname: 'alice',
        inviteUrl: 'http://localhost:5173/activate?token=abc123',
      }

      const mockResponse: ApiResponse<InviteResponse> = {
        data: mockInvite,
      }

      vi.mocked(api.post).mockResolvedValue(mockResponse)

      const store = useAdminStore()
      store.users = [
        { id: 1, nickname: 'bob', admin: false, activated: true },
        { id: 2, nickname: 'charlie', admin: false, activated: true },
      ]

      await store.createInvite('alice')

      const nicknames = store.users.map((u) => u.nickname)
      expect(nicknames).toEqual(['alice', 'bob', 'charlie'])
    })

    it('should handle API errors when creating invite', async () => {
      const { ApiClientError } = await import('@/api/client')
      vi.mocked(api.post).mockRejectedValue(
        new ApiClientError({
          code: 'VALIDATION_ERROR',
          message: 'Nickname already taken',
          field: 'nickname',
        })
      )

      const store = useAdminStore()

      try {
        await store.createInvite('existinguser')
      } catch (error) {
        // Expected to throw
      }

      expect(store.error).toBe('VALIDATION_ERROR')
      expect(store.inviteUrl).toBeNull()
      expect(store.loading).toBe(false)
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      const store = useAdminStore()
      store.error = 'SOME_ERROR'

      store.clearError()

      expect(store.error).toBeNull()
    })
  })

  describe('clearInviteUrl', () => {
    it('should clear invite URL', () => {
      const store = useAdminStore()
      store.inviteUrl = 'http://example.com/invite'

      store.clearInviteUrl()

      expect(store.inviteUrl).toBeNull()
    })
  })
})
