import { customInstance } from './http'
import type { JwtResponse } from './generated'

export interface RegisterPayload {
  username: string
  password: string
  email: string
  firstName: string
  lastName: string
  role?: string
  departmentId?: number
}

export function registerUser(payload: RegisterPayload): Promise<JwtResponse> {
  return customInstance<JwtResponse>({
    url: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ForgotPasswordResponse {
  message: string
  email: string
  verificationCode?: string
}

export interface ResetPasswordPayload {
  email: string
  code: string
  newPassword: string
}

export function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return customInstance<ForgotPasswordResponse>({
    url: '/api/auth/forgot-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}

export function resetPassword(payload: ResetPasswordPayload): Promise<{ message: string }> {
  return customInstance<{ message: string }>({
    url: '/api/auth/reset-password',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}

export interface CreateAdminPayload {
  username: string
  email: string
  firstName: string
  lastName: string
  temporaryPassword?: string
  departmentId?: number
}

export interface CreateAdminResponse {
  message: string
  username: string
  email: string
  temporaryPassword: string
  role: string
  employeeId: number
}

export function createAdminAccount(payload: CreateAdminPayload): Promise<CreateAdminResponse> {
  return customInstance<CreateAdminResponse>({
    url: '/api/auth/create-admin',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: payload,
  })
}
