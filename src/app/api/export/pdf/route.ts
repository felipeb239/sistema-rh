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
    const type = searchParams.get('type') || 'employees'
    const year = searchParams.get('year')
    const month = searchParams.get('month')

    // Get company settings for header
    const companySettings = await prisma.companySettings.findFirst()

    let htmlContent = ''
    let filename = ''

    // Common CSS styles
    const styles = `
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
        .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .report-title { font-size: 16px; color: #666; margin-bottom: 10px; }
        .report-date { font-size: 10px; color: #888; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; font-weight: bold; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #666; }
        .summary { margin-bottom: 20px; background-color: #f0f0f0; padding: 15px; border-radius: 5px; }
        .total { font-weight: bold; color: #333; }
      </style>
    `

    const header = `
      <div class="header">
        <div class="company-name">${companySettings?.companyName || 'Sistema de Folha de Pagamento'}</div>
        <div class="report-date">Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
      </div>
    `

    switch (type) {
      case 'employees':
        const employees = await prisma.employee.findMany({
          where: { status: 'active' },
          orderBy: { name: 'asc' }
        })

        const totalSalary = employees.reduce((sum, emp) => sum + (Number(emp.salary) || 0), 0)

        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Relatório de Funcionários</title>
            ${styles}
          </head>
          <body>
            ${header}
            <div class="report-title">Relatório de Funcionários</div>
            
            <div class="summary">
              <strong>Resumo:</strong><br>
              Total de Funcionários: ${employees.length}<br>
              <span class="total">Soma Total de Salários: R$ ${totalSalary.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><br>
              Salário Médio: R$ ${employees.length > 0 ? (totalSalary / employees.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>CPF</th>
                  <th>Cargo</th>
                  <th>Departamento</th>
                  <th>Data Admissão</th>
                  <th>Salário</th>
                </tr>
              </thead>
              <tbody>
                ${employees.map(emp => `
                  <tr>
                    <td>${emp.name}</td>
                    <td>${emp.cpf || '-'}</td>
                    <td>${emp.position || '-'}</td>
                    <td>${emp.department || '-'}</td>
                    <td>${emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('pt-BR') : '-'}</td>
                    <td>R$ ${Number(emp.salary || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              ${companySettings?.companyName || 'Sistema de Folha de Pagamento'} - Relatório de Funcionários
            </div>
          </body>
          </html>
        `
        filename = `funcionarios_${new Date().toISOString().split('T')[0]}.pdf`
        break

      case 'payroll':
        const wherePayroll: any = {}
        if (year) wherePayroll.year = parseInt(year)
        if (month) wherePayroll.month = parseInt(month)

        const payrolls = await prisma.payroll.findMany({
          where: wherePayroll,
          include: { employee: true, type: true },
          orderBy: [{ year: 'desc' }, { month: 'desc' }, { employee: { name: 'asc' } }]
        })

        const totalGross = payrolls.reduce((sum, p) => sum + Number(p.grossSalary), 0)
        const totalNet = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0)
        const totalDiscounts = totalGross - totalNet

        const periodText = year && month 
          ? `${month.toString().padStart(2, '0')}/${year}`
          : year 
          ? `Ano ${year}`
          : 'Todos os períodos'

        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Relatório de Holerites</title>
            ${styles}
          </head>
          <body>
            ${header}
            <div class="report-title">Relatório de Holerites - ${periodText}</div>
            
            <div class="summary">
              <strong>Resumo do Período:</strong><br>
              Total de Holerites: ${payrolls.length}<br>
              <span class="total">Total Salário Bruto: R$ ${totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><br>
              <span class="total">Total Descontos: R$ ${totalDiscounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><br>
              <span class="total">Total Salário Líquido: R$ ${totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Período</th>
                  <th>Salário Base</th>
                  <th>Salário Bruto</th>
                  <th>Descontos</th>
                  <th>Salário Líquido</th>
                </tr>
              </thead>
              <tbody>
                ${payrolls.map(payroll => {
                  const discounts = Number(payroll.grossSalary) - Number(payroll.netSalary)
                  return `
                    <tr>
                      <td>${payroll.employee.name}</td>
                      <td>${payroll.month.toString().padStart(2, '0')}/${payroll.year}</td>
                      <td>R$ ${Number(payroll.baseSalary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ ${Number(payroll.grossSalary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ ${discounts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>R$ ${Number(payroll.netSalary).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>

            <div class="footer">
              ${companySettings?.companyName || 'Sistema de Folha de Pagamento'} - Relatório de Holerites
            </div>
          </body>
          </html>
        `

        const periodSuffix = year && month ? `_${year}_${month.toString().padStart(2, '0')}` : year ? `_${year}` : ''
        filename = `holerites${periodSuffix}_${new Date().toISOString().split('T')[0]}.pdf`
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

        const totalValue = receipts.reduce((sum, r) => sum + Number(r.value), 0)
        const receiptPeriodText = year && month 
          ? `${month.toString().padStart(2, '0')}/${year}`
          : year 
          ? `Ano ${year}`
          : 'Todos os períodos'

        htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Relatório de Recibos</title>
            ${styles}
          </head>
          <body>
            ${header}
            <div class="report-title">Relatório de Recibos - ${receiptPeriodText}</div>
            
            <div class="summary">
              <strong>Resumo do Período:</strong><br>
              Total de Recibos: ${receipts.length}<br>
              <span class="total">Valor Total: R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span><br>
              Valor Médio por Recibo: R$ ${receipts.length > 0 ? (totalValue / receipts.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
            </div>

            <table>
              <thead>
                <tr>
                  <th>Funcionário</th>
                  <th>Tipo</th>
                  <th>Período</th>
                  <th>Valor Diário</th>
                  <th>Dias</th>
                  <th>Valor Total</th>
                </tr>
              </thead>
              <tbody>
                ${receipts.map(receipt => `
                  <tr>
                    <td>${receipt.employee.name}</td>
                                        <td>${receipt.type?.name || 'Recibo'}</td>
                    <td>${receipt.month.toString().padStart(2, '0')}/${receipt.year}</td>
                    <td>R$ ${Number(receipt.dailyValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td>${receipt.days}</td>
                    <td>R$ ${Number(receipt.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="footer">
              ${companySettings?.companyName || 'Sistema de Folha de Pagamento'} - Relatório de Recibos
            </div>
          </body>
          </html>
        `

        const receiptPeriodSuffix = year && month ? `_${year}_${month.toString().padStart(2, '0')}` : year ? `_${year}` : ''
        filename = `recibos${receiptPeriodSuffix}_${new Date().toISOString().split('T')[0]}.pdf`
        break

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 })
    }

    // For now, return HTML. In production, you'd want to use a library like puppeteer to generate actual PDF
    // This HTML can be saved as PDF by the user's browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${filename.replace('.pdf', '.html')}"`,
      },
    })

  } catch (error) {
    console.error('PDF Export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
