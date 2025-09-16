import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { theme: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ theme: user.theme })

  } catch (error) {
    console.error('Erro ao buscar tema do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { theme } = await request.json()

    if (!theme || !['light', 'dark', 'system'].includes(theme)) {
      return NextResponse.json({ 
        error: 'Tema inválido. Use: light, dark ou system' 
      }, { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { theme },
      select: { 
        id: true, 
        username: true, 
        theme: true 
      }
    })

    console.log(`🎨 Tema atualizado para ${updatedUser.username}: ${theme}`)

    return NextResponse.json({ 
      message: 'Tema atualizado com sucesso',
      theme: updatedUser.theme 
    })

  } catch (error) {
    console.error('Erro ao atualizar tema do usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
