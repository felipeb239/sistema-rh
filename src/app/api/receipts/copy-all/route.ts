import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { sourceMonth, sourceYear, targetMonth, targetYear } = await request.json()

    console.log(`🔄 Copiando todos os recibos de ${sourceMonth}/${sourceYear} para ${targetMonth}/${targetYear}`)

    if (!sourceMonth || !sourceYear || !targetMonth || !targetYear) {
      return NextResponse.json({ 
        error: 'Mês e ano de origem e destino são obrigatórios' 
      }, { status: 400 })
    }

    // Buscar todos os recibos do mês de origem
    const sourceReceipts = await prisma.receipt.findMany({
      where: {
        month: sourceMonth,
        year: sourceYear
      },
      include: {
        employee: true,
        type: true
      }
    })

    console.log(`📋 Encontrados ${sourceReceipts.length} recibos em ${sourceMonth}/${sourceYear}`)

    if (sourceReceipts.length === 0) {
      return NextResponse.json({ 
        error: `Nenhum recibo encontrado em ${sourceMonth}/${sourceYear}` 
      }, { status: 400 })
    }

    // Verificar se já existem recibos para o mesmo período
    const employeeIds = sourceReceipts.map(r => r.employeeId)
    const existingReceipts = await prisma.receipt.findMany({
      where: {
        month: targetMonth,
        year: targetYear,
        employeeId: {
          in: employeeIds
        }
      },
      include: {
        employee: true
      }
    })

    if (existingReceipts.length > 0) {
      const employeeNames = existingReceipts.map(r => r.employee.name).join(', ')
      return NextResponse.json({ 
        error: `Já existem recibos para os seguintes funcionários em ${targetMonth}/${targetYear}: ${employeeNames}` 
      }, { status: 400 })
    }

    // Criar recibos copiados
    const receiptsToCreate = sourceReceipts.map((receipt) => ({
      id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      employeeId: receipt.employeeId,
      typeId: receipt.typeId,
      month: targetMonth,
      year: targetYear,
      dailyValue: receipt.dailyValue.toString(),
      days: receipt.days,
      value: receipt.value.toString()
    }))

    const createdReceipts = await prisma.receipt.createMany({
      data: receiptsToCreate
    })

    console.log(`✅ ${createdReceipts.count} recibo(s) copiado(s) com sucesso`)

    return NextResponse.json({
      message: `${createdReceipts.count} recibo(s) copiado(s) com sucesso`,
      count: createdReceipts.count,
      targetMonth,
      targetYear
    })

  } catch (error) {
    console.error('Erro ao copiar todos os recibos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
