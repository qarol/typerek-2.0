export interface ApiResponse<T> {
  data: T
}

export interface ApiCollectionResponse<T> {
  data: T[]
  meta: { count: number }
}

export interface ApiError {
  error: {
    code: string
    message: string
    field: string | null
  }
}

export interface User {
  id: number
  nickname: string
  admin: boolean
}
