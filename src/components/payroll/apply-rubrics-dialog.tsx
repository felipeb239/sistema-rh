'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Copy, Check } from 'lucide-react'
import { PayrollRubric } from '@/types'

interface ApplyRubricsDialogProps {
  employeeId: string
  employeeName: string
  onApply: (rubrics: PayrollRubric[]) => void
}

async function fetchPayrollRubrics() {
  const response = await fetch('/api/payroll-rubrics')
  if (!response.ok) {
    throw new Error('Failed to fetch payroll rubrics')
  }
  return response.json()
}

export function ApplyRubricsDialog({ employeeId, employeeName, onApply }: ApplyRubricsDialogProps) {
  const [selectedRubrics, setSelectedRubrics] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const { data: rubrics = [], isLoading } = useQuery({
    queryKey: ['payroll-rubrics'],
    queryFn: fetchPayrollRubrics,
  })

  const handleRubricToggle = (rubricId: string) => {
    setSelectedRubrics(prev => 
      prev.includes(rubricId) 
        ? prev.filter(id => id !== rubricId)
        : [...prev, rubricId]
    )
  }

  const handleApply = () => {
    const selectedRubricObjects = rubrics.filter((rubric: PayrollRubric) => 
      selectedRubrics.includes(rubric.id)
    )
    onApply(selectedRubricObjects)
    setIsOpen(false)
    setSelectedRubrics([])
  }

  const discountRubrics = rubrics.filter((r: PayrollRubric) => r.type === 'discount')
  const benefitRubrics = rubrics.filter((r: PayrollRubric) => r.type === 'proventos')

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="mr-2 h-4 w-4" />
          Aplicar Rubricas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Aplicar Rubricas</DialogTitle>
          <DialogDescription>
            Selecione as rubricas para aplicar ao funcionário <strong>{employeeName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Descontos */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 text-lg">Descontos</CardTitle>
              <CardDescription>
                Selecione os descontos que se aplicam a este funcionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {discountRubrics.map((rubric: PayrollRubric) => (
                  <div key={rubric.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={rubric.id}
                      checked={selectedRubrics.includes(rubric.id)}
                      onCheckedChange={() => handleRubricToggle(rubric.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={rubric.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-medium">{rubric.name}</span>
                        {rubric.code && (
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                            {rubric.code}
                          </span>
                        )}
                      </label>
                      {rubric.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rubric.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {discountRubrics.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum desconto disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Benefícios */}
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600 text-lg">Proventos</CardTitle>
              <CardDescription>
                Selecione os proventos que se aplicam a este funcionário
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {benefitRubrics.map((rubric: PayrollRubric) => (
                  <div key={rubric.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={rubric.id}
                      checked={selectedRubrics.includes(rubric.id)}
                      onCheckedChange={() => handleRubricToggle(rubric.id)}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={rubric.id}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <span className="font-medium">{rubric.name}</span>
                        {rubric.code && (
                          <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                            {rubric.code}
                          </span>
                        )}
                      </label>
                      {rubric.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {rubric.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {benefitRubrics.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum provento disponível
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApply}
              disabled={selectedRubrics.length === 0}
            >
              <Check className="mr-2 h-4 w-4" />
              Aplicar {selectedRubrics.length} Rubrica(s)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
