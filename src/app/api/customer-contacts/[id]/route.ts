import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.customerContact.findUnique({
      where: { id: params.id }
    })
    
    if (!contact) {
      return NextResponse.json(
        { error: 'Contato não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Erro ao buscar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await request.json()
    
    const contact = await prisma.customerContact.update({
      where: { id: params.id },
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        phones: data.phones,
        emails: data.emails,
        notes: data.notes || null
      }
    })
    
    return NextResponse.json(contact)
  } catch (error) {
    console.error('Erro ao atualizar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.customerContact.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Contato excluído com sucesso' })
  } catch (error) {
    console.error('Erro ao excluir contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
