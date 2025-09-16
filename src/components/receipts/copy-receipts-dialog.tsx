'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Copy, 
  Calendar, 
  Users, 
  Receipt as ReceiptIcon,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface CopyReceiptsDialogProps {
  open: boolean
  onClose: () => void
  currentMonth: number
  currentYear: number
}

interface Receipt {
  id: string
  employeeId: string
  typeId: string
  month: number
  year: number
  dailyValue: number
  days: number
  value: number
  employee: {
    id: string
    name: string
    position?: string
  }
  type: {
    id: string
    name: string
  }
}

async function fetchReceiptsFromMonth(month: number, year: number, page: number = 1) {
  const response = await fetch(`/api/receipts?month=${month}&year=${year}&page=${page}`)
  if (!response.ok) {
    throw new Error('Erro ao buscar recibos')
  }
  return response.json()
}

async function copyReceipts(receipts: Receipt[], targetMonth: number, targetYear: number) {
  const response = await fetch('/api/receipts/copy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      receipts,
      targetMonth,
      targetYear
    }),
  })
  if (!response.ok) {
    throw new Error('Erro ao copiar recibos')
  }
  return response.json()
}

export function CopyReceiptsDialog({ 
  open, 
  onClose, 
  currentMonth, 
  currentYear 
}: CopyReceiptsDialogProps) {
  const [sourceMonth, setSourceMonth] = useState(1)
  const [sourceYear, setSourceYear] = useState(currentYear)
  const [selectedReceipts, setSelectedReceipts] = useState<string[]>([])
  const [isCopying, setIsCopying] = useState(false)
  const [editingReceipts, setEditingReceipts] = useState<{ [key: string]: Partial<Receipt> }>({})
  const [currentPage, setCurrentPage] = useState(1)

  const queryClient = useQueryClient()

  // Buscar recibos do mês de origem
  const { data: receiptsData, isLoading } = useQuery({
    queryKey: ['receipts', sourceMonth, sourceYear, currentPage],
    queryFn: () => fetchReceiptsFromMonth(sourceMonth, sourceYear, currentPage),
    enabled: open
  })

  const receipts = receiptsData?.receipts || []
  const pagination = receiptsData?.pagination

  // Mutation para copiar recibos
  const copyMutation = useMutation({
    mutationFn: (data: { receipts: Receipt[], targetMonth: number, targetYear: number }) => 
      copyReceipts(data.receipts, data.targetMonth, data.targetYear),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] })
      onClose()
      setSelectedReceipts([])
      setEditingReceipts({})
    }
  })

  // Atualizar ano quando mês muda
  useEffect(() => {
    if (sourceMonth === 12 && currentMonth === 1) {
      setSourceYear(currentYear - 1)
    } else if (sourceMonth === 1 && currentMonth === 12) {
      setSourceYear(currentYear + 1)
    } else {
      setSourceYear(currentYear)
    }
    setCurrentPage(1) // Resetar página quando mudar mês/ano
  }, [sourceMonth, currentMonth, currentYear])

  // Inicializar com mês anterior correto
  useEffect(() => {
    if (open) {
      const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
      const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear
      setSourceMonth(prevMonth)
      setSourceYear(prevYear)
      setCurrentPage(1)
    }
  }, [open, currentMonth, currentYear])

  // Funções de paginação
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (pagination && currentPage < pagination.totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }


  const handleSelectReceipt = (receiptId: string, checked: boolean) => {
    if (checked) {
      setSelectedReceipts(prev => [...prev, receiptId])
    } else {
      setSelectedReceipts(prev => prev.filter(id => id !== receiptId))
      // Remover edições do recibo desmarcado
      setEditingReceipts(prev => {
        const newEditing = { ...prev }
        delete newEditing[receiptId]
        return newEditing
      })
    }
  }

  const handleEditReceipt = (receiptId: string, field: keyof Receipt, value: any) => {
    setEditingReceipts(prev => ({
      ...prev,
      [receiptId]: {
        ...prev[receiptId],
        [field]: value
      }
    }))
  }

  const handleCopy = async () => {
    if (selectedReceipts.length === 0) {
      toast.error('Selecione pelo menos um recibo para copiar')
      return
    }

    setIsCopying(true)
    try {
      const receiptsToCopy = selectedReceipts.map(id => {
        const originalReceipt = receipts.find((r: Receipt) => r.id === id)
        const edits = editingReceipts[id] || {}
        
        if (!originalReceipt) {
          console.error('❌ Recibo original não encontrado para ID:', id)
          return null // Pular este recibo em vez de falhar
        }
        
        const dailyValue = parseFloat(edits.dailyValue || originalReceipt.dailyValue) || 0
        const days = parseInt(edits.days || originalReceipt.days) || 0
        const value = dailyValue * days
        
        const receiptData = {
          employeeId: originalReceipt.employeeId,
          typeId: originalReceipt.typeId,
          dailyValue: dailyValue,
          days: days,
          value: value,
          month: currentMonth,
          year: currentYear
        }
        
        console.log('📋 Copiando recibo:', {
          id: originalReceipt.id,
          employee: originalReceipt.employee?.name,
          type: originalReceipt.type?.name,
          dailyValue,
          days,
          value
        })
        
        return receiptData
      }).filter(Boolean) // Remove recibos nulos

      console.log('📤 Enviando para API:', {
        receipts: receiptsToCopy,
        targetMonth: currentMonth,
        targetYear: currentYear
      })

      await copyMutation.mutateAsync({
        receipts: receiptsToCopy,
        targetMonth: currentMonth,
        targetYear: currentYear
      })

      toast.success(`${selectedReceipts.length} recibo(s) copiado(s) com sucesso!`)
    } catch (error) {
      console.error('Erro ao copiar recibos:', error)
      toast.error('Erro ao copiar recibos. Tente novamente.')
    } finally {
      setIsCopying(false)
    }
  }

  const getMonthName = (month: number) => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1]
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Copiar Recibos do Mês Anterior
          </DialogTitle>
          <DialogDescription>
            Selecione os recibos de {getMonthName(sourceMonth)}/{sourceYear} para copiar para {getMonthName(currentMonth)}/{currentYear}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Filtros */}
          <div className="flex gap-4 items-end">
            <div className="space-y-2">
              <Label>Mês de Origem</Label>
              <Select
                value={sourceMonth.toString()}
                onValueChange={(value) => setSourceMonth(parseInt(value))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={(i + 1).toString()}>
                      {getMonthName(i + 1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ano de Origem</Label>
              <Select
                value={sourceYear.toString()}
                onValueChange={(value) => setSourceYear(parseInt(value))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 3 }, (_, i) => {
                    const year = currentYear - i
                    return (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1" />
            
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  try {
                    setIsCopying(true)
                    
                    const response = await fetch('/api/receipts/copy-all', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        sourceMonth,
                        sourceYear,
                        targetMonth: currentMonth,
                        targetYear: currentYear
                      })
                    })

                    if (!response.ok) {
                      const error = await response.json()
                      throw new Error(error.error || 'Erro ao copiar recibos')
                    }

                    const result = await response.json()
                    toast.success(result.message)
                    
                    // Atualizar a lista de recibos
                    queryClient.invalidateQueries({ queryKey: ['receipts'] })
                    onClose()
                    
                  } catch (error) {
                    console.error('Erro ao copiar todos os recibos:', error)
                    toast.error(error instanceof Error ? error.message : 'Erro ao copiar recibos')
                  } finally {
                    setIsCopying(false)
                  }
                }}
                disabled={receipts.length === 0 || isCopying}
              >
                {isCopying ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Copiando...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Todos do Mês
                  </>
                )}
              </Button>
              
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <span>
                    Página {pagination.page} de {pagination.totalPages} 
                    ({pagination.totalReceipts} recibo(s) total)
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lista de Recibos */}
          <div className="flex-1 overflow-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : receipts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <ReceiptIcon className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Nenhum recibo encontrado em {getMonthName(sourceMonth)}/{sourceYear}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {receipts.map((receipt: Receipt) => {
                  const isSelected = selectedReceipts.includes(receipt.id)
                  const edits = editingReceipts[receipt.id] || {}
                  
                  return (
                    <Card key={receipt.id} className={isSelected ? 'border-primary bg-primary/5' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => handleSelectReceipt(receipt.id, checked as boolean)}
                          />
                          
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* Informações do Funcionário */}
                            <div>
                              <h4 className="font-medium">{receipt.employee.name}</h4>
                              <p className="text-sm text-muted-foreground">{receipt.employee.position}</p>
                            </div>

                            {/* Tipo de Recibo */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Tipo</Label>
                              <p className="text-sm font-medium">{receipt.type.name}</p>
                            </div>

                            {/* Valor Diário */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Valor Diário</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={edits.dailyValue || receipt.dailyValue}
                                onChange={(e) => handleEditReceipt(receipt.id, 'dailyValue', parseFloat(e.target.value) || 0)}
                                className="h-8 text-sm"
                                disabled={!isSelected}
                              />
                            </div>

                            {/* Dias */}
                            <div>
                              <Label className="text-xs text-muted-foreground">Dias</Label>
                              <Input
                                type="number"
                                value={edits.days || receipt.days}
                                onChange={(e) => handleEditReceipt(receipt.id, 'days', parseInt(e.target.value) || 0)}
                                className="h-8 text-sm"
                                disabled={!isSelected}
                              />
                            </div>
                          </div>

                          {/* Valor Total */}
                          <div className="text-right">
                            <Label className="text-xs text-muted-foreground">Valor Total</Label>
                            <p className="text-lg font-bold text-primary">
                              {formatCurrency((edits.dailyValue || receipt.dailyValue) * (edits.days || receipt.days))}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </div>

          {/* Controles de Paginação */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === pagination.totalPages}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-muted-foreground">
                {selectedReceipts.length} de {pagination.totalReceipts} selecionado(s)
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCopying}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCopy} 
            disabled={isCopying || selectedReceipts.length === 0}
          >
            {isCopying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Copiando...
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copiar {selectedReceipts.length} Recibo(s)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
