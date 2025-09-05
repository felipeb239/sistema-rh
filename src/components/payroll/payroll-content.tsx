'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText,
  Download,
  FileDown,
  AlertTriangle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PayrollForm } from './payroll-form'
import { Payroll } from '@/types'

async function fetchPayrolls() {
  const response = await fetch('/api/payroll')
  if (!response.ok) {
    throw new Error('Failed to fetch payrolls')
  }
  return response.json()
}

async function deletePayroll(id: string) {
  const response = await fetch(`/api/payroll/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete payroll')
  }
  return response.json()
}

export function PayrollContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: payrolls = [], isLoading } = useQuery({
    queryKey: ['payrolls'],
    queryFn: fetchPayrolls,
  })

  const deleteMutation = useMutation({
    mutationFn: deletePayroll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] })
    }
  })

  const filteredPayrolls = payrolls.filter((payroll: Payroll) =>
    payroll.employee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payroll.month.toString().includes(searchTerm) ||
    payroll.year.toString().includes(searchTerm)
  )

  const handleEdit = (payroll: Payroll) => {
    setEditingPayroll(payroll)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setPayrollToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (payrollToDelete) {
      deleteMutation.mutate(payrollToDelete)
      setShowDeleteModal(false)
      setPayrollToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setPayrollToDelete(null)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingPayroll(null)
  }

  const handleExportIndividual = async (payrollId: string, format: 'pdf' | 'csv') => {
    try {
      setIsExporting(payrollId)
      const url = `/api/export/individual-payroll?id=${payrollId}&format=${format}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao exportar holerite')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `holerite_${payrollId}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      } else {
        // For PDF, open in new tab
        const htmlContent = await response.text()
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(htmlContent)
          newWindow.document.close()
          // Auto-trigger print dialog for PDF generation
          setTimeout(() => {
            newWindow.print()
          }, 1000)
        }
      }
    } catch (error) {
      console.error('Export error:', error)
      alert('Erro ao exportar holerite. Tente novamente.')
    } finally {
      setIsExporting(null)
    }
  }

  if (showForm) {
    return (
      <PayrollForm 
        payroll={editingPayroll}
        onClose={handleFormClose}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Holerites</h1>
          <p className="text-muted-foreground">
            Gerencie os holerites dos funcionários
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Holerite
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar holerites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Holerites
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrolls.length}</div>
            <p className="text-xs text-muted-foreground">
              Holerites emitidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payrolls.reduce((sum: number, payroll: Payroll) => sum + Number(payroll.netSalary), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor total pago
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média Salarial
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                payrolls.reduce((sum: number, payroll: Payroll) => sum + Number(payroll.netSalary), 0) / payrolls.length || 0
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Média dos salários
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payrolls List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Holerites</CardTitle>
          <CardDescription>
            {filteredPayrolls.length} holerite(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayrolls.map((payroll: Payroll) => (
                <div
                  key={payroll.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {payroll.employee?.name?.charAt(0).toUpperCase() || 'F'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium">{payroll.employee?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {payroll.month}/{payroll.year} • {payroll.employee?.position}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Criado em {formatDate(payroll.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(Number(payroll.netSalary))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Salário líquido
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportIndividual(payroll.id, 'pdf')}
                        disabled={isExporting === payroll.id}
                        title="Exportar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportIndividual(payroll.id, 'csv')}
                        disabled={isExporting === payroll.id}
                        title="Exportar CSV"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(payroll)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(payroll.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredPayrolls.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum holerite encontrado
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold">
                  Confirmar Exclusão
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-1">
                  Tem certeza que deseja excluir este holerite? Esta ação não pode ser desfeita.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={cancelDelete}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="w-full sm:w-auto"
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
