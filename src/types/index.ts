export interface User {
  id: string
  username: string
  name?: string
  email?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Employee {
  id: string
  name: string
  cpf?: string
  position?: string
  department?: string
  hireDate?: Date
  salary?: number
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

export interface Payroll {
  id: string
  employeeId: string
  employee?: Employee
  month: number
  year: number
  baseSalary: number
  inssDiscount: number
  irrfDiscount: number
  healthInsurance: number
  dentalInsurance: number
  customDiscount: number
  customDiscountDescription?: string
  otherDiscounts: number
  grossSalary: number
  netSalary: number
  fgtsAmount: number
  createdAt: Date
  updatedAt: Date
}

export interface CompanySettings {
  id: string
  companyName: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
  updatedAt: Date
}

export interface ReceiptType {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Receipt {
  id: string
  employeeId: string
  employee?: Employee
  typeId: string
  type?: ReceiptType
  month: number
  year: number
  dailyValue: number
  days: number
  value: number
  createdAt: Date
  updatedAt: Date
}

export interface Alert {
  id: string
  type: string
  message: string
  createdAt: Date
}

export interface Position {
  id: string
  name: string
}

export interface PayrollRubric {
  id: string
  name: string
  description?: string
  type: 'discount' | 'benefit'
  code?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  employeeRubrics?: EmployeeRubric[]
}

export interface EmployeeRubric {
  id: string
  employeeId: string
  employee?: Employee
  rubricId: string
  rubric?: PayrollRubric
  customName?: string
  customValue?: number
  customPercentage?: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeWithRubrics extends Employee {
  employeeRubrics: (EmployeeRubric & { rubric: PayrollRubric })[]
}

export interface DashboardData {
  monthlyExpenses: Array<{
    month: number
    totalExpenses: number
  }>
  totalEmployees: number
  totalPayrolls: number
  totalReceipts: number
}

export interface ApiResponse<T = any> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}
