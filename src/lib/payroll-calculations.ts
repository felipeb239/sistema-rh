/**
 * Payroll Calculations Library
 * Complex calculations for payroll system
 */

export interface PayrollInput {
  baseSalary: number
  overtimeHours?: number
  overtimeRate?: number
  bonuses?: number
  foodAllowance?: number
  transportAllowance?: number
  otherBenefits?: number
  inssDiscount?: number
  irrfDiscount?: number
  healthInsurance?: number
  otherDiscounts?: number
}

export interface PayrollResult {
  baseSalary: number
  overtimeHours: number
  overtimeRate: number
  overtimePay: number
  bonuses: number
  foodAllowance: number
  transportAllowance: number
  otherBenefits: number
  totalBenefits: number
  grossSalary: number
  inssDiscount: number
  irrfDiscount: number
  healthInsurance: number
  otherDiscounts: number
  totalDiscounts: number
  netSalary: number
  fgtsAmount: number
}

export interface TaxCalculationResult {
  inssRate: number
  inssDiscount: number
  irrfRate: number
  irrfDiscount: number
  fgtsRate: number
  fgtsAmount: number
}

/**
 * Calculate FGTS (Fundo de Garantia do Tempo de Serviço) - 8% sobre o salário bruto
 */
export function calculateFGTS(grossSalary: number): { rate: number; amount: number } {
  return {
    rate: 0.08,
    amount: grossSalary * 0.08
  }
}

/**
 * Calculate INSS discount based on current 2024 rates
 */
export function calculateINSS(grossSalary: number): { rate: number; discount: number } {
  const inssRates = [
    { min: 0, max: 1518.00, rate: 0.075 },      // 7.5%
    { min: 1518.01, max: 2793.88, rate: 0.09 }, // 9%
    { min: 2793.89, max: 4190.83, rate: 0.12 }, // 12%
    { min: 4190.84, max: 8157.41, rate: 0.14 }  // 14%
  ]

  let totalDiscount = 0
  let appliedRate = 0

  for (const bracket of inssRates) {
    if (grossSalary > bracket.min) {
      const taxableAmount = Math.min(grossSalary, bracket.max) - bracket.min
      if (taxableAmount > 0) {
        totalDiscount += taxableAmount * bracket.rate
        appliedRate = bracket.rate
      }
    }
  }

  // Maximum INSS discount cap
  const maxINSS = 951.63 // 2024 limit: R$ 951,63
  totalDiscount = Math.min(totalDiscount, maxINSS)

  return {
    rate: appliedRate,
    discount: Math.round(totalDiscount * 100) / 100
  }
}

/**
 * Calculate IRRF discount based on current 2024 rates
 */
export function calculateIRRF(grossSalary: number, inssDiscount: number, dependents: number = 0): { rate: number; discount: number } {
  const dependentDeduction = 189.59 * dependents
  const taxableBase = grossSalary - inssDiscount - dependentDeduction

  const irrfRates = [
    { min: 0, max: 2112.00, rate: 0, deduction: 0 },
    { min: 2112.01, max: 2826.65, rate: 0.075, deduction: 158.40 },
    { min: 2826.66, max: 3751.05, rate: 0.15, deduction: 370.40 },
    { min: 3751.06, max: 4664.68, rate: 0.225, deduction: 651.73 },
    { min: 4664.69, max: Infinity, rate: 0.275, deduction: 884.96 }
  ]

  for (const bracket of irrfRates) {
    if (taxableBase >= bracket.min && taxableBase <= bracket.max) {
      const discount = Math.max(0, (taxableBase * bracket.rate) - bracket.deduction)
      return {
        rate: bracket.rate,
        discount: Math.round(discount * 100) / 100
      }
    }
  }

  return { rate: 0, discount: 0 }
}


/**
 * Auto-calculate INSS and IRRF based on gross salary
 */
export function autoCalculateTaxes(grossSalary: number, dependents: number = 0): TaxCalculationResult {
  const inss = calculateINSS(grossSalary)
  const irrf = calculateIRRF(grossSalary, inss.discount, dependents)
  const fgts = calculateFGTS(grossSalary)

  return {
    inssRate: inss.rate,
    inssDiscount: inss.discount,
    irrfRate: irrf.rate,
    irrfDiscount: irrf.discount,
    fgtsRate: fgts.rate,
    fgtsAmount: fgts.amount
  }
}

/**
 * Calculate complete payroll with all benefits and discounts
 */
