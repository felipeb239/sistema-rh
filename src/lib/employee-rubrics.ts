import { EmployeeRubric } from '@/types'

export interface RubricCalculation {
  name: string
  value: number
  type: 'fixed' | 'percentage'
  isBenefit: boolean
}

export function calculateEmployeeRubrics(
  employeeRubrics: EmployeeRubric[],
  baseSalary: number,
  month?: number,
  year?: number
): RubricCalculation[] {
  const now = new Date()
  const currentMonth = month || now.getMonth() + 1
  const currentYear = year || now.getFullYear()

  return employeeRubrics
    .filter(employeeRubric => {
      if (!employeeRubric.isActive) return false
      
      // Verificar se está dentro do período de vigência
      if (employeeRubric.startDate) {
        const startDate = new Date(employeeRubric.startDate)
        if (startDate.getMonth() + 1 > currentMonth || startDate.getFullYear() > currentYear) {
          return false
        }
      }
      
      if (employeeRubric.endDate) {
        const endDate = new Date(employeeRubric.endDate)
        if (endDate.getMonth() + 1 < currentMonth || endDate.getFullYear() < currentYear) {
          return false
        }
      }
      
      return true
    })
    .map(employeeRubric => {
      let value = 0
      let type: 'fixed' | 'percentage' = 'fixed'
      
      if (employeeRubric.customValue) {
        value = Number(employeeRubric.customValue) || 0
        type = 'fixed'
      } else if (employeeRubric.customPercentage) {
        value = baseSalary * (Number(employeeRubric.customPercentage) || 0)
        type = 'percentage'
      }

      return {
        name: employeeRubric.customName || employeeRubric.rubric?.name || 'Rubrica',
        value,
        type,
        isBenefit: employeeRubric.rubric?.type === 'benefit'
      }
    })
}

export function getRubricTotals(rubrics: RubricCalculation[]) {
  const benefits = rubrics.filter(r => r.isBenefit)
  const discounts = rubrics.filter(r => !r.isBenefit)
  
  return {
    totalBenefits: benefits.reduce((sum, r) => sum + r.value, 0),
    totalDiscounts: discounts.reduce((sum, r) => sum + r.value, 0),
    benefits,
    discounts
  }
}
