import type { ApiError } from './types'

const BASE_URL = '/api/v1'

class ApiClientError extends Error {
  code: string
  field: string | null

  constructor(error: ApiError['error']) {
    super(error.message)
    this.name = 'ApiClientError'
    this.code = error.code
    this.field = error.field
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T | undefined> {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
  }

  if (body !== undefined) {
    options.body = JSON.stringify(body)
  }

  const response = await fetch(`${BASE_URL}${path}`, options)

  if (!response.ok) {
    let errorData: ApiError
    try {
      errorData = await response.json()
    } catch {
      throw new ApiClientError({
        code: 'unknown',
        message: `Request failed with status ${response.status}`,
        field: null,
      })
    }
    throw new ApiClientError(errorData.error)
  }

  // No body for 204/205 or when Content-Type is not JSON
  const contentType = response.headers.get('Content-Type')
  if (response.status === 204 || response.status === 205 || !contentType?.includes('application/json')) {
    return undefined
  }

  return await response.json()
}

export const api = {
  get<T>(path: string): Promise<T | undefined> {
    return request<T>('GET', path)
  },

  post<T>(path: string, body?: unknown): Promise<T | undefined> {
    return request<T>('POST', path, body)
  },

  put<T>(path: string, body?: unknown): Promise<T | undefined> {
    return request<T>('PUT', path, body)
  },

  delete<T>(path: string): Promise<T | undefined> {
    return request<T>('DELETE', path)
  },
}

export { ApiClientError }
