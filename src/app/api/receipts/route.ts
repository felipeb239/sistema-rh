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

    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 15 // Fixado em 15 recibos por página

    // Aplicar filtros de ano e mês
    const where: any = {}
    if (year) where.year = parseInt(year)
    if (month) where.month = parseInt(month)
    

    // Buscar total de recibos para calcular total de páginas
    const totalReceipts = await prisma.receipt.count({ where })
    const totalPages = Math.ceil(totalReceipts / limit)
    const skip = (page - 1) * limit


    const receipts = await prisma.receipt.findMany({
      where,
      select: {
        id: true,
        employeeId: true,
        typeId: true,
        month: true,
        year: true,
        dailyValue: true,
        days: true,
        value: true,
        createdAt: true,
        updatedAt: true,
        employee: {
          select: {
            id: true,
            name: true,
            cpf: true
          }
        },
        type: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Mais recentes primeiro
      },
      skip,
      take: limit
    })


    return NextResponse.json({
      receipts: receipts,
      pagination: {
        page,
        limit,
        totalReceipts,
        totalPages
      }
    })

  } catch (error) {
    console.error('Receipts GET error:', error)
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
    const { employeeId, typeId, month, year, dailyValue, days, value } = body

    const receipt = await prisma.receipt.create({
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

    // Adicionar alerta
    await prisma.alert.create({
      data: {
        type: 'receipt',
        message: `Recibo emitido para ${receipt.employee?.name} (${month}/${year})`
      }
    })

    return NextResponse.json(receipt)

  } catch (error) {
    console.error('Receipts POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
