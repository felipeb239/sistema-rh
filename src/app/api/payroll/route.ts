import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const employeeId = searchParams.get('employee_id')

    const where: any = {}
    if (month) where.month = parseInt(month)
    if (year) where.year = parseInt(year)
    if (employeeId) where.employeeId = employeeId

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        employee: true
      },
      orderBy: [
        { year: 'desc' },
        { month: 'desc' },
        { employee: { name: 'asc' } }
      ]
    })

    return NextResponse.json(payrolls)

  } catch (error) {
    console.error('Payroll GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      employeeId,
      month,
      year,
      baseSalary,
      inssDiscount,
      irrfDiscount,
      healthInsurance,
      dentalInsurance,
      customDiscount,
      customDiscountDescription,
      otherDiscounts,
      autoCalculateTaxes,
      dependents
    } = body

    // Calcular valores diretamente sem usar a biblioteca complexa
    const baseSalaryValue = parseFloat(baseSalary || 0)
    const inssDiscountValue = parseFloat(inssDiscount || 0)
    const irrfDiscountValue = parseFloat(irrfDiscount || 0)
    const healthInsuranceValue = parseFloat(healthInsurance || 0)
    const dentalInsuranceValue = parseFloat(dentalInsurance || 0)
    const customDiscountValue = parseFloat(customDiscount || 0)
    const otherDiscountsValue = parseFloat(otherDiscounts || 0)
    
    // Calcular FGTS (8% sobre o salário base)
    const fgtsAmount = baseSalaryValue * 0.08
    
    // Calcular salário bruto (salário base + benefícios)
    const grossSalary = baseSalaryValue
    
    // Calcular total de descontos
    const totalDiscounts = inssDiscountValue + irrfDiscountValue + healthInsuranceValue + dentalInsuranceValue + customDiscountValue + otherDiscountsValue
    
    // Calcular salário líquido
    const netSalary = grossSalary - totalDiscounts

    const payroll = await prisma.payroll.create({
      data: {
        employeeId,
        month: parseInt(month),
        year: parseInt(year),
        baseSalary: baseSalaryValue,
        inssDiscount: inssDiscountValue,
        irrfDiscount: irrfDiscountValue,
        healthInsurance: healthInsuranceValue,
        dentalInsurance: dentalInsuranceValue,
        customDiscount: customDiscountValue,
        customDiscountDescription: customDiscountDescription || null,
        otherDiscounts: otherDiscountsValue,
        grossSalary: grossSalary,
        netSalary: netSalary,
        fgtsAmount: fgtsAmount
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json(payroll)

  } catch (error) {
    console.error('Payroll POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
