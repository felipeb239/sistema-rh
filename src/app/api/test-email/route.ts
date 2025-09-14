import { NextRequest, NextResponse } from 'next/server'
import { testEmailConfiguration } from '@/lib/email'

export async function GET(request: NextRequest) {
  try {
    console.log('Testando configuração de e-mail...')
    
    // Verificar variáveis de ambiente
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Configurado' : 'Não configurado')
    console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Configurado' : 'Não configurado')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Não configurado')
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        message: 'Variáveis de ambiente não configuradas',
        details: {
          EMAIL_USER: process.env.EMAIL_USER ? 'OK' : 'FALTANDO',
          EMAIL_APP_PASSWORD: process.env.EMAIL_APP_PASSWORD ? 'OK' : 'FALTANDO'
        }
      })
    }
    
    // Testar configuração
    const isValid = await testEmailConfiguration()
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Configuração de e-mail válida'
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'Configuração de e-mail inválida'
      })
    }
    
  } catch (error) {
    console.error('Erro ao testar e-mail:', error)
    return NextResponse.json({
      success: false,
      message: 'Erro ao testar configuração de e-mail',
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    })
  }
}
