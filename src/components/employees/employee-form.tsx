'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Save } from 'lucide-react'
import { Employee } from '@/types'

interface EmployeeFormProps {
  employee?: Employee | null
  onClose: () => void
}

async function createEmployee(data: Partial<Employee>) {
  const response = await fetch('/api/employees', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create employee')
  }
  return response.json()
}

async function updateEmployee(id: string, data: Partial<Employee>) {
  const response = await fetch(`/api/employees/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update employee')
  }
  return response.json()
}

export function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    position: '',
    department: '',
    cbo: '',
    hireDate: '',
    salary: ''
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        cpf: employee.cpf || '',
        position: employee.position || '',
        department: employee.department || '',
        cbo: employee.cbo || '',
        hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
        salary: employee.salary?.toString() || ''
      })
    }
  }, [employee])

  const createMutation = useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Employee>) => updateEmployee(employee!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      onClose()
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      salary: formData.salary ? parseFloat(unformatSalary(formData.salary)) : undefined,
      hireDate: formData.hireDate ? new Date(formData.hireDate) : undefined
    }

    if (employee) {
      updateMutation.mutate(submitData)
    } else {
      createMutation.mutate(submitData)
    }
  }

  // Função para aplicar máscara de CPF
  const formatCPF = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    // Aplica a máscara: 000.000.000-00
    if (numbers.length <= 3) {
      return numbers
    } else if (numbers.length <= 6) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3)}`
    } else if (numbers.length <= 9) {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`
    } else {
      return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9, 11)}`
    }
  }

  // Função para aplicar máscara de salário (formato brasileiro)
  const formatSalary = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '')
    
    if (numbers.length === 0) return ''
    
    // Converte para centavos e formata
    const cents = parseInt(numbers)
    const real = cents / 100
    
    // Formata com separador de milhares e decimais
    return real.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Função para remover formatação do salário
  const unformatSalary = (value: string) => {
    return value.replace(/\./g, '').replace(',', '.')
  }

  const handleChange = (field: string, value: string) => {
    let formattedValue = value
    
    if (field === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (field === 'salary') {
      formattedValue = formatSalary(value)
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }))
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
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h1>
          <p className="text-muted-foreground">
            {employee ? 'Atualize as informações do funcionário' : 'Preencha os dados do novo funcionário'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Funcionário</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  placeholder="Digite o nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => handleChange('position', e.target.value)}
                  placeholder="Digite o cargo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleChange('department', e.target.value)}
                  placeholder="Digite o departamento"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cbo">CBO</Label>
                <Input
                  id="cbo"
                  value={formData.cbo}
                  onChange={(e) => handleChange('cbo', e.target.value)}
                  placeholder="Digite o código CBO"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hireDate">Data de Admissão</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleChange('hireDate', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salário</Label>
                <Input
                  id="salary"
                  type="text"
                  value={formData.salary}
                  onChange={(e) => handleChange('salary', e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Salvando...' : employee ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
