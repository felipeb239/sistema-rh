'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { Receipt, Employee, ReceiptType } from '@/types'

interface ReceiptFormProps {
  receipt?: Receipt | null
  employees: Employee[]
  onClose: () => void
}

async function fetchReceiptTypes() {
  const response = await fetch('/api/receipt-types')
  if (!response.ok) {
    throw new Error('Failed to fetch receipt types')
  }
  return response.json()
}

async function createReceipt(data: Partial<Receipt>) {
  const response = await fetch('/api/receipts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create receipt')
  }
  return response.json()
}

async function updateReceipt(id: string, data: Partial<Receipt>) {
  const response = await fetch(`/api/receipts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update receipt')
  }
  return response.json()
}

export function ReceiptForm({ receipt, employees, onClose }: ReceiptFormProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    typeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    dailyValue: '',
    days: '22'
  })

  const queryClient = useQueryClient()

  const { data: receiptTypes = [] } = useQuery({
    queryKey: ['receipt-types'],
    queryFn: fetchReceiptTypes,
  })

  useEffect(() => {
    if (receipt) {
      console.log('📋 ReceiptForm - Recebendo recibo para edição:', receipt)
      setFormData({
        employeeId: receipt.employeeId || '',
        typeId: receipt.typeId || '',
        month: receipt.month,
        year: receipt.year,
        dailyValue: receipt.dailyValue?.toString() || '',
        days: receipt.days?.toString() || '22'
      })
      console.log('📋 ReceiptForm - FormData preenchido:', {
        employeeId: receipt.employeeId || '',
        typeId: receipt.typeId || '',
        month: receipt.month,
        year: receipt.year,
        dailyValue: receipt.dailyValue?.toString() || '',
        days: receipt.days?.toString() || '22'
      })
    }
  }, [receipt])

  const createMutation = useMutation({
    mutationFn: createReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      onClose() // Notificar que dados foram alterados
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Receipt>) => updateReceipt(receipt!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      onClose() // Não precisa voltar à primeira página para edição
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const dailyValue = parseFloat(formData.dailyValue) || 0
    const days = parseInt(formData.days) || 0
    const value = dailyValue * days

    const submitData = {
      ...formData,
      dailyValue,
      days,
      value
    }

    if (receipt) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const calculateTotal = () => {
    const dailyValue = parseFloat(formData.dailyValue) || 0
    const days = parseInt(formData.days) || 0
    return dailyValue * days
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {receipt ? 'Editar Recibo' : 'Novo Recibo'}
          </h1>
          <p className="text-muted-foreground">
            {receipt ? 'Atualize as informações do recibo' : 'Preencha os dados do novo recibo'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Recibo</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Funcionário *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) => handleChange('employeeId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="typeId">Tipo de Recibo *</Label>
                <Select
                  value={formData.typeId}
                  onValueChange={(value) => handleChange('typeId', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {receiptTypes.map((type: ReceiptType) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month">Mês *</Label>
                <Select
                  value={formData.month.toString()}
                  onValueChange={(value) => handleChange('month', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o mês" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <SelectItem key={month} value={month.toString()}>
                        {month}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Ano *</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleChange('year', e.target.value)}
                  required
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyValue">Valor Diário *</Label>
                <Input
                  id="dailyValue"
                  type="number"
                  step="0.01"
                  value={formData.dailyValue}
                  onChange={(e) => handleChange('dailyValue', e.target.value)}
                  required
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="days">Quantidade de Dias *</Label>
                <Input
                  id="days"
                  type="number"
                  value={formData.days}
                  onChange={(e) => handleChange('days', e.target.value)}
                  required
                  placeholder="22"
                />
              </div>
            </div>

            {/* Cálculo do total */}
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor Total:</span>
                <span className="text-lg font-bold">
                  R$ {calculateTotal().toFixed(2).replace('.', ',')}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {formData.dailyValue} × {formData.days} dias
              </p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Salvando...' : receipt ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
