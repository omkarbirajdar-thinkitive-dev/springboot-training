export type Department = {
  id: number
  name: string
  location: string
  employeeCount: number
}

export type EmployeeProfile = {
  id?: number
  phone?: string | null
  address?: string | null
  dateOfBirth?: string | null
}

export type Employee = {
  id: number
  firstName: string
  lastName: string
  email: string
  salary: number
  department?: Department | null
  profile?: EmployeeProfile | null
  username?: string
  temporaryPassword?: string
}

export type EmployeePage = {
  content: Employee[]
  totalElements: number
  totalPages: number
  number: number
  size: number
  first: boolean
  last: boolean
}

export type ApiError = {
  message?: string
  error?: string
  fieldErrors?: Record<string, string>
}