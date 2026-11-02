import { customInstance } from './http'

export type AllowanceType = 'HRA' | 'TRANSPORT' | 'MEDICAL' | 'SPECIAL' | 'PERFORMANCE_BONUS'

export type AllowanceRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  departmentName: string
  type: AllowanceType
  amount: number
  effectiveFrom: string
  effectiveTo: string | null
  description: string | null
  createdAt: string
}

export type AllowancePage = {
  content: AllowanceRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export type CreateAllowancePayload = {
  employeeId: number
  type: AllowanceType
  amount: number
  effectiveFrom: string
  effectiveTo?: string
  description?: string
}

export type UpdateAllowancePayload = {
  type: AllowanceType
  amount: number
  effectiveFrom: string
  effectiveTo?: string
  description?: string
}

export const allowancesApi = {
  create: (payload: CreateAllowancePayload) =>
    customInstance<AllowanceRecord>({
      url: '/api/allowances',
      method: 'POST',
      data: payload,
    }),

  update: (id: number, payload: UpdateAllowancePayload) =>
    customInstance<AllowanceRecord>({
      url: `/api/allowances/${id}`,
      method: 'PUT',
      data: payload,
    }),

  delete: (id: number) =>
    customInstance<void>({
      url: `/api/allowances/${id}`,
      method: 'DELETE',
    }),

  getMyAllowances: () =>
    customInstance<AllowanceRecord[]>({
      url: '/api/allowances/me',
      method: 'GET',
    }),

  getEmployeeAllowances: (employeeId: number) =>
    customInstance<AllowanceRecord[]>({
      url: `/api/allowances/employee/${employeeId}`,
      method: 'GET',
    }),

  getAll: (params?: { employeeId?: number; page?: number; size?: number }) =>
    customInstance<AllowancePage>({
      url: '/api/allowances',
      method: 'GET',
      params,
    }),
}
