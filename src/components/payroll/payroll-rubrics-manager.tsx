'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Settings,
  Copy,
  AlertTriangle
} from 'lucide-react'
import { PayrollRubric } from '@/types'

async function fetchPayrollRubrics() {
  const response = await fetch('/api/payroll-rubrics')
  if (!response.ok) {
    throw new Error('Failed to fetch payroll rubrics')
  }
  return response.json()
}

async function createPayrollRubric(data: { name: string; description?: string; type: 'discount' | 'benefit'; code?: string }) {
  const response = await fetch('/api/payroll-rubrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to create payroll rubric')
  }
  return response.json()
}

async function updatePayrollRubric(id: string, data: { name: string; description?: string; type: 'discount' | 'benefit'; code?: string; isActive?: boolean }) {
  const response = await fetch(`/api/payroll-rubrics/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) {
    throw new Error('Failed to update payroll rubric')
  }
  return response.json()
}

async function deletePayrollRubric(id: string) {
  const response = await fetch(`/api/payroll-rubrics/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete payroll rubric')
  }
  return response.json()
}

export function PayrollRubricsManager() {
  const [showForm, setShowForm] = useState(false)
  const [editingRubric, setEditingRubric] = useState<PayrollRubric | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [rubricToDelete, setRubricToDelete] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    type: 'discount' as 'discount' | 'benefit',
    code: ''
  })
  const queryClient = useQueryClient()

  const { data: rubrics = [], isLoading } = useQuery({
    queryKey: ['payroll-rubrics'],
    queryFn: fetchPayrollRubrics,
  })

  const createMutation = useMutation({
    mutationFn: createPayrollRubric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-rubrics'] })
      setShowForm(false)
      setFormData({ name: '', description: '', type: 'discount', code: '' })
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updatePayrollRubric(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-rubrics'] })
      setEditingRubric(null)
      setFormData({ name: '', description: '', type: 'discount', code: '' })
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deletePayrollRubric,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-rubrics'] })
    }
  })

  const handleEdit = (rubric: PayrollRubric) => {
    setEditingRubric(rubric)
    setFormData({ 
      name: rubric.name, 
      description: rubric.description || '', 
      type: rubric.type,
      code: rubric.code || ''
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingRubric(null)
    setFormData({ name: '', description: '', type: 'discount', code: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação adicional no frontend
    if (!formData.name.trim()) {
      alert('Nome da rubrica é obrigatório')
      return
    }
    
    if (!formData.type) {
      alert('Tipo da rubrica é obrigatório')
      return
    }
    
    console.log('Submitting rubric data:', formData)
    
    if (editingRubric) {
      updateMutation.mutate({
        id: editingRubric.id,
        data: formData
      })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    setRubricToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (rubricToDelete) {
      deleteMutation.mutate(rubricToDelete)
      setShowDeleteModal(false)
      setRubricToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setRubricToDelete(null)
  }

  const discountRubrics = rubrics.filter((r: PayrollRubric) => r.type === 'discount')
  const benefitRubrics = rubrics.filter((r: PayrollRubric) => r.type === 'benefit')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Rubricas de Holerite
            </CardTitle>
            <CardDescription>
              Gerencie as rubricas padrão para descontos e benefícios
            </CardDescription>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Rubrica
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm || editingRubric ? (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-muted/50">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome da Rubrica *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Plano de Saúde, Vale Alimentação"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'discount' | 'benefit') => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="discount">Desconto</SelectItem>
                    <SelectItem value="benefit">Benefício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ex: 2801, 3405"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição opcional"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {editingRubric ? 'Atualizar' : 'Criar'}
              </Button>
              <Button type="button" variant="outline" onClick={handleCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </form>
        ) : null}

        <div className="space-y-6 mt-6">
          {/* Descontos */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-red-600">Descontos</h3>
            <div className="space-y-2">
              {discountRubrics.map((rubric: PayrollRubric) => (
                <div
                  key={rubric.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rubric.name}</h4>
                      {rubric.code && (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {rubric.code}
                        </span>
                      )}
                    </div>
                    {rubric.description && (
                      <p className="text-sm text-muted-foreground">{rubric.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(rubric)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(rubric.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {discountRubrics.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum desconto encontrado
                </div>
              )}
            </div>
          </div>

          {/* Benefícios */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-green-600">Benefícios</h3>
            <div className="space-y-2">
              {benefitRubrics.map((rubric: PayrollRubric) => (
                <div
                  key={rubric.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{rubric.name}</h4>
                      {rubric.code && (
                        <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                          {rubric.code}
                        </span>
                      )}
                    </div>
                    {rubric.description && (
                      <p className="text-sm text-muted-foreground">{rubric.description}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEdit(rubric)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDelete(rubric.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {benefitRubrics.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  Nenhum benefício encontrado
                </div>
              )}
            </div>
          </div>
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
                  Tem certeza que deseja desativar esta rubrica? Esta ação não pode ser desfeita.
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
              Desativar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}