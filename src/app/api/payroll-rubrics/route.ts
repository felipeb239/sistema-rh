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
    console.log('Payroll rubric POST body:', body)
    const { name, description, type, code } = body

    console.log('Validating fields:', { 
      name: name, 
      nameTrimmed: name?.trim(), 
      type: type,
      nameLength: name?.length,
      typeValid: ['discount', 'benefit'].includes(type)
    })

    if (!name || !name.trim()) {
      console.log('Validation error: missing or empty name', { name })
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    if (!type) {
      console.log('Validation error: missing type', { type })
      return NextResponse.json({ error: 'Tipo é obrigatório' }, { status: 400 })
    }

    if (!['discount', 'benefit'].includes(type)) {
      console.log('Validation error: invalid type', { type })
      return NextResponse.json({ error: 'Tipo deve ser "discount" ou "benefit"' }, { status: 400 })
    }

    console.log('All validations passed, proceeding to create rubric')

    console.log('Creating new rubric with data:', {
      name,
      description: description || null,
      type,
      code: code || null
    })

    const rubric = await prisma.payrollRubric.create({
      data: {
        name,
        description: description || null,
        type,
        code: code || null
      }
    })

    console.log('Rubric created successfully:', rubric)
    return NextResponse.json(rubric)
  } catch (error) {
    console.error('Payroll rubric POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
