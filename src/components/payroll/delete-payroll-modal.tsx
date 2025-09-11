'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Trash2, 
  AlertTriangle, 
  Users, 
  Calendar,
  Loader2
} from 'lucide-react'

interface DeletePayrollModalProps {
  selectedMonth: number
  selectedYear: number
  onPayrollDeleted: () => void
}

export function DeletePayrollModal({ 
  selectedMonth, 
  selectedYear, 
  onPayrollDeleted 
}: DeletePayrollModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1] || 'Mês'
  }

  const handleDeletePayroll = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch('/api/payroll/delete-batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          month: selectedMonth,
          year: selectedYear
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Erro ao excluir folha de pagamento')
      }

      const result = await response.json()
      alert(`Folha de pagamento excluída com sucesso! ${result.deleted} holerites removidos.`)
      
      setIsOpen(false)
      onPayrollDeleted()
    } catch (error) {
      console.error('Erro ao excluir folha:', error)
      alert(error instanceof Error ? error.message : 'Erro ao excluir folha de pagamento')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" className="flex items-center gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir Folha Completa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Excluir Folha de Pagamento
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. Todos os holerites do período serão permanentemente removidos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do Período */}
          <Card className="border-red-200 bg-red-50">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período a ser excluído
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-lg font-semibold text-red-700">
                  {getMonthName(selectedMonth)} de {selectedYear}
                </div>
                <p className="text-sm text-red-600 mt-1">
                  Todos os holerites deste período serão removidos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Aviso de Confirmação */}
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">
                  Atenção!
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Esta operação irá excluir <strong>permanentemente</strong> todos os holerites de {getMonthName(selectedMonth)}/{selectedYear}. 
                  Certifique-se de que você realmente deseja continuar.
                </p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePayroll}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Definitivamente
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
