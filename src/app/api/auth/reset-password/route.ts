import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { message: 'A senha deve ter pelo menos 6 caracteres' },
        { status: 400 }
      )
    }

    console.log('Tentando redefinir senha com token:', token.substring(0, 8) + '...')

    // Verificar se a tabela passwordResetToken existe e tentar usar
    try {
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

      // Verificar se o usuário existe
      const user = await prisma.user.findFirst({
        where: { 
          email: resetToken.email,
          status: 'active'
        },
        select: { id: true, email: true, username: true }
      })

      if (!user) {
        return NextResponse.json(
          { message: 'Usuário não encontrado ou inativo' },
          { status: 400 }
        )
      }

      console.log('Atualizando senha para usuário:', user.email)

      // Criptografar nova senha
      const hashedPassword = await bcrypt.hash(password, 12)

      // Atualizar senha do usuário
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      })

      // Remover token usado
      await prisma.passwordResetToken.delete({
        where: { token }
      })

      console.log('Senha atualizada com sucesso para:', user.email)

      return NextResponse.json({
        message: 'Senha redefinida com sucesso'
      })

    } catch (dbError) {
      console.error('Erro ao acessar tabela de tokens:', dbError)
      
      // Se a tabela não existir, retornar erro específico
      return NextResponse.json(
        { message: 'Sistema de recuperação não configurado. Entre em contato com o administrador.' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao redefinir senha:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
