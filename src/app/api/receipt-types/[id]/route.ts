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
    const { name, description, isActive } = body

    if (!name) {
      return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
    }

    // Verificar se já existe outro tipo com o mesmo nome
    const existingType = await prisma.receiptType.findFirst({
      where: { 
        name,
        id: { not: id }
      }
    })

    if (existingType) {
      return NextResponse.json({ error: 'Já existe um tipo de recibo com este nome' }, { status: 400 })
    }

    const receiptType = await prisma.receiptType.update({
      where: { id },
      data: {
        name,
        description: description || null,
        isActive: isActive !== undefined ? isActive : true
      }
    })

    return NextResponse.json(receiptType)
  } catch (error) {
    console.error('Receipt type PUT error:', error)
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

    // Verificar se existem recibos usando este tipo
    const receiptsCount = await prisma.receipt.count({
      where: { typeId: id }
    })

    if (receiptsCount > 0) {
      // Se existem recibos, apenas desativar o tipo
      const receiptType = await prisma.receiptType.update({
        where: { id },
        data: { isActive: false }
      })
      return NextResponse.json({ 
        message: 'Tipo de recibo desativado (existem recibos usando este tipo)',
        receiptType 
      })
    } else {
      // Se não existem recibos, deletar permanentemente
      await prisma.receiptType.delete({
        where: { id }
      })
      return NextResponse.json({ message: 'Tipo de recibo excluído com sucesso' })
    }
  } catch (error) {
    console.error('Receipt type DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
