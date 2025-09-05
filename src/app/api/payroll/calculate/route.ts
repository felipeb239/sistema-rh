import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { calculatePayroll, validatePayroll, autoCalculateTaxes, type PayrollInput } from '@/lib/payroll-calculations'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      baseSalary,
      overtimeHours,
      overtimeRate,
      bonuses,
      foodAllowance,
      transportAllowance,
      otherBenefits,
      inssDiscount,
      irrfDiscount,
      healthInsurance,
      otherDiscounts,
      autoCalculate,
      dependents
    } = body

    // Preparar dados para cálculo
    const payrollInput: PayrollInput = {
      baseSalary: parseFloat(baseSalary || 0),
      overtimeHours: parseFloat(overtimeHours || 0),
      overtimeRate: parseFloat(overtimeRate || 0),
      bonuses: parseFloat(bonuses || 0),
      foodAllowance: parseFloat(foodAllowance || 0),
      transportAllowance: parseFloat(transportAllowance || 0),
      otherBenefits: parseFloat(otherBenefits || 0),
      inssDiscount: parseFloat(inssDiscount || 0),
      irrfDiscount: parseFloat(irrfDiscount || 0),
      healthInsurance: parseFloat(healthInsurance || 0),
      otherDiscounts: parseFloat(otherDiscounts || 0)
    }

    // Validar dados
    const validation = validatePayroll(payrollInput)
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        details: validation.errors 
      }, { status: 400 })
    }

    // Calcular salários
    const calculatedPayroll = calculatePayroll(
      payrollInput, 
      autoCalculate || false, 
      parseInt(dependents || 0)
    )

    // Se auto-cálculo está ativado, incluir informações de impostos
    let taxInfo = null
    if (autoCalculate) {
      taxInfo = autoCalculateTaxes(calculatedPayroll.grossSalary, parseInt(dependents || 0))
    }

    return NextResponse.json({
      ...calculatedPayroll,
      taxInfo,
      breakdown: {
        baseSalary: calculatedPayroll.baseSalary,
        overtime: {
          hours: calculatedPayroll.overtimeHours,
          rate: calculatedPayroll.overtimeRate,
          amount: calculatedPayroll.overtimePay
        },
        benefits: {
          bonuses: calculatedPayroll.bonuses,
          foodAllowance: calculatedPayroll.foodAllowance,
          transportAllowance: calculatedPayroll.transportAllowance,
          otherBenefits: calculatedPayroll.otherBenefits,
          total: calculatedPayroll.totalBenefits
        },
        discounts: {
          inss: calculatedPayroll.inssDiscount,
          irrf: calculatedPayroll.irrfDiscount,
          healthInsurance: calculatedPayroll.healthInsurance,
          otherDiscounts: calculatedPayroll.otherDiscounts,
          total: calculatedPayroll.totalDiscounts
        },
        totals: {
          gross: calculatedPayroll.grossSalary,
          net: calculatedPayroll.netSalary
        }
      }
    })

  } catch (error) {
    console.error('Payroll calculation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
