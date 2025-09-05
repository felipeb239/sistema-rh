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

    const receiptTypes = await prisma.receiptType.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(receiptTypes)
  } catch (error) {
    console.error('Receipt types GET error:', error)
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe um tipo com o mesmo nome
    const existingType = await prisma.receiptType.findUnique({
      where: { name }
    })

    if (existingType) {
      return NextResponse.json({ error: 'Já existe um tipo de recibo com este nome' }, { status: 400 })
    }

    const receiptType = await prisma.receiptType.create({
      data: {
        name,
        description: description || null
      }
    })

    return NextResponse.json(receiptType)
  } catch (error) {
    console.error('Receipt type POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
