'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsers, User } from '@/hooks/use-users'

interface UserFormProps {
  user?: User | null
  onSuccess: () => void
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const { createUser, updateUser } = useUsers()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
    level: 1,
    status: 'active' as 'active' | 'inactive'
  })

  // Preencher formulário se estiver editando
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        name: user.name,
        email: user.email || '',
        password: '', // Não preencher senha na edição
        role: user.role,
        level: user.level,
        status: user.status
      })
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Preparar dados para envio
      const userData = {
        username: formData.username,
        name: formData.name,
        email: formData.email || undefined,
        password: formData.password,
        role: formData.role,
        level: formData.level,
        status: formData.status
      }

      // Remover senha vazia na edição
      if (user && !formData.password) {
        delete userData.password
      }

      let result
      if (user) {
        result = await updateUser(user.id, userData)
      } else {
        result = await createUser(userData as any)
      }

      if (result.success) {
        onSuccess()
      } else {
        alert(`Erro: ${result.error}`)
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
      alert('Erro interno do servidor')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getLevelDescription = (level: number) => {
    switch (level) {
      case 1:
        return 'Acesso apenas ao módulo de Secretaria'
      case 2:
        return 'Acesso a todo o sistema exceto gerenciamento de usuários'
      case 3:
        return 'Acesso total a todos os módulos do sistema'
      default:
        return 'Nível de acesso não reconhecido'
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username */}
      <div>
        <Label htmlFor="username">Nome de Usuário *</Label>
        <Input
          id="username"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Nome */}
      <div>
        <Label htmlFor="name">Nome Completo *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isSubmitting}
        />
      </div>

      {/* Email */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isSubmitting}
        />
      </div>

      {/* Senha */}
      <div>
        <Label htmlFor="password">
          Senha {user ? '(deixe em branco para manter a atual)' : '*'}
        </Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!user}
          disabled={isSubmitting}
        />
      </div>

      {/* Nível de Acesso */}
      <div>
        <Label htmlFor="level">Nível de Acesso *</Label>
        <Select
          value={formData.level.toString()}
          onValueChange={(value) => setFormData({ ...formData, level: parseInt(value) })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o nível de acesso" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">
              <div className="flex flex-col">
                <span>Nível 1 - Secretaria</span>
                <span className="text-xs text-gray-500">Acesso apenas à Secretaria</span>
              </div>
            </SelectItem>
            <SelectItem value="2">
              <div className="flex flex-col">
                <span>Nível 2 - Sistema Completo</span>
                <span className="text-xs text-gray-500">Acesso a todo o sistema exceto usuários</span>
              </div>
            </SelectItem>
            <SelectItem value="3">
              <div className="flex flex-col">
                <span>Nível 3 - Administrador</span>
                <span className="text-xs text-gray-500">Acesso total a todos os módulos</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          {getLevelDescription(formData.level)}
        </p>
      </div>

      {/* Função */}
      <div>
        <Label htmlFor="role">Função *</Label>
        <Select
          value={formData.role}
          onValueChange={(value: 'admin' | 'user') => setFormData({ ...formData, role: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione a função" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="user">Usuário</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Status */}
      <div>
        <Label htmlFor="status">Status *</Label>
        <Select
          value={formData.status}
          onValueChange={(value: 'active' | 'inactive') => setFormData({ ...formData, status: value })}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : (user ? 'Atualizar' : 'Criar')}
        </Button>
      </div>
    </form>
  )
}
