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
    const { employeeId, typeId, month, year, dailyValue, days, value } = body

    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        employeeId,
        typeId,
        month: parseInt(month),
        year: parseInt(year),
        dailyValue: parseFloat(dailyValue),
        days: parseInt(days),
        value: parseFloat(value)
      },
      include: {
        employee: true,
        type: true
      }
    })

    return NextResponse.json(receipt)

  } catch (error) {
    console.error('Receipt PUT error:', error)
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
    const receipt = await prisma.receipt.findUnique({
      where: { id },
      include: { employee: true }
    })

    await prisma.receipt.delete({
      where: { id }
    })

    // Adicionar alerta
    if (receipt) {
      await prisma.alert.create({
        data: {
          type: 'receipt',
          message: `Recibo excluído de ${receipt.employee?.name} (${receipt.month}/${receipt.year})`
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Receipt DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
