'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Edit3, Trash2, Calculator } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { AddLoanDialog } from './add-loan-dialog'

interface Employee {
  id: string
  name: string
  position?: string
  department?: string
  employeeRubrics: EmployeeRubric[]
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

interface LoanInstallment {
  id: string
  employeeId: string
  employeeName: string
  loanName: string
  totalAmount: number
  totalInstallments: number
  currentInstallment: number
  installmentValue: number
  remainingAmount: number
  rubricId?: string
  employeeRubricId?: string
}

interface LoanInstallmentsManagerProps {
  selectedMonth: number
  selectedYear: number
}

export function LoanInstallmentsManager({ selectedMonth, selectedYear }: LoanInstallmentsManagerProps) {
  const [isEditingInstallment, setIsEditingInstallment] = useState<string | null>(null)
  const [newInstallmentNumber, setNewInstallmentNumber] = useState('')

  const queryClient = useQueryClient()

  // Buscar funcionários ativos
  const { data: employees = [], isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      console.log('🔍 Fazendo requisição para /api/employees')
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Erro ao buscar funcionários')
      const data = await response.json()
      console.log('📊 Dados recebidos da API:', data.length, 'funcionários')
      console.log('📊 Primeiro funcionário:', data[0])
      return data
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

  // Função para extrair informações de empréstimo do customName
  const parseLoanInfo = (customName: string): Partial<LoanInstallment> | null => {
    // Limpar a string de possíveis caracteres invisíveis
    const cleanCustomName = customName.trim().replace(/\u00A0/g, ' ') // Substituir non-breaking spaces
    
    // Múltiplas tentativas de regex
    const regexes = [
      /^(.*?) - R\$ ([\d.,]+) - Parcela (\d+)\/(\d+) - Restante: R\$ ([\d.,]+)$/,
      /^(.+?)\s*-\s*R\$\s*([\d.,]+)\s*-\s*Parcela\s*(\d+)\/(\d+)\s*-\s*Restante:\s*R\$\s*([\d.,]+)$/,
      /^(.+?)\s*-\s*R\$\s*([\d.,]+)\s*-\s*Parcela\s*(\d+)\/(\d+)\s*-\s*Restante:\s*R\$\s*([\d.,]+)$/i
    ]
    
    let loanMatch = null
    
    for (let i = 0; i < regexes.length; i++) {
      loanMatch = cleanCustomName.match(regexes[i])
      if (loanMatch) {
        break
      }
    }
    
    if (loanMatch) {
      // Função auxiliar para converter valor brasileiro para número
      const parseCurrency = (value: string): number => {
        const cleanValue = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
        return parseFloat(cleanValue)
      }
      
      return {
        loanName: loanMatch[1].trim(),
        totalAmount: parseCurrency(loanMatch[2]),
        currentInstallment: parseInt(loanMatch[3]),
        totalInstallments: parseInt(loanMatch[4]),
        remainingAmount: parseCurrency(loanMatch[5])
      }
    }
    
    return null
  }

  // Identificar empréstimos ativos
  const activeLoans: LoanInstallment[] = []
  
  console.log(`📊 Total de funcionários carregados: ${employees.length}`)
  employees.forEach((employee: Employee) => {
    console.log(`👤 Funcionário: ${employee.name}, Rubricas: ${employee.employeeRubrics?.length || 0}`)
    employee.employeeRubrics?.forEach((rubric: EmployeeRubric) => {
      if (rubric.isActive && rubric.customName && rubric.customValue) {
        console.log(`🔍 Verificando rubrica: ${rubric.customName}`)
        const loanInfo = parseLoanInfo(rubric.customName)
        console.log(`🔍 Resultado do parseLoanInfo:`, loanInfo)
        if (loanInfo && loanInfo.currentInstallment && loanInfo.totalInstallments && loanInfo.loanName) {
          console.log(`✅ Empréstimo encontrado: ${loanInfo.loanName}`)
          console.log(`📝 CustomName completo: "${rubric.customName}"`)
          
          // Calcular valores se não estiverem definidos
          const totalAmount = loanInfo.totalAmount || 0
          const currentInstallment = loanInfo.currentInstallment || 1
          const totalInstallments = loanInfo.totalInstallments || 1
          const installmentValue = rubric.customValue || 0
          
          console.log(`📊 Valores do empréstimo:`, {
            totalAmount,
            currentInstallment,
            totalInstallments,
            installmentValue
          })
          
          // Usar o valor restante extraído da regex
          const remainingAmount = loanInfo.remainingAmount || 0
          console.log(`🔍 Valor restante: ${remainingAmount}`)
          
          activeLoans.push({
            id: rubric.id,
            employeeId: employee.id,
            employeeName: employee.name,
            rubricId: rubric.rubric.id,
            employeeRubricId: rubric.id,
            loanName: loanInfo.loanName || 'Empréstimo',
            totalAmount,
            totalInstallments,
            currentInstallment,
            installmentValue,
            remainingAmount
          } as LoanInstallment)
        } else {
          console.log(`❌ Não é um empréstimo válido: ${rubric.customName}`)
        }
      }
    })
  })

    console.log(`📊 Total de empréstimos encontrados: ${activeLoans.length}`)
    console.log(`📋 Lista de empréstimos:`, activeLoans.map(loan => ({
      employeeName: loan.employeeName,
      loanName: loan.loanName,
      currentInstallment: loan.currentInstallment,
      totalInstallments: loan.totalInstallments
    })))

  // Função para atualizar parcela
  const updateInstallment = async (loanId: string, newInstallmentNumber: string) => {
    const loan = activeLoans.find(l => l.id === loanId)
    if (!loan) return

    const newInstallment = parseInt(newInstallmentNumber)
    if (newInstallment < 1 || newInstallment > loan.totalInstallments) {
      alert('Número da parcela inválido')
      return
    }

    const remainingAmount = Math.max(0, loan.totalAmount - (newInstallment * loan.installmentValue))
    
    // Criar novo customName com a parcela atualizada
    const newCustomName = `${loan.loanName} - R$ ${loan.totalAmount.toFixed(2).replace('.', ',')} - Parcela ${newInstallment}/${loan.totalInstallments} - Restante: R$ ${remainingAmount.toFixed(2).replace('.', ',')}`

    try {
      // Buscar o rubricId base da rubrica aplicada ao funcionário
      const employee = employees.find(emp => emp.id === loan.employeeId)
      const employeeRubric = employee?.employeeRubrics?.find(er => er.id === loan.employeeRubricId)
      
      if (!employeeRubric) {
        throw new Error('Rubrica do funcionário não encontrada')
      }

      const response = await fetch(`/api/employees/${loan.employeeId}/rubrics/${employeeRubric.rubricId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customName: newCustomName,
          customValue: loan.installmentValue,
          customPercentage: employeeRubric.customPercentage,
          isActive: newInstallment <= loan.totalInstallments
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar parcela')
      }

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      setIsEditingInstallment(null)
      setNewInstallmentNumber('')
    } catch (error) {
      console.error('Erro ao atualizar parcela:', error)
      alert('Erro ao atualizar parcela. Tente novamente.')
    }
  }

  // Função para finalizar empréstimo
  const finalizeLoan = async (loanId: string) => {
    const loan = activeLoans.find(l => l.id === loanId)
    if (!loan) return

    try {
      // Buscar o rubricId base da rubrica aplicada ao funcionário
      const employee = employees.find(emp => emp.id === loan.employeeId)
      const employeeRubric = employee?.employeeRubrics?.find(er => er.id === loan.employeeRubricId)
      
      if (!employeeRubric) {
        throw new Error('Rubrica do funcionário não encontrada')
      }

      const response = await fetch(`/api/employees/${loan.employeeId}/rubrics/${employeeRubric.rubricId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customName: employeeRubric.customName,
          customValue: employeeRubric.customValue,
          customPercentage: employeeRubric.customPercentage,
          isActive: false // Desativar rubrica quando empréstimo terminar
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao finalizar empréstimo')
      }

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    } catch (error) {
      console.error('Erro ao finalizar empréstimo:', error)
      alert('Erro ao finalizar empréstimo. Tente novamente.')
    }
  }

  // Função para excluir empréstimo
  const deleteLoan = async (loanId: string) => {
    const loan = activeLoans.find(l => l.id === loanId)
    if (!loan) return

    const confirmDelete = confirm(
      `Tem certeza que deseja excluir o empréstimo "${loan.loanName}" do funcionário ${loan.employeeName}?\n\nEsta ação não pode ser desfeita.`
    )

    if (!confirmDelete) return

    try {
      // Buscar o rubricId base da rubrica aplicada ao funcionário
      const employee = employees.find(emp => emp.id === loan.employeeId)
      const employeeRubric = employee?.employeeRubrics?.find(er => er.id === loan.employeeRubricId)
      
      if (!employeeRubric) {
        throw new Error('Rubrica do funcionário não encontrada')
      }

      const response = await fetch(`/api/employees/${loan.employeeId}/rubrics/${employeeRubric.rubricId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Erro da API:', errorText)
        throw new Error('Erro ao excluir empréstimo')
      }

      // Recarregar dados
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      alert('Empréstimo excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir empréstimo:', error)
      alert('Erro ao excluir empréstimo. Tente novamente.')
    }
  }

  if (employeesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5" />
            <span>Empréstimos Parcelados</span>
          </CardTitle>
          <CardDescription>
            Carregando empréstimos...
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Empréstimos Parcelados</span>
        </CardTitle>
        <CardDescription>
          Gerencie as parcelas dos empréstimos dos funcionários
        </CardDescription>
      </CardHeader>
      <CardContent>
        {activeLoans.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum empréstimo ativo</h3>
            <p className="text-muted-foreground mb-4">
              Não há empréstimos parcelados ativos no momento.
            </p>
            <AddLoanDialog />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">
                Empréstimos Ativos ({activeLoans.length})
              </h3>
              <AddLoanDialog />
            </div>

            <div className="space-y-3">
              {activeLoans.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {loan.employeeName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{loan.employeeName}</h4>
                        <p className="text-sm text-muted-foreground">{loan.loanName}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <Badge variant="outline">
                            Parcela {loan.currentInstallment}/{loan.totalInstallments}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            Total: {formatCurrency(loan.totalAmount)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Valor: {formatCurrency(loan.installmentValue)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Restante: {formatCurrency(loan.remainingAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {isEditingInstallment === loan.id ? (
                      <div className="flex items-center space-x-2">
                        <Input
                          type="number"
                          min="1"
                          max={loan.totalInstallments}
                          value={newInstallmentNumber}
                          onChange={(e) => setNewInstallmentNumber(e.target.value)}
                          className="w-20 h-8 text-sm"
                          placeholder="Parcela"
                        />
                        <Button
                          size="sm"
                          onClick={() => updateInstallment(loan.id, newInstallmentNumber)}
                          className="h-8 px-2 text-xs"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsEditingInstallment(null)}
                          className="h-8 px-2 text-xs"
                        >
                          ✗
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setIsEditingInstallment(loan.id)
                            setNewInstallmentNumber(loan.currentInstallment.toString())
                          }}
                          className="h-8 w-8 p-0"
                          title="Editar parcela"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteLoan(loan.id)}
                          className="h-8 w-8 p-0"
                          title="Excluir empréstimo"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                        {loan.currentInstallment >= loan.totalInstallments && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => finalizeLoan(loan.id)}
                            className="h-8 w-8 p-0"
                            title="Finalizar empréstimo"
                          >
                            <Calculator className="h-3 w-3" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
