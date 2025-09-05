'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Settings,
  AlertTriangle
} from 'lucide-react'
import { ReceiptType } from '@/types'

async function fetchReceiptTypes() {
  const response = await fetch('/api/receipt-types')
  if (!response.ok) {
    throw new Error('Failed to fetch receipt types')
  }
  return response.json()
}

async function createReceiptType(data: { name: string; description?: string }) {
  const response = await fetch('/api/receipt-types', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to create receipt type')
  }
  return response.json()
}

async function updateReceiptType(id: string, data: { name: string; description?: string; isActive?: boolean }) {
  const response = await fetch(`/api/receipt-types/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update receipt type')
  }
  return response.json()
}

async function deleteReceiptType(id: string) {
  const response = await fetch(`/api/receipt-types/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete receipt type')
  }
  return response.json()
}

export function ReceiptTypesManager() {
  const [showForm, setShowForm] = useState(false)
  const [editingType, setEditingType] = useState<ReceiptType | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [typeToDelete, setTypeToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const queryClient = useQueryClient()

  const { data: receiptTypes = [], isLoading } = useQuery({
    queryKey: ['receipt-types'],
    queryFn: fetchReceiptTypes,
  })

  const createMutation = useMutation({
    mutationFn: createReceiptType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-types'] })
      setShowForm(false)
      setFormData({ name: '', description: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateReceiptType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-types'] })
      setEditingType(null)
      setFormData({ name: '', description: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReceiptType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipt-types'] })
    }
  })

  const handleEdit = (type: ReceiptType) => {
    setEditingType(type)
    setFormData({ name: type.name, description: type.description || '' })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingType(null)
    setFormData({ name: '', description: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingType) {
      updateMutation.mutate({
        id: editingType.id,
        data: formData
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    setTypeToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (typeToDelete) {
      deleteMutation.mutate(typeToDelete)
      setShowDeleteModal(false)
      setTypeToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setTypeToDelete(null)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tipos de Recibos
            </CardTitle>
            <CardDescription>
              Gerencie os tipos de recibos disponíveis no sistema
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Tipo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm || editingType ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome do Tipo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Ressarcimento, Hotel, Ajuda de Custo"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional do tipo"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {editingType ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        <div className="space-y-2 mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            receiptTypes.map((type: ReceiptType) => (
              <div
                key={type.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex-1">
                  <h3 className="font-medium">{type.name}</h3>
                  {type.description && (
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    type.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {type.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <div className="flex space-x-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(type)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(type.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
          {receiptTypes.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum tipo de recibo encontrado
            </div>
          )}
        </div>
      </CardContent>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Tem certeza que deseja excluir este tipo de recibo? Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
