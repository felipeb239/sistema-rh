'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Calendar,
  Download, 
  FileText, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertCircle,
  Receipt
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { NewPayrollModal } from './new-payroll-modal'
import { DeletePayrollModal } from './delete-payroll-modal'

interface PayrollSummary {
  id: string
  employeeId: string
  month: number
  year: number
  baseSalary: number
  grossSalary: number
  netSalary: number
  employee: {
    id: string
    name: string
    position?: string
    department?: string
  }
}

interface FolhaTotals {
  totalGrossSalary: number
  totalNetSalary: number
  totalDiscounts: number
  totalFgtsAmount: number
  count: number
}

export function FolhaPagamentoContent() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Buscar dados da folha
  const { data: folhaData, isLoading, refetch } = useQuery({
    queryKey: ['folha-pagamento', selectedMonth, selectedYear],
    queryFn: async () => {
      const response = await fetch(`/api/reports/payroll?month=${selectedMonth}&year=${selectedYear}`)
      if (!response.ok) throw new Error('Erro ao buscar dados da folha')
      return response.json()
    }
  })

  // Buscar dados do dashboard
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard')
      if (!response.ok) throw new Error('Erro ao buscar dados do dashboard')
      return response.json()
    }
  })

  const handleExportFolha = async () => {
    try {
      // Abrir em nova aba para impressão/PDF
      const url = `/api/reports/payroll/export-print?month=${selectedMonth}&year=${selectedYear}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Erro ao exportar folha:', error)
      alert('Erro ao exportar folha de pagamento')
    }
  }

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
    for (let year = currentYear - 5; year <= currentYear + 1; year++) {
      years.push(year)
    }
    return years
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Emita e gerencie folhas de pagamento por período
          </p>
        </div>
      </div>

      {/* Métricas Gerais do Sistema */}
      {dashboardData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalEmployees || 0}</div>
              <p className="text-xs text-muted-foreground">
                Funcionários ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Holerites do Ano</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalPayrolls || 0}</div>
              <p className="text-xs text-muted-foreground">
                Emitidos em {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recibos do Ano</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalReceipts || 0}</div>
              <p className="text-xs text-muted-foreground">
                Emitidos em {selectedYear}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gastos Anuais</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  dashboardData?.monthlyExpenses?.reduce((sum: number, month: any) => sum + Number(month.totalExpenses), 0) || 0
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Total do ano
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Informações do Fluxo */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fluxo de Trabalho
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-medium text-blue-800">Configure Rubricas</p>
                <p className="text-blue-600">Vá para a aba "Rubricas" para criar e gerenciar rubricas</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">2</div>
              <div>
                <p className="font-medium text-blue-800">Aplique aos Funcionários</p>
                <p className="text-blue-600">Configure rubricas específicas para cada funcionário</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">3</div>
              <div>
                <p className="font-medium text-blue-800">Emita a Folha</p>
                <p className="text-blue-600">Gere a folha de pagamento com as rubricas aplicadas</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
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

      {/* Resumo da Folha */}
      {folhaData && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{folhaData.totals.count}</div>
              <p className="text-xs text-muted-foreground">
                Holerites emitidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salário Bruto Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(folhaData.totals.totalGrossSalary)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor total bruto
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Descontos</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(folhaData.totals.totalDiscounts)}
              </div>
              <p className="text-xs text-muted-foreground">
                Descontos aplicados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Salário Líquido Total</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(folhaData.totals.totalNetSalary)}
              </div>
              <p className="text-xs text-muted-foreground">
                Valor líquido total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ações da Folha */}
      <Card>
        <CardHeader>
          <CardTitle>Ações da Folha</CardTitle>
          <CardDescription>
            Gerencie e exporte a folha de pagamento de {getMonthName(selectedMonth)} de {selectedYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <NewPayrollModal onPayrollGenerated={() => refetch()} />
            <Button onClick={handleExportFolha} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar Folha Completa (PDF)
            </Button>
            <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Atualizar Dados
            </Button>
            {folhaData && folhaData.totals.count > 0 && (
              <DeletePayrollModal 
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                onPayrollDeleted={() => refetch()}
              />
            )}
          </div>
        </CardContent>
      </Card>


      {/* Lista de Holerites da Folha */}
      <Card>
        <CardHeader>
          <CardTitle>Holerites da Folha</CardTitle>
          <CardDescription>
            {folhaData ? `${folhaData.totals.count} holerite(s) na folha de ${getMonthName(selectedMonth)}/${selectedYear}` : 'Selecione um período'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : folhaData && folhaData.payrolls.length > 0 ? (
            <div className="space-y-4">
              {folhaData.payrolls.map((payroll: PayrollSummary) => {
                const totalDiscounts = payroll.grossSalary - payroll.netSalary

                return (
                  <div
                    key={payroll.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-foreground">
                            {payroll.employee.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium">{payroll.employee.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {payroll.employee.position} • {payroll.employee.department}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Bruto: </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(payroll.grossSalary)}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Descontos: </span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(totalDiscounts)}
                        </span>
                      </div>
                      <div className="text-sm font-semibold">
                        <span className="text-muted-foreground">Líquido: </span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(payroll.netSalary)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum holerite encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Não há holerites para {getMonthName(selectedMonth)} de {selectedYear}.
              </p>
              <NewPayrollModal onPayrollGenerated={() => refetch()} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
