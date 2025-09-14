import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.customerContact.findMany({
      orderBy: { companyName: 'asc' }
    })
    
    return NextResponse.json(contacts)
  } catch (error) {
    console.error('Erro ao buscar contatos:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    const contact = await prisma.customerContact.create({
      data: {
        companyName: data.companyName,
        contactName: data.contactName,
        phones: data.phones,
        emails: data.emails,
        notes: data.notes || null
      }
    })
    
    return NextResponse.json(contact, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar contato:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
