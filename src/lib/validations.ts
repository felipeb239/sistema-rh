import { z } from 'zod'

// Validação de funcionário
export const employeeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  cpf: z.string().optional().refine((cpf) => {
    if (!cpf) return true
    const cleanCpf = cpf.replace(/\D/g, '')
    return cleanCpf.length === 11
  }, 'CPF deve ter 11 dígitos'),
  position: z.string().optional(),
  department: z.string().optional(),
  hireDate: z.string().optional(),
  salary: z.number().min(0, 'Salário deve ser positivo').optional(),
})

// Validação de holerite
export const payrollSchema = z.object({
  employeeId: z.string().min(1, 'Funcionário é obrigatório'),
  month: z.number().min(1).max(12, 'Mês deve ser entre 1 e 12'),
  year: z.number().min(2020).max(new Date().getFullYear() + 10, 'Ano inválido'),
  baseSalary: z.number().min(0, 'Salário base deve ser positivo'),
  overtimeHours: z.number().min(0).optional(),
  overtimeRate: z.number().min(0).optional(),
  bonuses: z.number().min(0).optional(),
  foodAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  otherBenefits: z.number().min(0).optional(),
  inssDiscount: z.number().min(0).optional(),
  irrfDiscount: z.number().min(0).optional(),
  healthInsurance: z.number().min(0).optional(),
  otherDiscounts: z.number().min(0).optional(),
})

// Validação de usuário
export const userSchema = z.object({
  username: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido').optional(),
  role: z.enum(['admin', 'user']).default('user'),
})

// Validação de configurações da empresa
export const companySettingsSchema = z.object({
  companyName: z.string().min(1, 'Nome da empresa é obrigatório'),
  cnpj: z.string().optional().refine((cnpj) => {
    if (!cnpj) return true
    const cleanCnpj = cnpj.replace(/\D/g, '')
    return cleanCnpj.length === 14
  }, 'CNPJ deve ter 14 dígitos'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  website: z.string().url('URL inválida').optional(),
})

export type EmployeeFormData = z.infer<typeof employeeSchema>
export type PayrollFormData = z.infer<typeof payrollSchema>
export type UserFormData = z.infer<typeof userSchema>
export type CompanySettingsFormData = z.infer<typeof companySettingsSchema>
