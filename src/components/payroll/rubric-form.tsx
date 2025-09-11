'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  DollarSign,
  Percent,
  Calendar,
  Save,
  X
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Employee {
  id: string
  name: string
  position?: string
  department?: string
  salary: number
}

interface PayrollRubric {
  id: string
  name: string
  type: string
  code?: string
  isActive: boolean
}

interface EmployeeRubric {
  id: string
  customName?: string
  customValue?: number
  customPercentage?: number
  isActive: boolean
  startDate?: string
  endDate?: string
  rubric: {
    id: string
    name: string
    type: string
    code?: string
  }
}

interface RubricFormProps {
  employee: Employee
  availableRubrics: PayrollRubric[]
  existingRubric?: EmployeeRubric | null
  onSave: () => void
  onCancel: () => void
}

export function RubricForm({ employee, availableRubrics, existingRubric, onSave, onCancel }: RubricFormProps) {
  const [selectedRubricId, setSelectedRubricId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customValue, setCustomValue] = useState('')
  const [customPercentage, setCustomPercentage] = useState('')
  const [isActive, setIsActive] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const selectedRubric = availableRubrics.find(r => r.id === selectedRubricId)

  // Preencher campos quando estiver editando
  useEffect(() => {
    if (existingRubric) {
      setSelectedRubricId(existingRubric.rubric.id)
      setCustomName(existingRubric.customName || '')
      setCustomValue(existingRubric.customValue?.toString() || '')
      setCustomPercentage(existingRubric.customPercentage?.toString() || '')
      setIsActive(existingRubric.isActive)
      setStartDate(existingRubric.startDate ? new Date(existingRubric.startDate).toISOString().split('T')[0] : '')
      setEndDate(existingRubric.endDate ? new Date(existingRubric.endDate).toISOString().split('T')[0] : '')
    } else {
      // Limpar campos para nova rubrica
      setSelectedRubricId('')
      setCustomName('')
      setCustomValue('')
      setCustomPercentage('')
      setIsActive(true)
      setStartDate('')
      setEndDate('')
    }
  }, [existingRubric])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedRubricId) {
      alert('Selecione uma rubrica')
      return
    }

    setIsSaving(true)
    try {
      const url = existingRubric 
        ? `/api/employees/${employee.id}/rubrics/${existingRubric.rubric.id}`
        : `/api/employees/${employee.id}/rubrics`
      
      const method = existingRubric ? 'PUT' : 'POST'
      
      const body = existingRubric 
        ? {
            customName: customName || undefined,
            customValue: customValue ? parseFloat(customValue) : undefined,
            customPercentage: customPercentage ? parseFloat(customPercentage) : undefined,
            isActive,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }
        : {
            rubricId: selectedRubricId,
            customName: customName || undefined,
            customValue: customValue ? parseFloat(customValue) : undefined,
            customPercentage: customPercentage ? parseFloat(customPercentage) : undefined,
            isActive,
            startDate: startDate || undefined,
            endDate: endDate || undefined
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || error.message || 'Erro ao salvar rubrica')
      }

      onSave()
    } catch (error) {
      console.error('Erro ao salvar rubrica:', error)
      alert(error instanceof Error ? error.message : 'Erro ao salvar rubrica')
    } finally {
      setIsSaving(false)
    }
  }

  const calculateValue = () => {
    if (customPercentage && employee.salary) {
      const percentage = parseFloat(customPercentage) / 100
      return formatCurrency(employee.salary * percentage)
    }
    return ''
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Seleção da Rubrica */}
      <div className="space-y-2">
        <Label htmlFor="rubric">Rubrica</Label>
        <Select value={selectedRubricId} onValueChange={setSelectedRubricId}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione uma rubrica" />
          </SelectTrigger>
          <SelectContent>
            {availableRubrics.map((rubric) => (
              <SelectItem key={rubric.id} value={rubric.id}>
                <div className="flex items-center space-x-2">
                  <span>{rubric.name}</span>
                  {rubric.code && (
                    <span className="text-xs text-muted-foreground">({rubric.code})</span>
                  )}
                  <span className={`text-xs px-1 py-0.5 rounded ${
                    rubric.type === 'benefit' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {rubric.type === 'benefit' ? 'Benefício' : 'Desconto'}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nome Personalizado */}
      <div className="space-y-2">
        <Label htmlFor="customName">Nome Personalizado (opcional)</Label>
        <Input
          id="customName"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          placeholder="Ex: Plano de Saúde Empresa X"
        />
      </div>

      {/* Valor ou Percentual */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customValue">Valor Fixo</Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="customValue"
              type="number"
              step="0.01"
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              placeholder="0,00"
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="customPercentage">Percentual</Label>
          <div className="relative">
            <Percent className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="customPercentage"
              type="number"
              step="0.01"
              value={customPercentage}
              onChange={(e) => setCustomPercentage(e.target.value)}
              placeholder="0,00"
              className="pl-10"
            />
          </div>
          {customPercentage && (
            <p className="text-xs text-muted-foreground">
              Valor calculado: {calculateValue()}
            </p>
          )}
        </div>
      </div>

      {/* Datas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Data de Início</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="endDate">Data de Fim (opcional)</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Status Ativo */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked as boolean)}
        />
        <Label htmlFor="isActive">Rubrica ativa</Label>
      </div>

      {/* Ações */}
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSaving}
        >
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving || !selectedRubricId}
        >
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {existingRubric ? 'Atualizando...' : 'Salvando...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {existingRubric ? 'Atualizar Rubrica' : 'Salvar Rubrica'}
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
