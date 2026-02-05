import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '../auth'
import { api } from '@/api/client'

// Mock the api module
vi.mock('@/api/client', () => ({
  api: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  },
  ApiClientError: class ApiClientError extends Error {
    code: string
    field: string | null
    constructor(error: { code: string; message: string; field: string | null }) {
      super(error.message)
      this.name = 'ApiClientError'
      this.code = error.code
      this.field = error.field
    }
  },
}))

describe('useAuthStore - activate', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('successful activation sets user state and clears error', async () => {
    const mockUser = {
      id: 1,
      nickname: 'testuser',
      admin: false,
    }

    vi.mocked(api.post).mockResolvedValue({
      data: mockUser,
    })

    const store = useAuthStore()

    await store.activate('valid-token', 'password123', 'password123')

    expect(store.user).toEqual(mockUser)
    expect(store.error).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.isAuthenticated).toBe(true)

    expect(api.post).toHaveBeenCalledWith('/users/activate', {
      token: 'valid-token',
      password: 'password123',
      passwordConfirmation: 'password123',
    })
  })

  it('error from server sets error code', async () => {
    const { ApiClientError } = await import('@/api/client')

    vi.mocked(api.post).mockRejectedValue(
      new ApiClientError({
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired invite link',
        field: 'token',
      }),
    )

    const store = useAuthStore()

    await expect(store.activate('invalid-token', 'password123', 'password123')).rejects.toThrow()

    expect(store.user).toBeNull()
    expect(store.error).toBe('INVALID_TOKEN')
    expect(store.loading).toBe(false)
    expect(store.isAuthenticated).toBe(false)
  })

  it('activation clears previous errors', async () => {
    const mockUser = {
      id: 1,
      nickname: 'testuser',
      admin: false,
    }

    vi.mocked(api.post).mockResolvedValue({
      data: mockUser,
    })

    const store = useAuthStore()

    // Set a previous error
    store.error = 'PREVIOUS_ERROR'

    await store.activate('valid-token', 'password123', 'password123')

    expect(store.error).toBeNull()
    expect(store.user).toEqual(mockUser)
  })

  it('handles network errors with UNKNOWN_ERROR', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Network error'))

    const store = useAuthStore()

    await expect(store.activate('valid-token', 'password123', 'password123')).rejects.toThrow()

    expect(store.error).toBe('UNKNOWN_ERROR')
    expect(store.user).toBeNull()
    expect(store.loading).toBe(false)
  })
})
