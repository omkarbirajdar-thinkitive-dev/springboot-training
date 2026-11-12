import { customInstance } from './http'

export type PayslipStatus = 'DRAFT' | 'PUBLISHED'

export type PayslipRecord = {
  id: number
  employeeId: number
  employeeName: string
  employeeEmail: string
  departmentName: string
  month: number
  year: number
  basicSalary: number
  totalAllowances: number
  grossSalary: number
  taxDeduction: number
  otherDeductions: number
  netSalary: number
  status: PayslipStatus
  generatedBy: string | null
  generatedAt: string
}

export type PayslipPage = {
  content: PayslipRecord[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export type GeneratePayslipsPayload = {
  employeeId?: number
  month: number
  year: number
  publishImmediately?: boolean
}

export const payrollApi = {
  generate: (payload: GeneratePayslipsPayload) =>
    customInstance<PayslipRecord[]>({
      url: '/api/payslips/generate',
      method: 'POST',
      data: payload,
    }),

  getAll: (params?: {
    employeeId?: number
    month?: number
    year?: number
    status?: PayslipStatus
    page?: number
    size?: number
  }) =>
    customInstance<PayslipPage>({
      url: '/api/payslips',
      method: 'GET',
      params,
    }),

  getMyPayslips: () =>
    customInstance<PayslipRecord[]>({
      url: '/api/payslips/me',
      method: 'GET',
    }),

  downloadPdf: (id: number) =>
    customInstance<Blob>({
      url: `/api/payslips/${id}/download`,
      method: 'GET',
      responseType: 'blob',
    }),

  getEmployeePayslips: (employeeId: number) =>
    customInstance<PayslipRecord[]>({
      url: `/api/payslips/employee/${employeeId}`,
      method: 'GET',
    }),

  publish: (id: number) =>
    customInstance<PayslipRecord>({
      url: `/api/payslips/${id}/publish`,
      method: 'PUT',
    }),
}
