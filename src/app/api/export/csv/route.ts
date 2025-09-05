import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'employees' // employees, payroll, receipts
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    let csvContent = ''
    let filename = ''

    switch (type) {
      case 'employees':
        const employees = await prisma.employee.findMany({
          where: { status: 'active' },
          orderBy: { name: 'asc' }
        })

        csvContent = 'Nome,CPF,Cargo,Departamento,Data Admissao,Salario,Status\n'
        csvContent += employees.map(emp => [
          `"${emp.name}"`,
          `"${emp.cpf || ''}"`,
          `"${emp.position || ''}"`,
          `"${emp.department || ''}"`,
          emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('pt-BR') : '',
          emp.salary ? Number(emp.salary).toFixed(2) : '0.00',
          emp.status
        ].join(',')).join('\n')

        filename = `funcionarios_${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'payroll':
        const wherePayroll: any = {}
        if (year) wherePayroll.year = parseInt(year)
        if (month) wherePayroll.month = parseInt(month)

        const payrolls = await prisma.payroll.findMany({
          where: wherePayroll,
          include: { employee: true },
          orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { name: 'asc' } }]
        })

        csvContent = 'Funcionario,CPF,Mes,Ano,Salario Base,Horas Extras,Bonificacoes,Vale Alimentacao,Vale Transporte,Desconto INSS,Desconto IRRF,Plano Saude,Salario Bruto,Salario Liquido\n'
        csvContent += payrolls.map(payroll => [
          `"${payroll.employee.name}"`,
          `"${payroll.employee.cpf || ''}"`,
          payroll.month,
          payroll.year,
          Number(payroll.baseSalary).toFixed(2),
          '0.00', // overtimeHours removido
          '0.00', // bonuses removido
          '0.00', // foodAllowance removido
          '0.00', // transportAllowance removido
          Number(payroll.inssDiscount).toFixed(2),
          Number(payroll.irrfDiscount).toFixed(2),
          Number(payroll.healthInsurance).toFixed(2),
          Number(payroll.grossSalary).toFixed(2),
          Number(payroll.netSalary).toFixed(2)
        ].join(',')).join('\n')

        const periodSuffix = year && month ? `_${year}_${month.toString().padStart(2, '0')}` : year ? `_${year}` : ''
        filename = `holerites${periodSuffix}_${new Date().toISOString().split('T')[0]}.csv`
        break

      case 'receipts':
        const whereReceipts: any = {}
        if (year) whereReceipts.year = parseInt(year)
        if (month) whereReceipts.month = parseInt(month)

        const receipts = await prisma.receipt.findMany({
          where: whereReceipts,
          include: { employee: true, type: true },
          orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { name: 'asc' } }]
        })

        csvContent = 'Funcionario,CPF,Tipo,Mes,Ano,Valor Diario,Dias,Valor Total\n'
        csvContent += receipts.map(receipt => [
          `"${receipt.employee.name}"`,
          `"${receipt.employee.cpf || ''}"`,
                    receipt.type?.name || 'Recibo',
          receipt.month,
          receipt.year,
          Number(receipt.dailyValue).toFixed(2),
          receipt.days,
          Number(receipt.value).toFixed(2)
        ].join(',')).join('\n')

        const receiptPeriodSuffix = year && month ? `_${year}_${month.toString().padStart(2, '0')}` : year ? `_${year}` : ''
        filename = `recibos${receiptPeriodSuffix}_${new Date().toISOString().split('T')[0]}.csv`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // Add BOM for proper UTF-8 encoding in Excel
    const bomCSV = '\uFEFF' + csvContent

    return new NextResponse(bomCSV, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('CSV Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
