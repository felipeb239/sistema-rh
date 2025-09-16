'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Settings,
  DollarSign,
  Percent,
  Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { RubricForm } from './rubric-form'

interface Employee {
  id: string
  name: string
  position?: string
  department?: string
  salary: number
  status: string
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

interface PayrollRubric {
  id: string
  name: string
  type: string
  code?: string
  isActive: boolean
}

interface EmployeeRubricsManagerProps {
  selectedMonth: number
  selectedYear: number
  onRubricsUpdated: () => void
}

export function EmployeeRubricsManager({ 
  selectedMonth, 
  selectedYear, 
  onRubricsUpdated 
}: EmployeeRubricsManagerProps) {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [selectedRubric, setSelectedRubric] = useState<EmployeeRubric | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set())

  // Buscar funcionários com suas rubricas
  const { data: employees, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['employees-with-rubrics', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch('/api/employees')
      if (!response.ok) throw new Error('Erro ao buscar funcionários')
      const employeesData = await response.json()
      
      // Buscar rubricas para cada funcionário
      const employeesWithRubrics = await Promise.all(
        employeesData.map(async (employee: Employee) => {
          try {
            const rubricsResponse = await fetch(`/api/employees/${employee.id}/rubrics`)
            if (rubricsResponse.ok) {
              const rubricsData = await rubricsResponse.json()
              return {
                ...employee,
                employeeRubrics: rubricsData.appliedRubrics || []
              }
            }
            return {
              ...employee,
              employeeRubrics: []
            }
          } catch (error) {
            console.error(`Erro ao buscar rubricas do funcionário ${employee.name}:`, error)
            return {
              ...employee,
              employeeRubrics: []
            }
          }
        })
      )
      
      return employeesWithRubrics
    }
  })

  // Buscar rubricas disponíveis
  const { data: availableRubrics } = useQuery({
    queryKey: ['payroll-rubrics'],
    queryFn: async () => {
      const response = await fetch('/api/payroll-rubrics')
      if (!response.ok) throw new Error('Erro ao buscar rubricas')
      return response.json()
    }
  })

  const toggleEmployeeExpansion = (employeeId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev)
      if (newSet.has(employeeId)) {
        newSet.delete(employeeId)
      } else {
        newSet.add(employeeId)
      }
      return newSet
    })
  }

  const handleAddRubric = (employee: Employee) => {
    setSelectedEmployee(employee)
    setSelectedRubric(null) // Nova rubrica
    setIsDialogOpen(true)
  }

  const handleEditRubric = (employee: Employee, rubric: EmployeeRubric) => {
    setSelectedEmployee(employee)
    setSelectedRubric(rubric) // Rubrica existente para editar
    setIsDialogOpen(true)
  }

  const handleDeleteRubric = async (employeeId: string, employeeRubricId: string) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/rubrics/${employeeRubricId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao remover rubrica')
      }
      
      onRubricsUpdated()
      refetchEmployees()
    } catch (error) {
      console.error('Erro ao remover rubrica:', error)
      alert(error instanceof Error ? error.message : 'Erro ao remover rubrica')
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1] || 'Mês'
  }

  const activeEmployees = employees?.filter((emp: Employee) => emp.status === 'active') || []

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Lista de Funcionários */}
      <div className="space-y-3">
        {activeEmployees.map((employee: Employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-foreground">
                      {employee.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <button
                      onClick={() => toggleEmployeeExpansion(employee.id)}
                      className="text-left hover:bg-muted/50 p-2 -m-2 rounded-md transition-colors group"
                    >
                      <h3 className="font-medium hover:text-primary transition-colors flex items-center gap-2">
                        {employee.name}
                        <span className="text-xs text-muted-foreground group-hover:text-primary">
                          {expandedEmployees.has(employee.id) ? '▼' : '▶'}
                        </span>
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {employee.position} • {employee.department}
                      </p>
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {employee.employeeRubrics?.length || 0} rubrica(s)
                  </Badge>
                  <Button
                    size="sm"
                    onClick={() => handleAddRubric(employee)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            {/* Rubricas do Funcionário - Expandível */}
            {expandedEmployees.has(employee.id) && (
              <CardContent className="pt-0">
                {employee.employeeRubrics && employee.employeeRubrics.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground mb-3">
                      Rubricas aplicadas:
                    </div>
                    {employee.employeeRubrics.map((rubric: EmployeeRubric) => (
                      <div
                        key={rubric.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={rubric.rubric.type === 'proventos' ? 'default' : 'destructive'}
                              className="text-xs"
                            >
                              {rubric.rubric.type === 'proventos' ? 'Proventos' : 'Desconto'}
                            </Badge>
                            <span className="font-medium">
                              {rubric.customName || rubric.rubric.name}
                            </span>
                            {rubric.rubric.code && (
                              <span className="text-xs text-muted-foreground">
                                ({rubric.rubric.code})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-1">
                            {rubric.customValue && (
                              <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                                {formatCurrency(rubric.customValue)}
                              </span>
                            )}
                            {rubric.customPercentage && (
                              <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                                {rubric.customPercentage}%
                              </span>
                            )}
                            {rubric.startDate && (
                              <span className="text-xs text-muted-foreground">
                                Início: {new Date(rubric.startDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                            {rubric.endDate && (
                              <span className="text-xs text-muted-foreground">
                                Fim: {new Date(rubric.endDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditRubric(employee, rubric)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRubric(employee.id, rubric.rubric.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhuma rubrica aplicada</p>
                    <p className="text-sm">Clique em "Adicionar" para aplicar rubricas</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Modal para Adicionar/Editar Rubrica */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRubric ? `Editar Rubrica - ${selectedEmployee?.name}` : `Adicionar Rubrica - ${selectedEmployee?.name}`}
            </DialogTitle>
            <DialogDescription>
              {selectedRubric ? 'Edite os dados da rubrica selecionada' : 'Adicione uma nova rubrica para este funcionário'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmployee && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedEmployee.name}</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedEmployee.position} • {selectedEmployee.department}
                </p>
                <p className="text-sm text-muted-foreground">
                  Salário: {formatCurrency(selectedEmployee.salary)}
                </p>
              </div>
              
              <RubricForm 
                employee={selectedEmployee}
                availableRubrics={availableRubrics || []}
                existingRubric={selectedRubric}
                onSave={() => {
                  setIsDialogOpen(false)
                  setSelectedRubric(null)
                  onRubricsUpdated()
                  refetchEmployees()
                }}
                onCancel={() => {
                  setIsDialogOpen(false)
                  setSelectedRubric(null)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
