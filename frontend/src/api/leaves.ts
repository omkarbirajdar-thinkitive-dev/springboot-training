import { customInstance } from './http'

export type LeaveType = 'SICK' | 'CASUAL' | 'EARNED' | 'UNPAID'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export type LeaveRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  departmentName: string
  leaveType: LeaveType
  fromDate: string
  toDate: string
  totalDays: number
  reason: string
  status: LeaveStatus
  reviewedBy: string | null
  reviewedAt: string | null
  adminComment: string | null
  createdAt: string
}

export type LeavePage = {
  content: LeaveRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export type CreateLeavePayload = {
  leaveType: LeaveType
  fromDate: string
  toDate: string
  reason: string
}

export type ReviewLeavePayload = {
  adminComment?: string
}

export const leavesApi = {
  apply: (payload: CreateLeavePayload) =>
    customInstance<LeaveRecord>({
      url: '/api/leaves',
      method: 'POST',
      data: payload,
    }),

  getMyLeaves: () =>
    customInstance<LeaveRecord[]>({
      url: '/api/leaves/me',
      method: 'GET',
    }),

  getAll: (params?: {
    employeeId?: number
    status?: LeaveStatus
    page?: number
    size?: number
  }) =>
    customInstance<LeavePage>({
      url: '/api/leaves',
      method: 'GET',
      params,
    }),

  getPendingCount: () =>
    customInstance<{ pendingCount: number }>({
      url: '/api/leaves/pending-count',
      method: 'GET',
    }),

  approve: (id: number, payload?: ReviewLeavePayload) =>
    customInstance<LeaveRecord>({
      url: `/api/leaves/${id}/approve`,
      method: 'PUT',
      data: payload,
    }),

  reject: (id: number, payload?: ReviewLeavePayload) =>
    customInstance<LeaveRecord>({
      url: `/api/leaves/${id}/reject`,
      method: 'PUT',
      data: payload,
    }),

  cancel: (id: number) =>
    customInstance<void>({
      url: `/api/leaves/${id}`,
      method: 'DELETE',
    }),
}
