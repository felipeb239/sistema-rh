'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Employee {
  id: string
  name: string
  position?: string
  department?: string
}

interface AddLoanDialogProps {
  onLoanAdded?: () => void
}

export function AddLoanDialog({ onLoanAdded }: AddLoanDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [loanName, setLoanName] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [installmentValue, setInstallmentValue] = useState('')
  const [totalInstallments, setTotalInstallments] = useState('')
  const [currentInstallment, setCurrentInstallment] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const queryClient = useQueryClient()

  // Buscar funcionários ativos
  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Erro ao buscar funcionários')
      return response.json()
    }
  })

  // Buscar rubricas de desconto
  const { data: discountRubrics = [] } = useQuery({
    queryKey: ['payroll-rubrics', 'discount'],
    queryFn: async () => {
      const response = await fetch('/api/payroll-rubrics')
      if (!response.ok) throw new Error('Erro ao buscar rubricas')
      const rubrics = await response.json()
      return rubrics.filter((r: any) => r.type === 'discount')
    }
  })

  // Buscar ou criar rubrica "Empréstimo CLT"
  const loanRubric = discountRubrics.find((r: any) => 
    r.name.toLowerCase().includes('empréstimo') || r.name.toLowerCase().includes('emprestimo')
  )

  const calculateInstallmentValue = () => {
    // Se o valor da parcela foi informado, usar ele
    if (installmentValue) {
      return parseFloat(installmentValue.replace(',', '.')).toFixed(2)
    }
    // Senão, calcular baseado no valor total
    if (totalAmount && totalInstallments) {
      const amount = parseFloat(totalAmount.replace(',', '.'))
      const installments = parseInt(totalInstallments)
      return (amount / installments).toFixed(2)
    }
    return '0,00'
  }

  const calculateTotalAmount = () => {
    // Se valor da parcela e total de parcelas foram informados, calcular o total
    if (installmentValue && totalInstallments) {
      const value = parseFloat(installmentValue.replace(',', '.'))
      const installments = parseInt(totalInstallments)
      return (value * installments).toFixed(2)
    }
    // Senão, usar o valor total informado
    return totalAmount || '0,00'
  }

  const calculateRemainingAmount = () => {
    const total = parseFloat(calculateTotalAmount().replace(',', '.'))
    const current = parseInt(currentInstallment)
    const installments = parseInt(totalInstallments)
    const value = parseFloat(calculateInstallmentValue().replace(',', '.'))
    
    if (total && current && installments && value) {
      return Math.max(0, total - ((current - 1) * value)).toFixed(2)
    }
    return total || '0,00'
  }

  const handleSubmit = async () => {
    if (!selectedEmployeeId || !loanName || !totalInstallments || !currentInstallment) {
      alert('Preencha todos os campos obrigatórios')
      return
    }

    // Verificar se pelo menos um dos valores (total ou parcela) foi informado
    if (!totalAmount && !installmentValue) {
      alert('Informe o valor total ou o valor da parcela')
      return
    }

    const amount = parseFloat(calculateTotalAmount().replace(',', '.'))
    const installments = parseInt(totalInstallments)
    const current = parseInt(currentInstallment)
    const value = parseFloat(calculateInstallmentValue().replace(',', '.'))
    
    if (amount <= 0 || installments <= 0 || current <= 0 || current > installments || value <= 0) {
      alert('Valores inválidos')
      return
    }

    const remainingAmount = Math.max(0, amount - ((current - 1) * value))

    // Criar customName com informações do empréstimo
    const customName = `${loanName} - ${formatCurrency(amount)} - Parcela ${current}/${installments} - Restante: ${formatCurrency(remainingAmount)}`

    setIsCreating(true)

    try {
      // Primeiro, criar a rubrica "Empréstimo CLT" se não existir
      let rubricId = loanRubric?.id

      console.log('🔍 Rubrica existente:', loanRubric)
      console.log('🔍 RubricId atual:', rubricId)

      if (!rubricId) {
        console.log('📝 Criando nova rubrica "Empréstimo CLT"')
        const rubricResponse = await fetch('/api/payroll-rubrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Empréstimo CLT',
            description: 'Empréstimo consignado CLT',
            type: 'discount',
            code: 'EMP-CLT'
          }),
        })

        if (!rubricResponse.ok) {
          const errorText = await rubricResponse.text()
          console.log('❌ Erro ao criar rubrica:', errorText)
          throw new Error('Erro ao criar rubrica de empréstimo')
        }

        const newRubric = await rubricResponse.json()
        rubricId = newRubric.id
        console.log('✅ Rubrica criada com sucesso:', newRubric)
      }

      // Aplicar rubrica ao funcionário
      console.log('📝 Aplicando rubrica ao funcionário:', {
        rubricId,
        customName,
        customValue: installmentValue
      })

      const response = await fetch(`/api/employees/${selectedEmployeeId}/rubrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rubricId,
          customName,
          customValue: value,
          isActive: true
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.log('❌ Erro ao aplicar rubrica:', errorText)
        throw new Error('Erro ao criar empréstimo')
      }

      console.log('✅ Empréstimo criado com sucesso!')

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      
      // Limpar formulário
      setSelectedEmployeeId('')
      setLoanName('')
      setTotalAmount('')
      setInstallmentValue('')
      setTotalInstallments('')
      setCurrentInstallment('')
      setOpen(false)

      if (onLoanAdded) {
        onLoanAdded()
      }

      alert('Empréstimo criado com sucesso!')
    } catch (error) {
      console.error('Erro ao criar empréstimo:', error)
      alert('Erro ao criar empréstimo. Tente novamente.')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Empréstimo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Criar Empréstimo</span>
          </DialogTitle>
          <DialogDescription>
            Adicione um novo empréstimo parcelado para um funcionário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="employee">Funcionário *</Label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee: Employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position || 'Sem cargo'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="loanName">Nome do Empréstimo *</Label>
            <Input
              id="loanName"
              value={loanName}
              onChange={(e) => setLoanName(e.target.value)}
              placeholder="Ex: Empréstimo CLT, Consignado, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalAmount">Valor Total</Label>
              <Input
                id="totalAmount"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="5000,00"
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Ou informe o valor da parcela abaixo
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="installmentValue">Valor da Parcela</Label>
              <Input
                id="installmentValue"
                value={installmentValue}
                onChange={(e) => setInstallmentValue(e.target.value)}
                placeholder="416,67"
                type="text"
              />
              <p className="text-xs text-muted-foreground">
                Será calculado automaticamente se não informado
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">Total Parcelas *</Label>
              <Input
                id="totalInstallments"
                value={totalInstallments}
                onChange={(e) => setTotalInstallments(e.target.value)}
                placeholder="12"
                type="number"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currentInstallment">Parcela Atual *</Label>
              <Input
                id="currentInstallment"
                value={currentInstallment}
                onChange={(e) => setCurrentInstallment(e.target.value)}
                placeholder="4"
                type="number"
                min="1"
                max={totalInstallments || undefined}
              />
            </div>
          </div>

          {(totalAmount || installmentValue) && totalInstallments && currentInstallment && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium text-muted-foreground mb-1">
                Resumo do Empréstimo:
              </div>
              <div className="text-sm space-y-1">
                <div>Valor por parcela: <strong>{formatCurrency(parseFloat(calculateInstallmentValue()))}</strong></div>
                <div>Parcela atual: <strong>{currentInstallment}/{totalInstallments}</strong></div>
                <div>Valor restante: <strong>{formatCurrency(parseFloat(calculateRemainingAmount()))}</strong></div>
                <div>Valor total: <strong>{formatCurrency(parseFloat(calculateTotalAmount()))}</strong></div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isCreating || !selectedEmployeeId || !loanName || !totalInstallments || !currentInstallment || (!totalAmount && !installmentValue)}
          >
            {isCreating ? 'Criando...' : 'Criar Empréstimo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
