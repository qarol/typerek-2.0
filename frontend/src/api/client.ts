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

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
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

  return response.json()
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>('GET', path)
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('POST', path, body)
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>('PUT', path, body)
  },

  delete<T>(path: string): Promise<T> {
    return request<T>('DELETE', path)
  },
}

export { ApiClientError }
