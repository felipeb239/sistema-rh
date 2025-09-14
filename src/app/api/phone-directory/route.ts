import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const contacts = await prisma.phoneDirectory.findMany({
      orderBy: { name: 'asc' }
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
    
    const contact = await prisma.phoneDirectory.create({
      data: {
        name: data.name,
        phone: data.phone,
        department: data.department || null,
        position: data.position || null
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
