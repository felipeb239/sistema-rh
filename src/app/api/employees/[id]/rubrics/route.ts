import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar rubricas de um colaborador específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id

    // Buscar colaborador com suas rubricas
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        employeeRubrics: {
          include: {
            rubric: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Buscar todas as rubricas globais disponíveis
    const availableRubrics = await prisma.payrollRubric.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrar rubricas que ainda não foram aplicadas ao colaborador
    const appliedRubricIds = employee.employeeRubrics.map(er => er.rubricId)
    const unappliedRubrics = availableRubrics.filter(rubric => 
      !appliedRubricIds.includes(rubric.id)
    )

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department
      },
      appliedRubrics: employee.employeeRubrics,
      availableRubrics: unappliedRubrics
    })

  } catch (error) {
    console.error('Erro ao buscar rubricas do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Adicionar rubrica a um colaborador
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id
    const body = await request.json()
    const { 
      rubricId, 
      customName, 
      customValue, 
      customPercentage, 
      startDate, 
      endDate 
    } = body

    // Validar dados
    if (!rubricId) {
      return NextResponse.json({ error: 'ID da rubrica é obrigatório' }, { status: 400 })
    }

    if (!customValue && !customPercentage) {
      return NextResponse.json({ 
        error: 'Valor fixo ou percentual é obrigatório' 
      }, { status: 400 })
    }

    // Verificar se o colaborador existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Verificar se a rubrica existe
    const rubric = await prisma.payrollRubric.findUnique({
      where: { id: rubricId }
    })

    if (!rubric) {
      return NextResponse.json({ error: 'Rubrica não encontrada' }, { status: 404 })
    }

    // Verificar se já existe uma rubrica aplicada para este colaborador
    const existingRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (existingRubric) {
      return NextResponse.json({ 
        error: 'Esta rubrica já foi aplicada a este colaborador' 
      }, { status: 400 })
    }

    // Criar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.create({
      data: {
        employeeId,
        rubricId,
        customName,
        customValue: customValue ? parseFloat(customValue) : null,
        customPercentage: customPercentage ? parseFloat(customPercentage) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        rubric: true
      }
    })

    return NextResponse.json({
      success: true,
      data: employeeRubric
    })

  } catch (error) {
    console.error('Erro ao adicionar rubrica ao colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
