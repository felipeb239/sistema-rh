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

    const employees = await prisma.employee.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(employees)

  } catch (error) {
    console.error('Employees GET error:', error)
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
    const { name, cpf, position, department, hireDate, salary } = body

    const employee = await prisma.employee.create({
      data: {
        name,
        cpf,
        position,
        department,
        hireDate: hireDate ? new Date(hireDate) : null,
        salary: salary ? parseFloat(salary) : null,
      }
    })

    // Adicionar alerta
    await prisma.alert.create({
      data: {
        type: 'employee',
        message: `Funcionário ${name} cadastrado.`
      }
    })

    return NextResponse.json(employee)

  } catch (error) {
    console.error('Employees POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
