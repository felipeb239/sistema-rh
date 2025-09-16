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

    const { receipts, targetMonth, targetYear } = await request.json()

    console.log('📋 Dados recebidos:', { receipts: receipts?.length, targetMonth, targetYear })
    console.log('📋 Primeiro recibo:', receipts?.[0])

    if (!receipts || !Array.isArray(receipts) || receipts.length === 0) {
      console.log('❌ Erro: Lista de recibos inválida')
      return NextResponse.json({ error: 'Lista de recibos é obrigatória' }, { status: 400 })
    }

    if (!targetMonth || !targetYear) {
      console.log('❌ Erro: Mês ou ano de destino ausente')
      return NextResponse.json({ error: 'Mês e ano de destino são obrigatórios' }, { status: 400 })
    }

    // Filtrar recibos válidos (remover inválidos em vez de falhar)
    const validReceipts = receipts.filter((receipt: any, index: number) => {
      const isValid = receipt.employeeId && receipt.typeId && 
                     (receipt.dailyValue !== undefined && receipt.dailyValue !== null) &&
                     (receipt.days !== undefined && receipt.days !== null)
      
      if (!isValid) {
        console.log(`⚠️ Pulando recibo ${index + 1} inválido:`, receipt)
      }
      
      return isValid
    })

    if (validReceipts.length === 0) {
      console.log('❌ Nenhum recibo válido encontrado')
      return NextResponse.json({ 
        error: 'Nenhum recibo válido para copiar' 
      }, { status: 400 })
    }

    console.log(`✅ ${validReceipts.length} recibo(s) válido(s) de ${receipts.length} total`)

    console.log(`🔄 Copiando ${validReceipts.length} recibo(s) para ${targetMonth}/${targetYear}`)

    // Verificar se já existem recibos para o mesmo período
    const employeeIds = validReceipts.map((r: any) => r.employeeId).filter(Boolean)
    console.log('🔍 Verificando duplicatas para funcionários:', employeeIds)
    
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

    console.log('🔍 Recibos existentes encontrados:', existingReceipts.length)

    if (existingReceipts.length > 0) {
      const employeeNames = existingReceipts.map(r => r.employee.name).join(', ')
      console.log('❌ Duplicatas encontradas:', employeeNames)
      return NextResponse.json({ 
        error: `Já existem recibos para os seguintes funcionários em ${targetMonth}/${targetYear}: ${employeeNames}` 
      }, { status: 400 })
    }

    // Criar recibos copiados
    const receiptsToCreate = validReceipts.map((receipt: any) => {
      const dailyValue = parseFloat(receipt.dailyValue) || 0
      const days = parseInt(receipt.days) || 0
      const value = dailyValue * days
      
      console.log(`📝 Criando recibo:`, {
        employeeId: receipt.employeeId,
        typeId: receipt.typeId,
        dailyValue,
        days,
        value
      })
      
      return {
        id: `receipt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employeeId: receipt.employeeId,
        typeId: receipt.typeId,
        month: targetMonth,
        year: targetYear,
        dailyValue: dailyValue.toString(),
        days: days,
        value: value.toString()
      }
    })

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
    console.error('Erro ao copiar recibos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
