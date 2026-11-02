import { customInstance } from './http'

export type DashboardStats = {
  totalEmployees: number
  totalDepartments: number
  pendingLeaves: number
  presentToday: number
  monthlyPayrollDisbursed: number
  departmentHeadcount: Array<{ department: string; count: number }>
  attendanceTrend: Array<{ date: string; present: number }>
}

export const reportsApi = {
  getStats: () =>
    customInstance<DashboardStats>({
      url: '/api/dashboard/stats',
      method: 'GET',
    }),

  downloadAttendanceReport: async (month?: number, year?: number) => {
    const token = localStorage.getItem('workforce.token')
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())

    const response = await fetch(`/api/reports/attendance?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `attendance-report-${year || 2026}-${month || 1}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  downloadPayrollReport: async (month?: number, year?: number) => {
    const token = localStorage.getItem('workforce.token')
    const params = new URLSearchParams()
    if (month) params.append('month', month.toString())
    if (year) params.append('year', year.toString())

    const response = await fetch(`/api/reports/payroll?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `payroll-report-${year || 2026}-${month || 1}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },

  downloadLeaveReport: async (year?: number) => {
    const token = localStorage.getItem('workforce.token')
    const params = new URLSearchParams()
    if (year) params.append('year', year.toString())

    const response = await fetch(`/api/reports/leaves?${params.toString()}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leaves-report-${year || 2026}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },
}
