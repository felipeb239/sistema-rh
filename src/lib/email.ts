import nodemailer from 'nodemailer'

// Configuração do transporter para Google Workspace
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Seu e-mail do Google Workspace
      pass: process.env.EMAIL_APP_PASSWORD // Senha de app do Google
    }
  })
}

// Template de e-mail para redefinição de senha
const createPasswordResetEmailTemplate = (name: string, resetLink: string) => {
  return {
    subject: 'Redefinição de Senha - Sistema de Folha de Pagamento',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Redefinição de Senha</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background-color: #3b82f6;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
          }
          .content {
            background-color: #f8fafc;
            padding: 30px;
            border-radius: 0 0 8px 8px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            color: #64748b;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sistema de Folha de Pagamento</h1>
        </div>
        
        <div class="content">
          <h2>Olá, ${name}!</h2>
          
          <p>Você solicitou a redefinição da sua senha no Sistema de Folha de Pagamento.</p>
          
          <p>Para criar uma nova senha, clique no botão abaixo:</p>
          
          <div style="text-align: center;">
            <a href="${resetLink}" class="button">Redefinir Senha</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este link é válido por 24 horas</li>
              <li>Se você não solicitou esta redefinição, ignore este e-mail</li>
              <li>Não compartilhe este link com outras pessoas</li>
            </ul>
          </div>
          
          <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
          <p style="word-break: break-all; background-color: #e2e8f0; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${resetLink}
          </p>
        </div>
        
        <div class="footer">
          <p>Este é um e-mail automático, não responda a esta mensagem.</p>
          <p>Se você tiver dúvidas, entre em contato com o administrador do sistema.</p>
        </div>
      </body>
      </html>
    `,
    text: `
      Olá, ${name}!
      
      Você solicitou a redefinição da sua senha no Sistema de Folha de Pagamento.
      
      Para criar uma nova senha, acesse o link abaixo:
      ${resetLink}
      
      IMPORTANTE:
      - Este link é válido por 24 horas
      - Se você não solicitou esta redefinição, ignore este e-mail
      - Não compartilhe este link com outras pessoas
      
      Este é um e-mail automático, não responda a esta mensagem.
      Se você tiver dúvidas, entre em contato com o administrador do sistema.
    `
  }
}

// Função para enviar e-mail de redefinição de senha
export async function sendPasswordResetEmail(email: string, name: string, token: string) {
  try {
    console.log('Configurações de e-mail:')
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Configurado' : 'Não configurado')
    console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? 'Configurado' : 'Não configurado')
    console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'Não configurado')
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      throw new Error('Variáveis de ambiente de e-mail não configuradas')
    }
    
    const transporter = createTransporter()
    
    // Construir URL de redefinição
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetLink = `${baseUrl}/reset-password?token=${token}`
    
    console.log('Link de redefinição:', resetLink)
    
    // Criar template do e-mail
    const emailTemplate = createPasswordResetEmailTemplate(name, resetLink)
    
    // Configurar e-mail
    const mailOptions = {
      from: {
        name: 'Sistema de Folha de Pagamento',
        address: process.env.EMAIL_USER!
      },
      to: email,
      subject: emailTemplate.subject,
      html: emailTemplate.html,
      text: emailTemplate.text
    }
    
    console.log('Enviando e-mail para:', email)
    
    // Enviar e-mail
    const result = await transporter.sendMail(mailOptions)
    console.log('E-mail de redefinição enviado:', result.messageId)
    
    return result
  } catch (error) {
    console.error('Erro ao enviar e-mail de redefinição:', error)
    throw error
  }
}

// Função para testar a configuração de e-mail
export async function testEmailConfiguration() {
  try {
    const transporter = createTransporter()
    await transporter.verify()
    console.log('Configuração de e-mail válida')
    return true
  } catch (error) {
    console.error('Erro na configuração de e-mail:', error)
    return false
  }
}