export function calculatePayroll(input: PayrollInput, shouldAutoCalculateTaxes: boolean = false, dependents: number = 0): PayrollResult {
  // Normalize inputs
  const baseSalary = Number(input.baseSalary) || 0
  const overtimeHours = Number(input.overtimeHours) || 0
  const overtimeRate = Number(input.overtimeRate) || 0
  const bonuses = Number(input.bonuses) || 0
  const foodAllowance = Number(input.foodAllowance) || 0
  const transportAllowance = Number(input.transportAllowance) || 0
  const otherBenefits = Number(input.otherBenefits) || 0

  // Calculate overtime pay
  const overtimePay = overtimeHours * overtimeRate

  // Calculate total benefits
  const totalBenefits = bonuses + foodAllowance + transportAllowance + otherBenefits

  // Calculate gross salary
  const grossSalary = baseSalary + overtimePay + totalBenefits

  // Calculate discounts
  let inssDiscount = Number(input.inssDiscount) || 0
  let irrfDiscount = Number(input.irrfDiscount) || 0

  if (shouldAutoCalculateTaxes) {
    const taxes = autoCalculateTaxes(grossSalary, dependents)
    inssDiscount = taxes?.inssDiscount || 0
    irrfDiscount = taxes?.irrfDiscount || 0
  }

  const healthInsurance = Number(input.healthInsurance) || 0
  const otherDiscounts = Number(input.otherDiscounts) || 0

  // Calculate FGTS (always calculated automatically - 8% of gross salary)
  const fgts = calculateFGTS(grossSalary)
  const fgtsAmount = fgts.amount

  // Calculate total discounts
  const totalDiscounts = inssDiscount + irrfDiscount + healthInsurance + otherDiscounts

  // Calculate net salary
  const netSalary = grossSalary - totalDiscounts

  return {
    baseSalary: Math.round(baseSalary * 100) / 100,
    overtimeHours: Math.round(overtimeHours * 100) / 100,
    overtimeRate: Math.round(overtimeRate * 100) / 100,
    overtimePay: Math.round(overtimePay * 100) / 100,
    bonuses: Math.round(bonuses * 100) / 100,
    foodAllowance: Math.round(foodAllowance * 100) / 100,
    transportAllowance: Math.round(transportAllowance * 100) / 100,
    otherBenefits: Math.round(otherBenefits * 100) / 100,
    totalBenefits: Math.round(totalBenefits * 100) / 100,
    grossSalary: Math.round(grossSalary * 100) / 100,
    inssDiscount: Math.round(inssDiscount * 100) / 100,
    irrfDiscount: Math.round(irrfDiscount * 100) / 100,
    healthInsurance: Math.round(healthInsurance * 100) / 100,
    otherDiscounts: Math.round(otherDiscounts * 100) / 100,
    totalDiscounts: Math.round(totalDiscounts * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    fgtsAmount: Math.round(fgtsAmount * 100) / 100
  }
}

/**
 * Validate payroll data
 */
export function validatePayroll(input: PayrollInput): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!input.baseSalary || input.baseSalary <= 0) {
    errors.push('Salário base deve ser maior que zero')
  }

  if (input.overtimeHours && input.overtimeHours < 0) {
    errors.push('Horas extras não podem ser negativas')
  }

  if (input.overtimeRate && input.overtimeRate < 0) {
    errors.push('Taxa de hora extra não pode ser negativa')
  }

  if (input.bonuses && input.bonuses < 0) {
    errors.push('Bonificações não podem ser negativas')
  }

  if (input.foodAllowance && input.foodAllowance < 0) {
    errors.push('Vale alimentação não pode ser negativo')
  }

  if (input.transportAllowance && input.transportAllowance < 0) {
    errors.push('Vale transporte não pode ser negativo')
  }

  if (input.otherBenefits && input.otherBenefits < 0) {
    errors.push('Outros benefícios não podem ser negativos')
  }

  if (input.inssDiscount && input.inssDiscount < 0) {
    errors.push('Desconto INSS não pode ser negativo')
  }

  if (input.irrfDiscount && input.irrfDiscount < 0) {
    errors.push('Desconto IRRF não pode ser negativo')
  }

  if (input.healthInsurance && input.healthInsurance < 0) {
    errors.push('Plano de saúde não pode ser negativo')
  }

  if (input.otherDiscounts && input.otherDiscounts < 0) {
    errors.push('Outros descontos não podem ser negativos')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1] || 'Mês'
}

/**
 * Get last day of month
 */
export function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

/**
 * Format payroll period
 */
export function formatPayrollPeriod(month: number, year: number): string {
  return `${getMonthName(month)} de ${year}`
}
