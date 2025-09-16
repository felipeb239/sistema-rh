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
    const { name, cpf, position, department, cbo, hireDate, salary } = body

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        name,
        cpf,
        position,
        department,
        cbo,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
      }
    })

    return NextResponse.json(employee)

  } catch (error) {
    console.error('Employee PUT error:', error)
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

    // Buscar nome do funcionário antes de excluir
    const employee = await prisma.employee.findUnique({
      where: { id },
      select: { name: true }
    })

    await prisma.employee.update({
      where: { id },
      data: { status: 'inactive' }
    })

    // Adicionar alerta
    if (employee) {
      await prisma.alert.create({
        data: {
          type: 'employee',
          message: `Funcionário ${employee.name} excluído.`
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Employee DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
