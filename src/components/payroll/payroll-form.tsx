'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save } from 'lucide-react'
import { Payroll, Employee, PayrollRubric } from '@/types'
import { ApplyRubricsDialog } from './apply-rubrics-dialog'
import { CopyRubricsDialog } from './copy-rubrics-dialog'
import { EmployeeRubricsDisplay } from './employee-rubrics-display'

interface PayrollFormProps {
  payroll?: Payroll | null
  onClose: () => void
}

async function fetchEmployees() {
  const response = await fetch('/api/employees')
  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }
  return response.json()
}

async function createPayroll(data: Partial<Payroll>) {
  const response = await fetch('/api/payroll', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to create payroll')
  }
  return response.json()
}

async function updatePayroll(id: string, data: Partial<Payroll>) {
  const response = await fetch(`/api/payroll/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update payroll')
  }
  return response.json()
}

export function PayrollForm({ payroll, onClose }: PayrollFormProps) {
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: '',
    inssDiscount: '',
    irrfDiscount: '',
    healthInsurance: '',
    dentalInsurance: '',
    customDiscount: '',
    customDiscountDescription: '',
    fgtsAmount: ''
  })

  const queryClient = useQueryClient()

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })

  useEffect(() => {
    if (payroll) {
      setFormData({
        employeeId: payroll.employeeId || '',
        month: payroll.month,
        year: payroll.year,
        baseSalary: payroll.baseSalary?.toString() || '',
        inssDiscount: payroll.inssDiscount?.toString() || '',
        irrfDiscount: payroll.irrfDiscount?.toString() || '',
        healthInsurance: payroll.healthInsurance?.toString() || '',
        dentalInsurance: payroll.dentalInsurance?.toString() || '',
        customDiscount: payroll.customDiscount?.toString() || '',
        customDiscountDescription: payroll.customDiscountDescription || '',
        fgtsAmount: payroll.fgtsAmount?.toString() || ''
      })
    }
  }, [payroll])

  // FGTS agora é preenchido manualmente

  // Cálculos automáticos removidos - preenchimento manual

  const createMutation = useMutation({
    mutationFn: createPayroll,
    onSuccess: (data) => {
      console.log('Payroll created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error creating payroll:', error)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Payroll>) => updatePayroll(payroll!.id, data),
    onSuccess: (data) => {
      console.log('Payroll updated successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
      onClose()
    },
    onError: (error) => {
      console.error('Error updating payroll:', error)
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('Submitting payroll data:', formData)
    
    const submitData = {
      ...formData,
      baseSalary: parseFloat(formData.baseSalary) || 0,
      inssDiscount: parseFloat(formData.inssDiscount) || 0,
      irrfDiscount: parseFloat(formData.irrfDiscount) || 0,
      healthInsurance: parseFloat(formData.healthInsurance) || 0,
      dentalInsurance: parseFloat(formData.dentalInsurance) || 0,
      customDiscount: parseFloat(formData.customDiscount) || 0,
      fgtsAmount: parseFloat(formData.fgtsAmount) || 0
    }

    console.log('Processed submit data:', submitData)

    if (payroll) {
      console.log('Updating payroll...')
      updateMutation.mutate(submitData)
    } else {
      console.log('Creating payroll...')
      createMutation.mutate(submitData)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      }
      
      // Se o campo alterado for employeeId, preencher automaticamente o salário base
      if (field === 'employeeId' && value) {
        const selectedEmployee = employees.find((emp: Employee) => emp.id === value)
        if (selectedEmployee && selectedEmployee.salary) {
          newData.baseSalary = selectedEmployee.salary.toString()
        }
      }
      
      return newData
    })
  }

  const handleApplyRubrics = (rubrics: PayrollRubric[]) => {
    // Aplicar as rubricas selecionadas aos campos do formulário
    let updatedData = { ...formData }
    
    rubrics.forEach(rubric => {
      if (rubric.type === 'discount') {
        // Aplicar descontos baseados no nome da rubrica
        switch (rubric.name.toLowerCase()) {
          case 'inss':
            // Manter o valor calculado automaticamente se estiver habilitado
            if (!formData.autoCalculateTaxes) {
              updatedData.inssDiscount = '0'
            }
            break
          case 'irrf':
            updatedData.irrfDiscount = '0'
            break
          case 'plano de saúde':
            updatedData.healthInsurance = '0'
            break
          case 'plano odontológico':
            updatedData.dentalInsurance = '0'
            break
          case 'outros descontos':
            updatedData.otherDiscounts = '0'
            break
        }
      } else if (rubric.type === 'proventos') {
        // Aplicar benefícios baseados no nome da rubrica
        switch (rubric.name.toLowerCase()) {
          case 'plano de saúde':
            updatedData.healthInsurance = '0'
            break
          case 'plano odontológico':
            updatedData.dentalInsurance = '0'
            break
        }
      }
    })
    
    setFormData(updatedData)
  }

  const handleCopyRubrics = async (fromEmployeeId: string) => {
    try {
      // Buscar o holerite mais recente do funcionário selecionado
      const response = await fetch(`/api/payroll?employeeId=${fromEmployeeId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch payrolls')
      }
      const payrolls = await response.json()
      
      if (payrolls.length > 0) {
        const latestPayroll = payrolls[0]
        
        // Copiar os valores das rubricas
        setFormData(prev => ({
          ...prev,
          inssDiscount: latestPayroll.inssDiscount?.toString() || '0',
          irrfDiscount: latestPayroll.irrfDiscount?.toString() || '0',
          healthInsurance: latestPayroll.healthInsurance?.toString() || '0',
          dentalInsurance: latestPayroll.dentalInsurance?.toString() || '0',
          customDiscount: latestPayroll.customDiscount?.toString() || '0',
          customDiscountDescription: latestPayroll.customDiscountDescription || '',
        }))
      }
    } catch (error) {
      console.error('Error copying rubrics:', error)
    }
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
            {payroll ? 'Editar Holerite' : 'Novo Holerite'}
          </h1>
          <p className="text-muted-foreground">
            {payroll ? 'Atualize as informações do holerite' : 'Preencha os dados do novo holerite'}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Holerite</CardTitle>
          <CardDescription>
            Preencha todos os campos obrigatórios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Funcionário *</Label>
                <div className="flex gap-2">
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => handleChange('employeeId', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o funcionário" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: Employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formData.employeeId && (
                    <div className="flex space-x-2">
                      <ApplyRubricsDialog
                        employeeId={formData.employeeId}
                        employeeName={employees.find((emp: any) => emp.id === formData.employeeId)?.name || ''}
                        onApply={handleApplyRubrics}
                      />
                      <CopyRubricsDialog
                        currentEmployeeId={formData.employeeId}
                        onCopy={handleCopyRubrics}
                      />
                    </div>
                  )}
                </div>
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
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="baseSalary">Salário Base *</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  step="0.01"
                  value={formData.baseSalary}
                  readOnly
                  className="bg-muted cursor-not-allowed"
                  placeholder="Selecione um funcionário"
                />
                <p className="text-xs text-muted-foreground">
                  Preenchido automaticamente com o salário do funcionário
                </p>
              </div>



              <div className="space-y-2">
                <Label htmlFor="inssDiscount">Desconto INSS</Label>
                <Input
                  id="inssDiscount"
                  type="number"
                  step="0.01"
                  value={formData.inssDiscount}
                  onChange={(e) => handleChange('inssDiscount', e.target.value)}
                  placeholder="0,00"
                  readOnly={formData.autoCalculateTaxes}
                  className={formData.autoCalculateTaxes ? "bg-muted cursor-not-allowed" : ""}
                />
                {formData.autoCalculateTaxes && (
                  <p className="text-xs text-muted-foreground">
                    Calculado automaticamente baseado nas tabelas de {new Date().getFullYear()}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="irrfDiscount">Desconto IRRF</Label>
                <Input
                  id="irrfDiscount"
                  type="number"
                  step="0.01"
                  value={formData.irrfDiscount}
                  onChange={(e) => handleChange('irrfDiscount', e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Preenchido manualmente conforme necessário
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="healthInsurance">Plano de Saúde</Label>
                <Input
                  id="healthInsurance"
                  type="number"
                  step="0.01"
                  value={formData.healthInsurance}
                  onChange={(e) => handleChange('healthInsurance', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dentalInsurance">Plano Odontológico</Label>
                <Input
                  id="dentalInsurance"
                  type="number"
                  step="0.01"
                  value={formData.dentalInsurance}
                  onChange={(e) => handleChange('dentalInsurance', e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDiscountDescription">Descrição do Desconto Personalizado</Label>
                <Input
                  id="customDiscountDescription"
                  type="text"
                  value={formData.customDiscountDescription}
                  onChange={(e) => handleChange('customDiscountDescription', e.target.value)}
                  placeholder="Ex: Empréstimo Consignado Parcela 1/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customDiscount">Valor do Desconto Personalizado</Label>
                <Input
                  id="customDiscount"
                  type="number"
                  step="0.01"
                  value={formData.customDiscount}
                  onChange={(e) => handleChange('customDiscount', e.target.value)}
                  placeholder="0,00"
                />
                <p className="text-xs text-muted-foreground">
                  Ex: Empréstimo consignado, desconto CLT, etc.
                </p>
              </div>


              <div className="space-y-2">
                <Label htmlFor="fgtsAmount">FGTS (8%)</Label>
                <Input
                  id="fgtsAmount"
                  type="number"
                  step="0.01"
                  value={formData.fgtsAmount || ''}
                  onChange={(e) => handleChange('fgtsAmount', e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-muted-foreground">
                  Preenchido manualmente conforme necessário
                </p>
              </div>

              {/* Rubricas Específicas do Funcionário */}
              {formData.employeeId && (
                <div className="col-span-2">
                  <EmployeeRubricsDisplay
                    employeeId={formData.employeeId}
                    baseSalary={Number(formData.baseSalary) || 0}
                    month={Number(formData.month)}
                    year={Number(formData.year)}
                    showTotals={true}
                  />
                </div>
              )}


            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Salvando...' : payroll ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

