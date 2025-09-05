'use client'

import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  FileText, 
  Receipt, 
  TrendingUp,
  Download,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { useState } from 'react'

async function fetchDashboardData() {
  const response = await fetch('/api/dashboard')
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data')
  }
  return response.json()
}

export function DashboardContent() {
  const { data: session } = useSession()
  const [isExporting, setIsExporting] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboardData,
  })

  const handleExport = async (type: 'csv' | 'pdf', exportType: 'employees' | 'payroll' | 'receipts' = 'employees') => {
    try {
      setIsExporting(true)
      const url = `/api/export/${type}?type=${exportType}&year=${selectedYear}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Erro ao exportar dados')
      }

      if (type === 'csv') {
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${exportType}_${selectedYear}.csv`
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
      alert('Erro ao exportar dados. Tente novamente.')
    } finally {
      setIsExporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo, {session?.user?.name || session?.user?.username}!
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Funcionários
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.totalEmployees || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Funcionários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Holerites Emitidos
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.totalPayrolls || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recibos Emitidos
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboardData?.totalReceipts || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Este ano
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gastos Mensais
            </CardTitle>
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

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Funcionários</CardTitle>
            <CardDescription>
              Gerencie os funcionários da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/employees">
                <Users className="mr-2 h-4 w-4" />
                Ver Funcionários
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/employees?action=create">
                <Plus className="mr-2 h-4 w-4" />
                Novo Funcionário
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Holerites</CardTitle>
            <CardDescription>
              Emita e gerencie holerites
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/payroll">
                <FileText className="mr-2 h-4 w-4" />
                Ver Holerites
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/payroll?action=create">
                <Plus className="mr-2 h-4 w-4" />
                Novo Holerite
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recibos</CardTitle>
            <CardDescription>
              Emita recibos de vale transporte e alimentação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full">
              <Link href="/receipts">
                <Receipt className="mr-2 h-4 w-4" />
                Ver Recibos
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/receipts?action=create">
                <Plus className="mr-2 h-4 w-4" />
                Novo Recibo
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Exportações</CardTitle>
          <CardDescription>
            Exporte relatórios e dados do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <label htmlFor="year-select" className="text-sm font-medium">
              Ano para exportação:
            </label>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 10 }, (_, i) => {
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
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv', 'employees')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Funcionários CSV'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf', 'employees')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Funcionários PDF'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv', 'payroll')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Holerites CSV'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf', 'payroll')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Holerites PDF'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv', 'receipts')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Recibos CSV'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('pdf', 'receipts')}
              disabled={isExporting}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Recibos PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
