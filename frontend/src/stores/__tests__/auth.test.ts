import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'

const mockApi = {
  post: vi.fn(),
  get: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/api/client', () => ({
  api: {
    post: (...args: unknown[]) => mockApi.post(...args),
    get: (...args: unknown[]) => mockApi.get(...args),
    delete: (...args: unknown[]) => mockApi.delete(...args),
  },
  ApiClientError: class ApiClientError extends Error {
    error: { code: string; message: string; field: string | null }
    constructor(error: { code: string; message: string; field: string | null }) {
      super(error.message)
      this.name = 'ApiClientError'
      this.error = error
    }
  },
}))

describe('useAuthStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('starts with no user', () => {
      const store = useAuthStore()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.isAdmin).toBe(false)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('login', () => {
    it('sets user on successful login', async () => {
      const userData = { id: 1, nickname: 'tomek', admin: false }
      mockApi.post.mockResolvedValue({ data: userData })

      const store = useAuthStore()
      await store.login('tomek', 'secret123')

      expect(store.user).toEqual(userData)
      expect(store.isAuthenticated).toBe(true)
      expect(store.isAdmin).toBe(false)
      expect(store.error).toBeNull()
      expect(mockApi.post).toHaveBeenCalledWith('/sessions', {
        nickname: 'tomek',
        password: 'secret123',
      })
    })

    it('sets admin flag for admin user', async () => {
      const userData = { id: 1, nickname: 'admin', admin: true }
      mockApi.post.mockResolvedValue({ data: userData })

      const store = useAuthStore()
      await store.login('admin', 'password')

      expect(store.isAdmin).toBe(true)
    })

    it('sets error on failed login', async () => {
      const { ApiClientError } = await import('@/api/client')
      mockApi.post.mockRejectedValue(
        new ApiClientError({
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect nickname or password',
          field: null,
        }),
      )

      const store = useAuthStore()
      await expect(store.login('tomek', 'wrong')).rejects.toThrow()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(store.error).toBe('INVALID_CREDENTIALS')
    })

    it('manages loading state during login', async () => {
      let resolveLogin: (value: unknown) => void
      mockApi.post.mockReturnValue(
        new Promise((resolve) => {
          resolveLogin = resolve
        }),
      )

      const store = useAuthStore()
      const loginPromise = store.login('tomek', 'secret123')

      expect(store.loading).toBe(true)

      resolveLogin!({ data: { id: 1, nickname: 'tomek', admin: false } })
      await loginPromise

      expect(store.loading).toBe(false)
    })
  })

  describe('logout', () => {
    it('clears user state on logout', async () => {
      mockApi.post.mockResolvedValue({ data: { id: 1, nickname: 'tomek', admin: false } })
      mockApi.delete.mockResolvedValue({})

      const store = useAuthStore()
      await store.login('tomek', 'secret123')
      expect(store.isAuthenticated).toBe(true)

      await store.logout()
      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
      expect(mockApi.delete).toHaveBeenCalledWith('/sessions')
    })
  })

  describe('checkSession', () => {
    it('restores user from session', async () => {
      const userData = { id: 1, nickname: 'tomek', admin: false }
      mockApi.get.mockResolvedValue({ data: userData })

      const store = useAuthStore()
      await store.checkSession()

      expect(store.user).toEqual(userData)
      expect(store.isAuthenticated).toBe(true)
      expect(mockApi.get).toHaveBeenCalledWith('/me')
    })

    it('clears user when session is invalid', async () => {
      mockApi.get.mockRejectedValue(new Error('Unauthorized'))

      const store = useAuthStore()
      await store.checkSession()

      expect(store.user).toBeNull()
      expect(store.isAuthenticated).toBe(false)
    })
  })

  describe('clearError', () => {
    it('clears the error state', async () => {
      const { ApiClientError } = await import('@/api/client')
      mockApi.post.mockRejectedValue(
        new ApiClientError({
          code: 'INVALID_CREDENTIALS',
          message: 'Incorrect nickname or password',
          field: null,
        }),
      )

      const store = useAuthStore()
      await expect(store.login('tomek', 'wrong')).rejects.toThrow()
      expect(store.error).not.toBeNull()

      store.clearError()
      expect(store.error).toBeNull()
    })
  })
})
