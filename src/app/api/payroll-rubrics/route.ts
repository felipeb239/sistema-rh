import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rubrics = await prisma.payrollRubric.findMany({
      where: { isActive: true },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json(rubrics)
  } catch (error) {
    console.error('Payroll rubrics GET error:', error)
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
    const { name, description, type, code } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    if (!['discount', 'benefit'].includes(type)) {
      return NextResponse.json({ error: 'Tipo deve ser "discount" ou "benefit"' }, { status: 400 })
    }

    // Verificar se já existe uma rubrica com o mesmo nome
    const existingRubric = await prisma.payrollRubric.findUnique({
      where: { name }
    })

    if (existingRubric) {
      return NextResponse.json({ error: 'Já existe uma rubrica com este nome' }, { status: 400 })
    }

    const rubric = await prisma.payrollRubric.create({
      data: {
        name,
        description: description || null,
        type,
        code: code || null
      }
    })

    return NextResponse.json(rubric)
  } catch (error) {
    console.error('Payroll rubric POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
