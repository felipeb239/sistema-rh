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
    const { name, description, type, code, isActive } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
    }

    if (!['discount', 'benefit'].includes(type)) {
      return NextResponse.json({ error: 'Tipo deve ser "discount" ou "benefit"' }, { status: 400 })
    }

    // Verificar se já existe outra rubrica com o mesmo nome
    const existingRubric = await prisma.payrollRubric.findFirst({
      where: { 
        name,
        id: { not: id }
      }
    })

    if (existingRubric) {
      return NextResponse.json({ error: 'Já existe uma rubrica com este nome' }, { status: 400 })
    }

    const rubric = await prisma.payrollRubric.update({
      where: { id },
      data: {
        name,
        description: description || null,
        type,
        code: code || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(rubric)
  } catch (error) {
    console.error('Payroll rubric PUT error:', error)
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

    // Apenas desativar a rubrica em vez de deletar
    const rubric = await prisma.payrollRubric.update({
      where: { id },
      data: { isActive: false }
    })

    return NextResponse.json({ 
      message: 'Rubrica desativada com sucesso',
      rubric 
    })
  } catch (error) {
    console.error('Payroll rubric DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
