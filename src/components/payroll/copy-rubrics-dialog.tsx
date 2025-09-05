'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import { Employee, Payroll } from '@/types'

interface CopyRubricsDialogProps {
  currentEmployeeId: string
  onCopy: (fromEmployeeId: string) => void
}

async function fetchEmployees() {
  const response = await fetch('/api/employees')
  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }
  return response.json()
}

async function fetchEmployeePayrolls(employeeId: string) {
  const response = await fetch(`/api/payroll?employeeId=${employeeId}`)
  if (!response.ok) {
    throw new Error('Failed to fetch payrolls')
  }
  return response.json()
}

export function CopyRubricsDialog({ currentEmployeeId, onCopy }: CopyRubricsDialogProps) {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })

  const { data: payrolls = [] } = useQuery({
    queryKey: ['payrolls', selectedEmployeeId],
    queryFn: () => fetchEmployeePayrolls(selectedEmployeeId),
    enabled: !!selectedEmployeeId,
  })

  // Filtrar funcionários (excluir o atual)
  const availableEmployees = employees.filter((emp: Employee) => emp.id !== currentEmployeeId)

  // Pegar o holerite mais recente do funcionário selecionado
  const latestPayroll = payrolls.length > 0 ? payrolls[0] : null

  const handleCopy = () => {
    if (selectedEmployeeId) {
      onCopy(selectedEmployeeId)
      setIsOpen(false)
      setSelectedEmployeeId('')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="mr-2 h-4 w-4" />
          Copiar Rubricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Copiar Rubricas de Outro Funcionário</DialogTitle>
          <DialogDescription>
            Selecione um funcionário para copiar suas rubricas mais recentes
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Funcionário de Origem</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {availableEmployees.map((employee: Employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.name} - {employee.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {latestPayroll && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Holerite Mais Recente</CardTitle>
                <CardDescription>
                  Rubricas do holerite de {latestPayroll.month}/{latestPayroll.year}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Descontos</h4>
                    <div className="space-y-1 text-sm">
                      {Number(latestPayroll.inssDiscount) > 0 && (
                        <div className="flex justify-between">
                          <span>INSS:</span>
                          <span>R$ {Number(latestPayroll.inssDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(latestPayroll.irrfDiscount) > 0 && (
                        <div className="flex justify-between">
                          <span>IRRF:</span>
                          <span>R$ {Number(latestPayroll.irrfDiscount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(latestPayroll.healthInsurance) > 0 && (
                        <div className="flex justify-between">
                          <span>Plano de Saúde:</span>
                          <span>R$ {Number(latestPayroll.healthInsurance).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(latestPayroll.dentalInsurance) > 0 && (
                        <div className="flex justify-between">
                          <span>Plano Odontológico:</span>
                          <span>R$ {Number(latestPayroll.dentalInsurance).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(latestPayroll.customDiscount) > 0 && (
                        <div className="flex justify-between">
                          <span>Desconto Personalizado:</span>
                          <span>R$ {Number(latestPayroll.customDiscount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Benefícios</h4>
                    <div className="space-y-1 text-sm">
                      {Number(latestPayroll.healthInsurance) > 0 && (
                        <div className="flex justify-between">
                          <span>Plano de Saúde:</span>
                          <span>R$ {Number(latestPayroll.healthInsurance).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(latestPayroll.dentalInsurance) > 0 && (
                        <div className="flex justify-between">
                          <span>Plano Odontológico:</span>
                          <span>R$ {Number(latestPayroll.dentalInsurance).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCopy}
              disabled={!selectedEmployeeId || !latestPayroll}
            >
              <Check className="mr-2 h-4 w-4" />
              Copiar Rubricas
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
