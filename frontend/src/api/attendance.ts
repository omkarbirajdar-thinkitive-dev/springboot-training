import { customInstance } from './http'

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'HOLIDAY' | 'ON_LEAVE'

export type AttendanceRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  departmentName: string
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  status: AttendanceStatus
  notes: string | null
}

export type AttendancePage = {
  content: AttendanceRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export type CheckInPayload = {
  notes?: string
}

export type CheckOutPayload = {
  notes?: string
}

export type UpdateAttendancePayload = {
  date?: string
  checkInTime?: string
  checkOutTime?: string
  status: AttendanceStatus
  notes?: string
}

export const attendanceApi = {
  checkIn: (payload?: CheckInPayload) =>
    customInstance<AttendanceRecord>({
      url: '/api/attendance/checkin',
      method: 'POST',
      data: payload,
    }),

  checkOut: (payload?: CheckOutPayload) =>
    customInstance<AttendanceRecord>({
      url: '/api/attendance/checkout',
      method: 'POST',
      data: payload,
    }),

  getToday: () =>
    customInstance<AttendanceRecord | null>({
      url: '/api/attendance/today',
      method: 'GET',
    }),

  getMyHistory: (startDate?: string, endDate?: string) =>
    customInstance<AttendanceRecord[]>({
      url: '/api/attendance/me',
      method: 'GET',
      params: { startDate, endDate },
    }),

  getAll: (params?: {
    employeeId?: number
    startDate?: string
    endDate?: string
    page?: number
    size?: number
  }) =>
    customInstance<AttendancePage>({
      url: '/api/attendance',
      method: 'GET',
      params,
    }),

  getEmployeeHistory: (employeeId: number) =>
    customInstance<AttendanceRecord[]>({
      url: `/api/attendance/employee/${employeeId}`,
      method: 'GET',
    }),

  update: (id: number, payload: UpdateAttendancePayload) =>
    customInstance<AttendanceRecord>({
      url: `/api/attendance/${id}`,
      method: 'PUT',
      data: payload,
    }),
}
