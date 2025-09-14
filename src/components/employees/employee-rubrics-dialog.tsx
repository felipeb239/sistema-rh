'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmployeeRubric, PayrollRubric } from '@/types'
import { Settings, Plus, Edit, Trash2, Check, X } from 'lucide-react'

interface EmployeeRubricsDialogProps {
  employeeId: string
  employeeName: string
  onRubricChange?: () => void
}

interface RubricFormData {
  rubricId: string
  customName: string
  customValue: string
  customPercentage: string
  startDate: string
  endDate: string
}

export function EmployeeRubricsDialog({ 
  employeeId, 
  employeeName, 
  onRubricChange 
}: EmployeeRubricsDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [appliedRubrics, setAppliedRubrics] = useState<EmployeeRubric[]>([])
  const [availableRubrics, setAvailableRubrics] = useState<PayrollRubric[]>([])
  const [loading, setLoading] = useState(false)
  const [editingRubric, setEditingRubric] = useState<string | null>(null)
  const [formData, setFormData] = useState<RubricFormData>({
    rubricId: '',
    customName: '',
    customValue: '',
    customPercentage: '',
    startDate: '',
    endDate: ''
  })

  const fetchRubrics = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${employeeId}/rubrics`)
      const data = await response.json()
      
      if (response.ok) {
        setAppliedRubrics(data.appliedRubrics || [])
        setAvailableRubrics(data.availableRubrics || [])
      }
    } catch (error) {
      console.error('Erro ao buscar rubricas:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchRubrics()
    }
  }, [isOpen, employeeId])

  const handleAddRubric = async () => {
    if (!formData.rubricId || (!formData.customValue && !formData.customPercentage)) {
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${employeeId}/rubrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rubricId: formData.rubricId,
          customName: formData.customName,
          customValue: formData.customValue ? parseFloat(formData.customValue) : null,
          customPercentage: formData.customPercentage ? parseFloat(formData.customPercentage) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      })

      if (response.ok) {
        await fetchRubrics()
        onRubricChange?.()
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao adicionar rubrica:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRubric = async (rubricId: string) => {
    const rubric = appliedRubrics.find(r => r.rubricId === rubricId)
    if (!rubric) return

    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${employeeId}/rubrics/${rubricId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customName: formData.customName,
          customValue: formData.customValue ? parseFloat(formData.customValue) : null,
          customPercentage: formData.customPercentage ? parseFloat(formData.customPercentage) : null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        }),
      })

      if (response.ok) {
        await fetchRubrics()
        onRubricChange?.()
        setEditingRubric(null)
        resetForm()
      }
    } catch (error) {
      console.error('Erro ao atualizar rubrica:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRubric = async (rubricId: string) => {
    if (!confirm('Tem certeza que deseja remover esta rubrica?')) return

    try {
      setLoading(true)
      const response = await fetch(`/api/employees/${employeeId}/rubrics/${rubricId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchRubrics()
        onRubricChange?.()
      }
    } catch (error) {
      console.error('Erro ao remover rubrica:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      rubricId: '',
      customName: '',
      customValue: '',
      customPercentage: '',
      startDate: '',
      endDate: ''
    })
  }

  const startEdit = (rubric: EmployeeRubric) => {
    setEditingRubric(rubric.rubricId)
    setFormData({
      rubricId: rubric.rubricId,
      customName: rubric.customName || '',
      customValue: rubric.customValue?.toString() || '',
      customPercentage: rubric.customPercentage?.toString() || '',
      startDate: rubric.startDate ? new Date(rubric.startDate).toISOString().split('T')[0] : '',
      endDate: rubric.endDate ? new Date(rubric.endDate).toISOString().split('T')[0] : ''
    })
  }

  const cancelEdit = () => {
    setEditingRubric(null)
    resetForm()
  }

  const selectedRubric = availableRubrics.find(r => r.id === formData.rubricId)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
          Rubricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Rubricas - {employeeName}</DialogTitle>
          <DialogDescription>
            Adicione, edite ou remova rubricas específicas para este funcionário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Formulário para adicionar nova rubrica */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="text-lg font-semibold">Adicionar Nova Rubrica</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rubricId">Rubrica</Label>
                <Select value={formData.rubricId} onValueChange={(value) => setFormData(prev => ({ ...prev, rubricId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma rubrica" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableRubrics.map((rubric) => (
                      <SelectItem key={rubric.id} value={rubric.id}>
                        {rubric.name} ({rubric.type === 'proventos' ? 'Proventos' : 'Desconto'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customName">Nome Personalizado (opcional)</Label>
                <Input
                  id="customName"
                  value={formData.customName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                  placeholder="Deixe vazio para usar o nome padrão"
                />
              </div>

              <div>
                <Label htmlFor="customValue">Valor Fixo (R$)</Label>
                <Input
                  id="customValue"
                  type="number"
                  step="0.01"
                  value={formData.customValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, customValue: e.target.value, customPercentage: '' }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="customPercentage">Percentual (%)</Label>
                <Input
                  id="customPercentage"
                  type="number"
                  step="0.01"
                  value={formData.customPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, customPercentage: e.target.value, customValue: '' }))}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="startDate">Data de Início (opcional)</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">Data de Fim (opcional)</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleAddRubric} 
                disabled={loading || !formData.rubricId || (!formData.customValue && !formData.customPercentage)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>
          </div>

          {/* Lista de rubricas aplicadas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rubricas Aplicadas</h3>
            
            {appliedRubrics.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Nenhuma rubrica aplicada</p>
            ) : (
              <div className="space-y-2">
                {appliedRubrics.map((rubric) => (
                  <div key={rubric.id} className="border rounded-lg p-4">
                    {editingRubric === rubric.rubricId ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Nome Personalizado</Label>
                            <Input
                              value={formData.customName}
                              onChange={(e) => setFormData(prev => ({ ...prev, customName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Valor Fixo (R$)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.customValue}
                              onChange={(e) => setFormData(prev => ({ ...prev, customValue: e.target.value, customPercentage: '' }))}
                            />
                          </div>
                          <div>
                            <Label>Percentual (%)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={formData.customPercentage}
                              onChange={(e) => setFormData(prev => ({ ...prev, customPercentage: e.target.value, customValue: '' }))}
                            />
                          </div>
                          <div>
                            <Label>Data de Início</Label>
                            <Input
                              type="date"
                              value={formData.startDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label>Data de Fim</Label>
                            <Input
                              type="date"
                              value={formData.endDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={cancelEdit}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                          </Button>
                          <Button 
                            onClick={() => handleUpdateRubric(rubric.rubricId)}
                            disabled={loading || (!formData.customValue && !formData.customPercentage)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Salvar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium">
                              {rubric.customName || rubric.rubric?.name}
                            </h4>
                            <Badge variant={rubric.rubric?.type === 'proventos' ? 'success' : 'destructive'}>
                              {rubric.rubric?.type === 'proventos' ? 'Proventos' : 'Desconto'}
                            </Badge>
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {rubric.customValue ? (
                              <>Valor: R$ {Number(rubric.customValue).toFixed(2)}</>
                            ) : (
                              <>Percentual: {(Number(rubric.customPercentage) * 100).toFixed(2)}%</>
                            )}
                          </div>
                          {(rubric.startDate || rubric.endDate) && (
                            <div className="text-xs text-gray-500 mt-1">
                              {rubric.startDate && `Início: ${new Date(rubric.startDate).toLocaleDateString()}`}
                              {rubric.startDate && rubric.endDate && ' - '}
                              {rubric.endDate && `Fim: ${new Date(rubric.endDate).toLocaleDateString()}`}
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(rubric)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteRubric(rubric.rubricId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
