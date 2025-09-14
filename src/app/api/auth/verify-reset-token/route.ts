import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { message: 'Token é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Verificando token:', token.substring(0, 8) + '...')

    try {
      // Verificar se o token é válido e não expirou
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        select: { email: true, expiresAt: true }
      })

      console.log('Token encontrado no banco:', !!resetToken)

      if (!resetToken) {
        return NextResponse.json(
          { message: 'Token inválido' },
          { status: 400 }
        )
      }

      if (resetToken.expiresAt < new Date()) {
        // Remover token expirado
        await prisma.passwordResetToken.delete({
          where: { token }
        })
        return NextResponse.json(
          { message: 'Token expirado' },
          { status: 400 }
        )
      }

      // Verificar se o usuário existe e está ativo
      const user = await prisma.user.findFirst({
        where: { 
          email: resetToken.email,
          status: 'active'
        },
        select: { id: true, email: true }
      })

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado ou inativo' },
          { status: 400 }
        )
      }

      console.log('Token válido para usuário:', user.email)

      return NextResponse.json({
        message: 'Token válido'
      })

    } catch (dbError) {
      console.error('Erro ao acessar tabela de tokens:', dbError)
      
      return NextResponse.json(
        { message: 'Sistema de recuperação não configurado. Entre em contato com o administrador.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
