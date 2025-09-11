import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Atualizar rubrica de um colaborador
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; rubricId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: employeeId, rubricId } = params
    const body = await request.json()
    const { 
      customName, 
      customValue, 
      customPercentage, 
      startDate, 
      endDate,
      isActive 
    } = body

    // Validar dados
    if (!customValue && !customPercentage) {
      return NextResponse.json({ 
        error: 'Valor fixo ou percentual é obrigatório' 
      }, { status: 400 })
    }

    // Buscar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (!employeeRubric) {
      return NextResponse.json({ 
        error: 'Rubrica não encontrada para este colaborador' 
      }, { status: 404 })
    }

    // Atualizar rubrica
    const updatedRubric = await prisma.employeeRubric.update({
      where: { id: employeeRubric.id },
      data: {
        customName,
        customValue: customValue ? parseFloat(customValue) : null,
        customPercentage: customPercentage ? parseFloat(customPercentage) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : employeeRubric.isActive
      },
      include: {
        rubric: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRubric
    })

  } catch (error) {
    console.error('Erro ao atualizar rubrica do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover rubrica de um colaborador
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; rubricId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: employeeId, rubricId } = params

    // Buscar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (!employeeRubric) {
      return NextResponse.json({ 
        error: 'Rubrica não encontrada para este colaborador' 
      }, { status: 404 })
    }

    // Remover rubrica
    await prisma.employeeRubric.delete({
      where: { id: employeeRubric.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Rubrica removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover rubrica do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
