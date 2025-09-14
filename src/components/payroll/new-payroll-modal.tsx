'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Plus, 
  Users, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Edit3
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'

interface Employee {
  id: string
  name: string
  position?: string
  department?: string
  salary: number
  status: string
}

interface NewPayrollModalProps {
  onPayrollGenerated: () => void
}

export function NewPayrollModal({ onPayrollGenerated }: NewPayrollModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  
  // Estados para edição de salário
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false)
  const [selectedEmployeeForEdit, setSelectedEmployeeForEdit] = useState<Employee | null>(null)
  const [newSalary, setNewSalary] = useState('')
  const [isUpdatingSalary, setIsUpdatingSalary] = useState(false)
  
  const queryClient = useQueryClient()

  // Buscar funcionários ativos
  const { data: employees, isLoading: employeesLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Erro ao buscar funcionários')
      return response.json()
    }
  })

  // Verificar holerites existentes para o período
  const { data: existingPayrolls } = useQuery({
    queryKey: ['existing-payrolls', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/payroll?month=${selectedMonth}&year=${selectedYear}`)
      if (!response.ok) throw new Error('Erro ao verificar holerites existentes')
      return response.json()
    },
    enabled: isOpen
  })

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1] || 'Mês'
  }

  const generateYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }

  const handleSelectAll = () => {
    if (employees) {
      const activeEmployees = employees.filter((emp: Employee) => emp.status === 'active')
      if (selectedEmployees.length === activeEmployees.length) {
        setSelectedEmployees([])
      } else {
        setSelectedEmployees(activeEmployees.map((emp: Employee) => emp.id))
      }
    }
  }

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId) 
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    )
  }

  const handleEditSalary = (employee: Employee) => {
    setSelectedEmployeeForEdit(employee)
    setNewSalary(employee.salary.toString())
    setIsSalaryModalOpen(true)
  }

  const handleUpdateSalary = async () => {
    if (!selectedEmployeeForEdit || !newSalary) return

    setIsUpdatingSalary(true)
    try {
      const response = await fetch(`/api/employees/${selectedEmployeeForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salary: parseFloat(newSalary)
        })
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar salário')
      }

      // Invalidar e recarregar a query de funcionários
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      
      toast.success('Salário atualizado com sucesso!')
      setIsSalaryModalOpen(false)
      setSelectedEmployeeForEdit(null)
      setNewSalary('')
    } catch (error) {
      console.error('Erro ao atualizar salário:', error)
      toast.error('Erro ao atualizar salário')
    } finally {
      setIsUpdatingSalary(false)
    }
  }

  const handleGeneratePayroll = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Selecione pelo menos um funcionário')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/payroll/generate-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear,
          employeeIds: selectedEmployees
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao gerar folha de pagamento')
      }

      const result = await response.json()
      toast.success(`Folha de pagamento gerada com sucesso! ${result.created} holerites criados.`)
      
      setIsOpen(false)
      setSelectedEmployees([])
      onPayrollGenerated()
    } catch (error) {
      console.error('Erro ao gerar folha:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao gerar folha de pagamento')
    } finally {
      setIsGenerating(false)
    }
  }

  const activeEmployees = employees?.filter((emp: Employee) => emp.status === 'active') || []
  const existingEmployeeIds = existingPayrolls?.map((payroll: any) => payroll.employeeId) || []
  const availableEmployees = activeEmployees.filter((emp: Employee) => !existingEmployeeIds.includes(emp.id))

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Folha de Pagamento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Gerar Nova Folha de Pagamento
          </DialogTitle>
          <DialogDescription>
            Selecione o período e os funcionários para gerar uma nova folha de pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seleção de Período */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="month">Mês</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                        <SelectItem key={month} value={month.toString()}>
                          {getMonthName(month)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Ano</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYears().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status da Folha */}
          {existingPayrolls && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Status da Folha - {getMonthName(selectedMonth)}/{selectedYear}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {existingPayrolls.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Holerites Existentes
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {availableEmployees.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Funcionários Disponíveis
                    </div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">
                      {activeEmployees.length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total de Funcionários
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção de Funcionários */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Funcionários
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={availableEmployees.length === 0}
                >
                  {selectedEmployees.length === availableEmployees.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
              </CardTitle>
              <CardDescription>
                {availableEmployees.length > 0 
                  ? `${selectedEmployees.length} de ${availableEmployees.length} funcionários selecionados`
                  : 'Todos os funcionários já possuem holerites para este período'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeesLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : availableEmployees.length > 0 ? (
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {availableEmployees.map((employee: Employee) => (
                    <div
                      key={employee.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <Checkbox
                        id={employee.id}
                        checked={selectedEmployees.includes(employee.id)}
                        onCheckedChange={() => handleEmployeeToggle(employee.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.position} • {employee.department}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(employee.salary)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSalary(employee)}
                          className="h-6 w-6 p-0"
                          title="Editar salário"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Folha Completa</h3>
                  <p className="text-muted-foreground">
                    Todos os funcionários já possuem holerites para {getMonthName(selectedMonth)}/{selectedYear}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isGenerating}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGeneratePayroll}
              disabled={selectedEmployees.length === 0 || isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Gerar Folha ({selectedEmployees.length} funcionários)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal para Editar Salário */}
      <Dialog open={isSalaryModalOpen} onOpenChange={setIsSalaryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Salário</DialogTitle>
            <DialogDescription>
              Atualize o salário do funcionário: <strong>{selectedEmployeeForEdit?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="salary">Novo Salário (R$)</Label>
              <Input
                id="salary"
                type="number"
                step="0.01"
                min="0"
                value={newSalary}
                onChange={(e) => setNewSalary(e.target.value)}
                placeholder="Ex: 5000.00"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Salário atual: <span className="font-medium">{formatCurrency(selectedEmployeeForEdit?.salary || 0)}</span>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setIsSalaryModalOpen(false)}
              disabled={isUpdatingSalary}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpdateSalary}
              disabled={!newSalary || isUpdatingSalary || parseFloat(newSalary) <= 0}
            >
              {isUpdatingSalary ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                'Atualizar Salário'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
