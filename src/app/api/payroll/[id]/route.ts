import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const {
      baseSalary,
      inssDiscount,
      irrfDiscount,
      healthInsurance,
      dentalInsurance,
      customDiscount,
      customDiscountDescription,
      otherDiscounts,
      fgtsAmount,
      autoCalculateTaxes
    } = body

    // Calcular valores
    const baseSalaryValue = parseFloat(baseSalary || 0)
    const inssDiscountValue = parseFloat(inssDiscount || 0)
    const irrfDiscountValue = parseFloat(irrfDiscount || 0)
    const healthInsuranceValue = parseFloat(healthInsurance || 0)
    const dentalInsuranceValue = parseFloat(dentalInsurance || 0)
    const customDiscountValue = parseFloat(customDiscount || 0)
    const otherDiscountsValue = parseFloat(otherDiscounts || 0)
    const fgtsAmountValue = parseFloat(fgtsAmount || 0)
    
    // Calcular salário bruto
    const grossSalary = baseSalaryValue
    
    // Calcular total de descontos
    const totalDiscounts = inssDiscountValue + irrfDiscountValue + healthInsuranceValue + dentalInsuranceValue + customDiscountValue + otherDiscountsValue
    
    // Calcular salário líquido
    const netSalary = grossSalary - totalDiscounts

    const payroll = await prisma.payroll.update({
      where: { id },
      data: {
        baseSalary: baseSalaryValue,
        inssDiscount: inssDiscountValue,
        irrfDiscount: irrfDiscountValue,
        healthInsurance: healthInsuranceValue,
        dentalInsurance: dentalInsuranceValue,
        customDiscount: customDiscountValue,
        customDiscountDescription: customDiscountDescription || null,
        otherDiscounts: otherDiscountsValue,
        grossSalary,
        netSalary,
        fgtsAmount: fgtsAmountValue
      },
      include: {
        employee: true
      }
    })

    return NextResponse.json(payroll)

  } catch (error) {
    console.error('Payroll PUT error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    await prisma.payroll.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Payroll DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
