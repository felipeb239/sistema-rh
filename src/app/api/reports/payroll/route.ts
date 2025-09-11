import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateEmployeeRubrics } from '@/lib/employee-rubrics'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    // Validação dos parâmetros
    if (!month || !year) {
      return NextResponse.json({ 
        error: 'Mês e ano são obrigatórios' 
      }, { status: 400 })
    }

    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ 
        error: 'Mês deve estar entre 1 e 12' 
      }, { status: 400 })
    }

    const currentYear = new Date().getFullYear()
    if (yearNum < 2020 || yearNum > currentYear + 10) {
      return NextResponse.json({ 
        error: `Ano deve estar entre 2020 e ${currentYear + 10}` 
      }, { status: 400 })
    }

    // Buscar holerites do mês/ano especificado
    const payrolls = await prisma.payroll.findMany({
      where: {
        month: monthNum,
        year: yearNum
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            department: true,
            employeeRubrics: {
              include: {
                rubric: true
              }
            }
          }
        }
      },
      orderBy: {
        employee: {
          name: 'asc'
        }
      }
    })

    // Calcular totais
    const totals = {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalInssDiscount: 0,
      totalIrrfDiscount: 0,
      totalHealthInsurance: 0,
      totalDentalInsurance: 0,
      totalCustomDiscount: 0,
      totalOtherDiscounts: 0,
      totalFgtsAmount: 0,
      totalDiscounts: 0,
      totalEmployeeRubricsBenefits: 0,
      totalEmployeeRubricsDiscounts: 0,
      // Totais por tipo de rubrica específica
      totalSpecificInss: 0,
      totalSpecificIrrf: 0,
      totalSpecificHealthInsurance: 0,
      totalSpecificDentalInsurance: 0,
      totalSpecificCustomDiscount: 0,
      totalSpecificOtherDiscounts: 0,
      count: payrolls.length
    }

    payrolls.forEach(payroll => {
      // Os valores já estão calculados corretamente na geração da folha
      // Não precisamos recalcular, apenas usar os valores do banco
      
      // Atualizar totais usando os valores já calculados
      totals.totalGrossSalary += Number(payroll.grossSalary)
      totals.totalNetSalary += Number(payroll.netSalary)
      totals.totalInssDiscount += Number(payroll.inssDiscount)
      totals.totalIrrfDiscount += Number(payroll.irrfDiscount)
      totals.totalHealthInsurance += Number(payroll.healthInsurance)
      totals.totalDentalInsurance += Number(payroll.dentalInsurance)
      totals.totalCustomDiscount += Number(payroll.customDiscount)
      totals.totalOtherDiscounts += Number(payroll.otherDiscounts)
      totals.totalFgtsAmount += Number(payroll.fgtsAmount)
      
      // Calcular total de descontos
      const totalDiscounts = Number(payroll.inssDiscount) + 
                            Number(payroll.irrfDiscount) + 
                            Number(payroll.healthInsurance) + 
                            Number(payroll.dentalInsurance) + 
                            Number(payroll.customDiscount) + 
                            Number(payroll.otherDiscounts)
      
      totals.totalDiscounts += totalDiscounts
    })

    return NextResponse.json({
      payrolls,
      totals,
      period: {
        month: monthNum,
        year: yearNum,
        monthName: getMonthName(monthNum)
      }
    })

  } catch (error) {
    console.error('Erro ao buscar relatório de holerites:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1] || 'Mês'
}
