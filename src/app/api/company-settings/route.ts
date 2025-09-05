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

    const settings = await prisma.companySettings.findFirst({
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json(settings || {})

  } catch (error) {
    console.error('Company settings GET error:', error)
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
    const {
      companyName,
      cnpj,
      address,
      city,
      state,
      zipCode,
      phone,
      email,
      website,
      logo
    } = body

    // Verificar se já existe configuração
    const existingSettings = await prisma.companySettings.findFirst()

    let settings
    if (existingSettings) {
      // Atualizar configuração existente
      settings = await prisma.companySettings.update({
        where: { id: existingSettings.id },
        data: {
          companyName,
          cnpj,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          website,
          logo
        }
      })
    } else {
      // Criar nova configuração
      settings = await prisma.companySettings.create({
        data: {
          companyName,
          cnpj,
          address,
          city,
          state,
          zipCode,
          phone,
          email,
          website,
          logo
        }
      })
    }

    return NextResponse.json(settings)

  } catch (error) {
    console.error('Company settings POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
