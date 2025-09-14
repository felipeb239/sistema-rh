'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Search, Edit, Trash2, UserCheck, UserX, Shield } from 'lucide-react'
import { useUsers, User } from '@/hooks/use-users'
import { UserForm } from './user-form'

export function UsersContent() {
  const { users, isLoading, error, deleteUser, toggleUserStatus } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])


  // Filtrar usuários
  useEffect(() => {
    const filtered = users.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário?')) return
    
    const result = await deleteUser(id)
    if (!result.success) {
      alert(`Erro ao excluir usuário: ${result.error}`)
    }
  }

  const handleToggleStatus = async (user: User) => {
    const result = await toggleUserStatus(user.id, user.status)
    if (!result.success) {
      alert(`Erro ao alterar status: ${result.error}`)
    }
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
  }

  const getLevelInfo = (level: number) => {
    switch (level) {
      case 1:
        return { name: 'Secretaria', color: 'bg-blue-100 text-blue-800' }
      case 2:
        return { name: 'Sistema', color: 'bg-green-100 text-green-800' }
      case 3:
        return { name: 'Admin', color: 'bg-purple-100 text-purple-800' }
      default:
        return { name: 'Desconhecido', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return { name: 'Ativo', color: 'bg-green-100 text-green-800' }
      case 'inactive':
        return { name: 'Inativo', color: 'bg-red-100 text-red-800' }
      default:
        return { name: 'Desconhecido', color: 'bg-gray-100 text-gray-800' }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando usuários...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <Button onClick={() => window.location.reload()}>
          Tentar Novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-2">
            Gerencie os usuários e níveis de acesso do sistema
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
              <DialogDescription>
                {editingUser ? 'Atualize as informações do usuário' : 'Crie um novo usuário no sistema'}
              </DialogDescription>
            </DialogHeader>
            
            <UserForm
              user={editingUser}
              onSuccess={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nome, usuário ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de usuários */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => {
          const levelInfo = getLevelInfo(user.level)
          const statusInfo = getStatusInfo(user.status)
          
          return (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-full">
                      <Shield className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{user.name}</CardTitle>
                      <CardDescription>@{user.username}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleToggleStatus(user)}
                      className={user.status === 'active' ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}
                    >
                      {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Email */}
                  {user.email && (
                    <div className="text-sm text-gray-600">
                      <strong>Email:</strong> {user.email}
                    </div>
                  )}

                  {/* Nível de acesso */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Nível:</span>
                    <Badge className={levelInfo.color}>
                      {levelInfo.name}
                    </Badge>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">Status:</span>
                    <Badge className={statusInfo.color}>
                      {statusInfo.name}
                    </Badge>
                  </div>

                  {/* Data de criação */}
                  <div className="text-sm text-gray-500">
                    Criado em: {new Date(user.createdAt).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredUsers.length === 0 && (
        <div className="text-center py-12">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente ajustar os termos de busca'
              : 'Comece adicionando um novo usuário'
            }
          </p>
        </div>
      )}
    </div>
  )
}