import { NextRequest, NextResponse } from 'next/server'
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

    console.log('=== TESTE DE RECUPERAÇÃO DE SENHA ===')
    console.log('E-mail recebido:', email)
    console.log('Variáveis de ambiente:')
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Configurado' : 'NÃO CONFIGURADO')
    console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Configurado' : 'NÃO CONFIGURADO')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'NÃO CONFIGURADO')

    // Verificar se as variáveis de ambiente estão configuradas
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: 'Configuração de e-mail não encontrada. Verifique as variáveis de ambiente.',
        details: {
          EMAIL_USER: process.env.EMAIL_USER ? 'OK' : 'FALTANDO',
          EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? 'OK' : 'FALTANDO'
        }
      }, { status: 500 })
    }

    // Simular usuário encontrado (para teste)
    const user = {
      email: email,
      name: 'Usuário Teste'
    }

    // Gerar token de teste
    const resetToken = 'test-token-' + Date.now()

    console.log('Tentando enviar e-mail...')
    console.log('Para:', user.email)
    console.log('Nome:', user.name)
    console.log('Token:', resetToken)

    // Enviar e-mail
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken)
      console.log('✅ E-mail enviado com sucesso!')
      
      return NextResponse.json({
        success: true,
        message: 'E-mail de recuperação enviado com sucesso!',
        token: resetToken // Para teste
      })
    } catch (emailError) {
      console.error('❌ Erro ao enviar e-mail:', emailError)
      return NextResponse.json({
        success: false,
        message: 'Erro ao enviar e-mail de recuperação',
        error: emailError instanceof Error ? emailError.message : 'Erro desconhecido'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erro geral:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro interno do servidor',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
