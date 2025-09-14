'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isSendingEmail, setIsSendingEmail] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await performLogin()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      performLogin()
    }
  }

  const performLogin = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Usuário ou senha inválidos')
      } else {
        // Verificar se a sessão foi criada
        const session = await getSession()
        if (session) {
          router.push('/')
        }
      }
    } catch (error) {
      setError('Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail || !forgotEmail.includes('@')) {
      toast.error('Digite um e-mail válido')
      return
    }

    setIsSendingEmail(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: forgotEmail })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Se este e-mail estiver cadastrado, você receberá instruções de recuperação em instantes.')
        setIsForgotPasswordOpen(false)
        setForgotEmail('')
      } else {
        toast.error(result.message || 'Erro ao enviar e-mail de recuperação')
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error)
      toast.error('Erro ao enviar e-mail de recuperação')
    } finally {
      setIsSendingEmail(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sistema de Folha de Pagamento</CardTitle>
          <CardDescription>
            Faça login para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="Digite seu usuário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                required
                placeholder="Digite sua senha"
              />
            </div>
            {error && (
              <div className="text-sm text-destructive text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsForgotPasswordOpen(true)}
              className="text-sm text-muted-foreground hover:text-primary underline"
            >
              Esqueci minha senha
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Esqueci Minha Senha */}
      <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recuperar Senha</DialogTitle>
            <DialogDescription>
              Informe seu e-mail cadastrado para receber instruções de recuperação de senha.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgot-email">E-mail</Label>
              <Input
                id="forgot-email"
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                required
              />
            </div>
            
            <Button
              onClick={handleForgotPassword}
              disabled={isSendingEmail}
              className="w-full"
            >
              {isSendingEmail ? 'Enviando...' : 'Enviar Instruções'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
