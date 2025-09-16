'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Receipt as ReceiptIcon,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileDown,
  AlertTriangle,
  Copy,
  Trash
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ReceiptForm } from './receipt-form'
import { CopyReceiptsDialog } from './copy-receipts-dialog'
import { Receipt, Employee } from '@/types'
import { toast } from 'sonner'

async function fetchReceipts(page: number = 1, year?: number, month?: number) {
  const params = new URLSearchParams({ page: page.toString() })
  if (year) params.append('year', year.toString())
  if (month) params.append('month', month.toString())
  
  const response = await fetch(`/api/receipts?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch receipts')
  }
  return response.json()
}

async function fetchReceiptStats(year?: number, month?: number) {
  const params = new URLSearchParams()
  if (year) params.append('year', year.toString())
  if (month) params.append('month', month.toString())
  
  const response = await fetch(`/api/receipts/stats?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch receipt stats')
  }
  return response.json()
}

async function fetchEmployees() {
  const response = await fetch('/api/employees')
  if (!response.ok) {
    throw new Error('Failed to fetch employees')
  }
  return response.json()
}

async function deleteReceipt(id: string) {
  const response = await fetch(`/api/receipts/${id}`, {
    method: 'DELETE'
  })
  if (!response.ok) {
    throw new Error('Failed to delete receipt')
  }
  return response.json()
}

