import type { ApiError } from './api/contracts'

export function apiMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: ApiError } }).response
    const body = response?.data
    if (body?.fieldErrors) return Object.values(body.fieldErrors).join(' ')
    if (body?.message) return body.message
    if (body?.error) return body.error
  }
  return error instanceof Error ? error.message : 'The request could not be completed.'
}