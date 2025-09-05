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

    const currentYear = new Date().getFullYear()

    // Buscar dados do dashboard
    const [
      totalEmployees,
      totalPayrolls,
      totalReceipts,
      monthlyExpenses
    ] = await Promise.all([
      prisma.employee.count({
        where: { status: 'active' }
      }),
      prisma.payroll.count({
        where: { year: currentYear }
      }),
      prisma.receipt.count({
        where: { year: currentYear }
      }),
      prisma.payroll.groupBy({
        by: ['month'],
        where: { year: currentYear },
        _sum: {
          netSalary: true
        }
      })
    ])

    // Formatar dados de gastos mensais
    const monthlyExpensesData = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1
      const monthData = monthlyExpenses.find(m => m.month === month)
      return {
        month,
        totalExpenses: monthData?._sum.netSalary || 0
      }
    })

    return NextResponse.json({
      totalEmployees,
      totalPayrolls,
      totalReceipts,
      monthlyExpenses: monthlyExpensesData
    })

  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
