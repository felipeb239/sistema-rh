import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { message: 'E-mail é obrigatório' },
        { status: 400 }
      )
    }

    console.log('Tentando recuperar senha para:', email)

    // Verificar se o usuário existe
    const user = await prisma.user.findFirst({
      where: { 
        email: email,
        status: 'active'
      },
      select: { id: true, name: true, email: true, status: true }
    })

    console.log('Usuário encontrado:', user)

    if (!user) {
      // Por segurança, retornamos sucesso mesmo se o usuário não existir
      console.log('Usuário não encontrado ou inativo')
      return NextResponse.json({
        message: 'Se este e-mail estiver cadastrado, você receberá instruções de recuperação.'
      })
    }

    // Gerar token de redefinição
    const resetToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 horas

    console.log('Token gerado:', resetToken)

    // Tentar salvar token no banco de dados (pode falhar se tabela não existir)
    try {
      // Verificar se a tabela existe antes de tentar usar
      if (prisma.passwordResetToken) {
        await prisma.passwordResetToken.upsert({
          where: { email },
          update: {
            token: resetToken,
            expiresAt,
            createdAt: new Date()
          },
          create: {
            email,
            token: resetToken,
            expiresAt,
            createdAt: new Date()
          }
        })
        console.log('Token salvo no banco de dados')
      } else {
        console.log('Tabela passwordResetToken não existe - continuando sem salvar token')
      }
    } catch (dbError) {
      console.log('Erro ao salvar token no banco (tabela pode não existir):', dbError)
      // Continuamos mesmo se não conseguir salvar no banco
    }

    // Enviar e-mail
    try {
      console.log('Tentando enviar e-mail...')
      
      // Verificar se as variáveis de ambiente estão configuradas
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.log('⚠️ Variáveis de ambiente não configuradas - simulando envio de e-mail')
        console.log('📧 E-mail seria enviado para:', user.email)
        console.log('🔗 Link de redefinição seria:', `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`)
        
        return NextResponse.json({
          message: 'E-mail de recuperação enviado com sucesso! (Modo de teste - verifique os logs)',
          token: resetToken, // Para teste
          debug: {
            email: user.email,
            resetLink: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
          }
        })
      }
      
      console.log('📧 Enviando e-mail real para:', user.email)
      await sendPasswordResetEmail(user.email, user.name || 'Usuário', resetToken)
      console.log('✅ E-mail enviado com sucesso!')
    } catch (emailError) {
      console.error('❌ Erro ao enviar e-mail:', emailError)
      return NextResponse.json(
        { message: 'Erro ao enviar e-mail de recuperação. Verifique a configuração.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Se este e-mail estiver cadastrado, você receberá instruções de recuperação.'
    })

  } catch (error) {
    console.error('Erro na recuperação de senha:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
