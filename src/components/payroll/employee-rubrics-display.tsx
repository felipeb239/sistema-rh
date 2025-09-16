'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { EmployeeRubric, PayrollRubric } from '@/types'
import { calculateEmployeeRubrics, getRubricTotals, RubricCalculation } from '@/lib/employee-rubrics'

interface EmployeeRubricsDisplayProps {
  employeeId: string
  baseSalary: number
  month?: number
  year?: number
  showTotals?: boolean
}

export function EmployeeRubricsDisplay({ 
  employeeId, 
  baseSalary, 
  month, 
  year, 
  showTotals = true 
}: EmployeeRubricsDisplayProps) {
  const [rubrics, setRubrics] = useState<EmployeeRubric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/employees/${employeeId}/rubrics`)
        const data = await response.json()
        
        if (response.ok) {
          setRubrics(data.appliedRubrics || [])
        }
      } catch (error) {
        console.error('Erro ao buscar rubricas:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRubrics()
  }, [employeeId])

  if (loading) {
    return (
      <div className="space-y-2">
        <h3 className="font-semibold text-gray-700">Rubricas Específicas</h3>
        <div className="text-sm text-gray-500">Carregando...</div>
      </div>
    )
  }

  const calculatedRubrics = calculateEmployeeRubrics(rubrics, baseSalary, month, year)
  const totals = getRubricTotals(calculatedRubrics)

  if (calculatedRubrics.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-foreground">Rubricas Específicas</h3>
      
      {/* Benefícios */}
      {totals.benefits.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-green-600 dark:text-green-400">Proventos</h4>
          <div className="space-y-1">
            {totals.benefits.map((rubric, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-foreground">{rubric.name}</span>
                  <Badge variant="default" className="text-xs">
                    {rubric.type === 'percentage' ? 'Percentual' : 'Fixo'}
                  </Badge>
                </div>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  + R$ {rubric.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Descontos */}
      {totals.discounts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-red-600 dark:text-red-400">Descontos</h4>
          <div className="space-y-1">
            {totals.discounts.map((rubric, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-2">
                  <span className="text-foreground">{rubric.name}</span>
                  <Badge variant="destructive" className="text-xs">
                    {rubric.type === 'percentage' ? 'Percentual' : 'Fixo'}
                  </Badge>
                </div>
                <span className="text-red-600 dark:text-red-400 font-medium">
                  - R$ {rubric.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totais */}
      {showTotals && (totals.benefits.length > 0 || totals.discounts.length > 0) && (
        <div className="border-t border-border pt-2 space-y-1">
          {totals.benefits.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600 dark:text-green-400">Total de Proventos:</span>
              <span className="text-green-600 dark:text-green-400 font-medium">
                + R$ {totals.totalBenefits.toFixed(2)}
              </span>
            </div>
          )}
          {totals.discounts.length > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-red-600 dark:text-red-400">Total de Descontos:</span>
              <span className="text-red-600 dark:text-red-400 font-medium">
                - R$ {totals.totalDiscounts.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold border-t border-border pt-1">
            <span className="text-foreground">Saldo das Rubricas:</span>
            <span className={totals.totalBenefits - totals.totalDiscounts >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
              {totals.totalBenefits - totals.totalDiscounts >= 0 ? '+' : ''}R$ {(totals.totalBenefits - totals.totalDiscounts).toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
