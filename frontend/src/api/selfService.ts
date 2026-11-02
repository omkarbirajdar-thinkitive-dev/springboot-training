import { customInstance } from './http'
import type { Employee, EmployeeProfile } from './contracts'

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}

export const selfServiceApi = {
  getMyProfile: () =>
    customInstance<Employee>({
      url: '/api/employees/me',
      method: 'GET',
    }),

  updateMyProfile: (payload: EmployeeProfile) =>
    customInstance<Employee>({
      url: '/api/employees/me',
      method: 'PUT',
      data: payload,
    }),

  changePassword: (payload: ChangePasswordPayload) =>
    customInstance<{ message: string }>({
      url: '/api/auth/change-password',
      method: 'POST',
      data: payload,
    }),
}
