import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const { month, year } = await request.json()

    if (!month || !year) {
      return NextResponse.json(
        { message: 'Mês e ano são obrigatórios' },
        { status: 400 }
      )
    }

    // Verificar se existem holerites para o período
    const existingPayrolls = await prisma.payroll.findMany({
      where: {
        month,
        year
      },
      select: {
        id: true,
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingPayrolls.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum holerite encontrado para este período' },
        { status: 404 }
      )
    }

    // Excluir todos os holerites do período
    const deletedPayrolls = await prisma.payroll.deleteMany({
      where: {
        month,
        year
      }
    })

    return NextResponse.json({
      message: 'Folha de pagamento excluída com sucesso',
      deleted: deletedPayrolls.count,
      month,
      year,
      employees: existingPayrolls.map(p => p.employee.name)
    })

  } catch (error) {
    console.error('Erro ao excluir folha de pagamento:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