export function ReceiptsContent() {
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [isExporting, setIsExporting] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [receiptToDelete, setReceiptToDelete] = useState<string | null>(null)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const queryClient = useQueryClient()

  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['receipts', currentPage, selectedYear, selectedMonth],
    queryFn: () => fetchReceipts(currentPage, selectedYear, selectedMonth),
  })

  const { data: statsData } = useQuery({
    queryKey: ['receipt-stats', selectedYear, selectedMonth],
    queryFn: () => fetchReceiptStats(selectedYear, selectedMonth),
  })

  const receipts = receiptsData?.receipts || []
  const pagination = receiptsData?.pagination || { page: 1, totalPages: 1, totalReceipts: 0 }
  const stats = statsData || { totalReceipts: 0, totalValue: 0, averageValue: 0 }


  const { data: employees = [] } = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteReceipt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipt-stats'] })
      // Se a página atual ficou sem itens, voltar para a primeira página
      if (receipts.length === 1 && currentPage > 1) {
        setCurrentPage(1)
      }
    }
  })

  const filteredReceipts = receipts.filter((receipt: Receipt) => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      receipt.employee?.name?.toLowerCase().includes(searchLower) ||
      receipt.type?.name?.toLowerCase().includes(searchLower) ||
      receipt.month.toString().includes(searchTerm) ||
      receipt.year.toString().includes(searchTerm)
    )
  })

  const handleEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt)
    setShowForm(true)
  }

  const handleDelete = (id: string) => {
    setReceiptToDelete(id)
    setShowDeleteModal(true)
  }

  const confirmDelete = () => {
    if (receiptToDelete) {
      deleteMutation.mutate(receiptToDelete)
      setShowDeleteModal(false)
      setReceiptToDelete(null)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setReceiptToDelete(null)
  }

  const handleFormClose = (refreshData = false) => {
    setShowForm(false)
    setEditingReceipt(null)
    if (refreshData) {
      // Voltar para a primeira página quando um novo recibo for criado
      setCurrentPage(1)
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipt-stats'] })
    }
  }

  const handleFilterChange = () => {
    // Resetar para primeira página quando filtros mudarem
    setCurrentPage(1)
  }

  const handleExportIndividual = async (receiptId: string, format: 'pdf' | 'csv') => {
    try {
      setIsExporting(receiptId)
      const url = `/api/export/individual-receipt?id=${receiptId}&format=${format}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao exportar recibo')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `recibo_${receiptId}.csv`
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
      toast.error('Erro ao exportar recibo. Tente novamente.')
    } finally {
      setIsExporting(null)
    }
  }

  const handleExportBatch = async () => {
    try {
      setIsExporting('batch')
      const url = `/api/export/batch-receipts?month=${selectedMonth}&year=${selectedYear}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao exportar recibos')
      }

      // Open in new tab for printing
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
    } catch (error) {
      console.error('Erro ao exportar recibos em massa:', error)
      toast.error('Erro ao exportar recibos. Tente novamente.')
    } finally {
      setIsExporting(null)
    }
  }

  const getReceiptTypeLabel = (receipt: any) => {
    return receipt.type?.name || 'Tipo não encontrado'
  }

  // Funções para seleção múltipla
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedReceipts(filteredReceipts.map((receipt: Receipt) => receipt.id))
    } else {
      setSelectedReceipts([])
    }
  }

  const handleSelectReceipt = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceipts(prev => [...prev, receiptId])
    } else {
      setSelectedReceipts(prev => prev.filter(id => id !== receiptId))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedReceipts.length === 0) {
      toast.error('Selecione pelo menos um recibo para excluir')
      return
    }

    try {
      const response = await fetch('/api/receipts/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ receiptIds: selectedReceipts }),
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir recibos')
      }

      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      queryClient.invalidateQueries({ queryKey: ['receipt-stats'] })
      setSelectedReceipts([])
      setShowBulkDeleteModal(false)
      toast.success(`${selectedReceipts.length} recibo(s) excluído(s) com sucesso!`)
    } catch (error) {
      console.error('Erro ao excluir recibos:', error)
      toast.error('Erro ao excluir recibos. Tente novamente.')
    }
  }

  if (showForm) {
    return (
      <ReceiptForm 
        receipt={editingReceipt}
        employees={employees}
        onClose={handleFormClose}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b pb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Recibos</h1>
            <p className="text-muted-foreground">
              Gerencie os recibos de vale transporte e alimentação
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowCopyModal(true)}>
              <Copy className="mr-2 h-4 w-4" />
              Copiar do Mês Anterior
            </Button>
            {selectedReceipts.length > 0 && (
              <Button 
                variant="destructive" 
                onClick={() => setShowBulkDeleteModal(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Excluir Selecionados ({selectedReceipts.length})
              </Button>
            )}
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recibo
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-5 items-end">
            <div className="relative md:col-span-2 lg:col-span-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar recibos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="year-filter" className="text-sm">Ano</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => {
                  setSelectedYear(parseInt(value))
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="month-filter" className="text-sm">Mês</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => {
                  setSelectedMonth(parseInt(value))
                  handleFilterChange()
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1
                    const monthNames = [
                      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
                    ]
                    return (
                      <SelectItem key={month} value={month.toString()}>
                        {monthNames[i]}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Botão de Exportação em Massa */}
      {receipts.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center">
              <Button 
                onClick={() => handleExportBatch()}
                className="bg-green-600 hover:bg-green-700"
                disabled={isExporting === 'batch'}
              >
                {isExporting === 'batch' ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Gerando PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar Todos os Recibos para Impressão
                  </>
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-2">
              Gera um PDF com todos os recibos do período {selectedMonth}/{selectedYear} para impressão e assinatura
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Recibos
            </CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReceipts}</div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth}/{selectedYear}
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
              {formatCurrency(Number(stats.totalValue))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth}/{selectedYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média por Recibo
            </CardTitle>
            <ReceiptIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(Number(stats.averageValue))}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedMonth}/{selectedYear}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Receipts List */}
      <Card>
        <CardHeader className="sticky top-24 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Recibos</CardTitle>
              <CardDescription>
                {pagination.totalReceipts} recibo(s) total • Página {pagination.page} de {pagination.totalPages} • Mostrando {filteredReceipts.length} recibo(s)
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all-receipts"
                checked={selectedReceipts.length === filteredReceipts.length && filteredReceipts.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="select-all-receipts" className="text-sm font-medium">
                Selecionar Todos ({selectedReceipts.length}/{filteredReceipts.length})
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReceipts.map((receipt: Receipt) => (
                <div
                  key={receipt.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors ${
                    selectedReceipts.includes(receipt.id) ? 'bg-primary/5 border-primary' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedReceipts.includes(receipt.id)}
                      onCheckedChange={(checked) => handleSelectReceipt(receipt.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {receipt.employee?.name?.charAt(0).toUpperCase() || 'R'}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{receipt.employee?.name || 'Funcionário não encontrado'}</h3>
                          <p className="text-sm text-muted-foreground">
                            {getReceiptTypeLabel(receipt)} • {receipt.month}/{receipt.year}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {receipt.days} dias • {formatCurrency(Number(receipt.dailyValue))}/dia
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(Number(receipt.value))}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Valor total
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportIndividual(receipt.id, 'pdf')}
                        disabled={isExporting === receipt.id}
                        title="Exportar PDF"
                      >
                        <FileDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleExportIndividual(receipt.id, 'csv')}
                        disabled={isExporting === receipt.id}
                        title="Exportar CSV"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(receipt)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(receipt.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {filteredReceipts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum recibo encontrado
                </div>
              )}
            </div>
          )}
          
          {/* Paginação */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                Mostrando {((pagination.page - 1) * 15) + 1} a {Math.min(pagination.page * 15, pagination.totalReceipts)} de {pagination.totalReceipts} recibos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNumber = currentPage <= 3 
                      ? i + 1 
                      : currentPage >= pagination.totalPages - 2
                        ? pagination.totalPages - 4 + i
                        : currentPage - 2 + i
                    
                    if (pageNumber > pagination.totalPages) return null
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages}
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
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
                  Tem certeza que deseja excluir este recibo? Esta ação não pode ser desfeita.
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

      {/* Modal de Copiar Recibos */}
      <CopyReceiptsDialog
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />

      {/* Modal de Confirmação de Exclusão em Lote */}
      <Dialog open={showBulkDeleteModal} onOpenChange={setShowBulkDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Excluir Recibos Selecionados
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedReceipts.length} recibo(s) selecionado(s)? 
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteModal(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir {selectedReceipts.length} Recibo(s)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
