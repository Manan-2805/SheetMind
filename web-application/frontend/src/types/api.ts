export interface ErrorDetail {
  code: string
  details: string | null
}

export interface Meta {
  timestamp: string
  request_id: string
  version: string
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  message: string
  error: ErrorDetail | null
  meta: Meta
}
