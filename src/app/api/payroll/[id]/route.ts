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

    // Buscar o holerite atual para manter o grossSalary original
    const currentPayroll = await prisma.payroll.findUnique({
      where: { id }
    })

    if (!currentPayroll) {
      return NextResponse.json({ error: 'Holerite não encontrado' }, { status: 404 })
    }

    // Calcular valores - garantir que todos sejam números
    const baseSalaryValue = parseFloat(baseSalary || currentPayroll.baseSalary.toString())
    const inssDiscountValue = parseFloat(inssDiscount || 0) || Number(currentPayroll.inssDiscount)
    const irrfDiscountValue = parseFloat(irrfDiscount || 0) || Number(currentPayroll.irrfDiscount)
    const healthInsuranceValue = parseFloat(healthInsurance || currentPayroll.healthInsurance.toString())
    const dentalInsuranceValue = parseFloat(dentalInsurance || currentPayroll.dentalInsurance.toString())
    const customDiscountValue = parseFloat(customDiscount || currentPayroll.customDiscount.toString())
    const otherDiscountsValue = parseFloat(otherDiscounts || currentPayroll.otherDiscounts.toString())
    const fgtsAmountValue = parseFloat(fgtsAmount || currentPayroll.fgtsAmount.toString())
    
    // Manter o salário bruto original (que já inclui rubricas e recibos)
    const grossSalary = Number(currentPayroll.grossSalary)
    
    // Calcular total de descontos
    const totalDiscounts = inssDiscountValue + irrfDiscountValue + healthInsuranceValue + dentalInsuranceValue + customDiscountValue + otherDiscountsValue
    
    // Calcular salário líquido
    const netSalary = grossSalary - totalDiscounts
    
    // Validar se o resultado é um número válido
    if (isNaN(netSalary) || !isFinite(netSalary)) {
      console.error('❌ Erro no cálculo do salário líquido:', {
        grossSalary,
        totalDiscounts,
        inssDiscountValue,
        irrfDiscountValue,
        healthInsuranceValue,
        dentalInsuranceValue,
        customDiscountValue,
        otherDiscountsValue
      })
      return NextResponse.json({ error: 'Erro no cálculo do salário líquido' }, { status: 400 })
    }

    console.log(`🔧 Atualizando holerite ${id}:`)
    console.log(`   Salário bruto original: R$ ${grossSalary}`)
    console.log(`   INSS: R$ ${inssDiscountValue} (tipo: ${typeof inssDiscountValue})`)
    console.log(`   IRRF: R$ ${irrfDiscountValue} (tipo: ${typeof irrfDiscountValue})`)
    console.log(`   Health Insurance: R$ ${healthInsuranceValue} (tipo: ${typeof healthInsuranceValue})`)
    console.log(`   Custom Discount: R$ ${customDiscountValue} (tipo: ${typeof customDiscountValue})`)
    console.log(`   Total descontos: R$ ${totalDiscounts} (tipo: ${typeof totalDiscounts})`)
    console.log(`   Novo salário líquido: R$ ${netSalary}`)

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
