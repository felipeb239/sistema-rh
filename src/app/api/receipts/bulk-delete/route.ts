import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiptIds } = await request.json()

    if (!receiptIds || !Array.isArray(receiptIds) || receiptIds.length === 0) {
      return NextResponse.json({ error: 'Lista de IDs de recibos é obrigatória' }, { status: 400 })
    }

    console.log(`🗑️ Excluindo ${receiptIds.length} recibo(s) em lote...`)

    // Verificar se os recibos existem
    const existingReceipts = await prisma.receipt.findMany({
      where: {
        id: {
          in: receiptIds
        }
      },
      include: {
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingReceipts.length !== receiptIds.length) {
      const foundIds = existingReceipts.map(r => r.id)
      const notFoundIds = receiptIds.filter(id => !foundIds.includes(id))
      return NextResponse.json({ 
        error: `Alguns recibos não foram encontrados: ${notFoundIds.join(', ')}` 
      }, { status: 404 })
    }

    // Excluir recibos em lote
    const deleteResult = await prisma.receipt.deleteMany({
      where: {
        id: {
          in: receiptIds
        }
      }
    })

    console.log(`✅ ${deleteResult.count} recibo(s) excluído(s) com sucesso`)

    // Log dos recibos excluídos para auditoria
    console.log('Recibos excluídos:')
    existingReceipts.forEach(receipt => {
      console.log(`  - ${receipt.employee.name} - ${receipt.month}/${receipt.year}`)
    })

    return NextResponse.json({
      message: `${deleteResult.count} recibo(s) excluído(s) com sucesso`,
      count: deleteResult.count,
      deletedReceipts: existingReceipts.map(r => ({
        id: r.id,
        employeeName: r.employee.name,
        month: r.month,
        year: r.year
      }))
    })

  } catch (error) {
    console.error('Erro ao excluir recibos em lote:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
