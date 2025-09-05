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

    const where: any = {}
    if (year) where.year = parseInt(year)
    if (month) where.month = parseInt(month)

    // Buscar estatísticas dos recibos
    const stats = await prisma.receipt.aggregate({
      where,
      _count: {
        id: true
      },
      _sum: {
        value: true
      },
      _avg: {
        value: true
      }
    })

    return NextResponse.json({
      totalReceipts: stats._count.id || 0,
      totalValue: stats._sum.value || 0,
      averageValue: stats._avg.value || 0
    })

  } catch (error) {
    console.error('Receipt stats GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
