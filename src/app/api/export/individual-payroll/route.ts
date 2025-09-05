import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatCPF, getMonthName } from '@/lib/utils'
import { CompanySettings } from '@/types'

function getLastDayOfMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate()
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const payrollId = searchParams.get('id')
    const format = searchParams.get('format') || 'pdf' // 'pdf' or 'csv'

    if (!payrollId) {
      return NextResponse.json({ error: 'ID do holerite é obrigatório' }, { status: 400 })
    }

    const payroll = await prisma.payroll.findUnique({
      where: { id: payrollId },
      include: { employee: true }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Holerite não encontrado' }, { status: 404 })
    }

    const companySettings: CompanySettings | null = await prisma.companySettings.findFirst()

    if (format === 'csv') {
      // CSV Export
      const headers = [
        'Funcionário', 'CPF', 'Cargo', 'Mês/Ano',
        'Salário Base', 'Horas Extras', 'Taxa Hora Extra', 'Bônus',
        'Vale Alimentação', 'Vale Transporte', 'Outros Benefícios',
        'Desconto INSS', 'Desconto IRRF', 'Desconto Plano Saúde', 'Outros Descontos',
        'Salário Bruto', 'Salário Líquido'
      ]
      
      const csvContent = headers.join(';') + '\n' + [
        payroll.employee?.name || '',
        formatCPF(payroll.employee?.cpf || ''),
        payroll.employee?.position || '',
        `${getMonthName(payroll.month)}/${payroll.year}`,
        payroll.baseSalary.toFixed(2).replace('.', ','),
        '0,00', // overtimeHours removido
        '0,00', // overtimeRate removido
        '0,00', // bonuses removido
        '0,00', // foodAllowance removido
        '0,00', // transportAllowance removido
        '0,00', // otherBenefits removido
        payroll.inssDiscount.toFixed(2).replace('.', ','),
        payroll.irrfDiscount.toFixed(2).replace('.', ','),
        payroll.healthInsurance.toFixed(2).replace('.', ','),
        payroll.otherDiscounts.toFixed(2).replace('.', ','),
        payroll.grossSalary.toFixed(2).replace('.', ','),
        payroll.netSalary.toFixed(2).replace('.', ',')
      ].join(';') + '\n'

      const bom = '\ufeff'
      const finalCsvContent = bom + csvContent

      return new NextResponse(finalCsvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="holerite_${payroll.employee?.name?.replace(/\s+/g, '_')}_${payroll.month}_${payroll.year}.csv"`
        }
      })
    } else {
      // PDF Export (HTML format for printing)
      const fgts = (Number(payroll.grossSalary) * 0.08).toFixed(2)
      const totalDiscounts = Number(payroll.grossSalary) - Number(payroll.netSalary)

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Holerite - ${payroll.employee?.name} - ${getMonthName(payroll.month)}/${payroll.year}</title>
            <style>
                @page { margin: 10mm; size: A4; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 9pt; line-height: 1.2; }
                .container { max-width: 100%; }
                .header { background-color: #2c3e50; color: white; padding: 8px; text-align: center; margin-bottom: 10px; }
                .header h1 { margin: 0; font-size: 12pt; font-weight: bold; }
                .company-info { background-color: #f8f9fa; padding: 8px; border: 1px solid #ddd; margin-bottom: 10px; }
                .company-name { font-weight: bold; font-size: 10pt; margin-bottom: 4px; }
                .company-details { font-size: 8pt; color: #666; }
                .employee-section { background-color: #e9ecef; padding: 8px; border: 1px solid #ddd; margin-bottom: 10px; }
                .employee-title { font-weight: bold; font-size: 10pt; margin-bottom: 6px; }
                .employee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .employee-item { display: flex; justify-content: space-between; }
                .employee-label { font-weight: bold; }
                .main-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 8pt; }
                .main-table th, .main-table td { border: 1px solid #333; padding: 4px; text-align: left; }
                .main-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
                .main-table .text-right { text-align: right; }
                .main-table .text-center { text-align: center; }
                .total-section { background-color: #f8f9fa; padding: 8px; border: 1px solid #ddd; margin-bottom: 10px; }
                .total-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
                .total-item { text-align: center; }
                .total-label { font-size: 8pt; color: #666; }
                .total-value { font-size: 10pt; font-weight: bold; }
                .summary-section { background-color: #e9ecef; padding: 8px; border: 1px solid #ddd; margin-bottom: 10px; }
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 8px; font-size: 8pt; }
                .summary-item { display: flex; justify-content: space-between; }
                .signature-section { margin-top: 15px; text-align: center; font-size: 8pt; }
                .signature-line { border-top: 1px solid #333; margin-top: 20px; padding-top: 5px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>RECIBO DE PAGAMENTO FOLHA MENSAL</h1>
                </div>

                <div class="company-info">
                    <div class="company-name">${companySettings?.companyName || 'Nome da Empresa'}</div>
                    <div class="company-details">
                        CNPJ: ${companySettings?.cnpj || ''} | 
                        ${companySettings?.address || ''} - ${companySettings?.city || ''} - ${companySettings?.state || ''} | 
                        Tel: ${companySettings?.phone || ''} | 
                        Referência: ${getMonthName(payroll.month)}/${payroll.year}
                    </div>
                </div>

                <div class="employee-section">
                    <div class="employee-title">PAGAMENTO</div>
                    <div class="employee-grid">
                        <div class="employee-item">
                            <span class="employee-label">Nome:</span>
                            <span>${payroll.employee?.name || ''}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">Função:</span>
                            <span>${payroll.employee?.position || ''}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">Seção:</span>
                            <span>${payroll.employee?.department || ''}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">CPF:</span>
                            <span>${formatCPF(payroll.employee?.cpf || '')}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">Admissão:</span>
                            <span>${formatDate(payroll.employee?.hireDate || new Date())}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">PIS:</span>
                            <span>${payroll.employee?.cpf || ''}</span>
                        </div>
                        <div class="employee-item">
                            <span class="employee-label">Período:</span>
                            <span>01/${payroll.month.toString().padStart(2, '0')}/${payroll.year} a ${getLastDayOfMonth(payroll.month, payroll.year)}/${payroll.month.toString().padStart(2, '0')}/${payroll.year}</span>
                        </div>
                    </div>
                </div>

                <table class="main-table">
                    <thead>
                        <tr>
                            <th style="width: 8%;">Código</th>
                            <th style="width: 40%;">Descrição</th>
                            <th style="width: 12%;">Referência</th>
                            <th style="width: 20%;">Vencimentos</th>
                            <th style="width: 20%;">Descontos</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="text-center">1</td>
                            <td>SALARIO</td>
                            <td class="text-center">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.baseSalary))}</td>
                            <td class="text-right">-</td>
                        </tr>
                        <!-- Campos removidos: overtimeHours, bonuses, foodAllowance, transportAllowance, otherBenefits -->
                        ${Number(payroll.inssDiscount) > 0 ? `
                        <tr>
                            <td class="text-center">2801</td>
                            <td>INSS</td>
                            <td class="text-center">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.inssDiscount))}</td>
                        </tr>
                        ` : ''}
                        ${Number(payroll.irrfDiscount) > 0 ? `
                        <tr>
                            <td class="text-center">2804</td>
                            <td>IRRF</td>
                            <td class="text-center">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.irrfDiscount))}</td>
                        </tr>
                        ` : ''}
                        ${Number(payroll.healthInsurance) > 0 ? `
                        <tr>
                            <td class="text-center">3405</td>
                            <td>PLANO DE SAÚDE</td>
                            <td class="text-center">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.healthInsurance))}</td>
                        </tr>
                        ` : ''}
                        ${Number(payroll.otherDiscounts) > 0 ? `
                        <tr>
                            <td class="text-center">3406</td>
                            <td>OUTROS DESCONTOS</td>
                            <td class="text-center">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.otherDiscounts))}</td>
                        </tr>
                        ` : ''}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-grid">
                        <div class="total-item">
                            <div class="total-label">Total de Vencimentos</div>
                            <div class="total-value">${formatCurrency(Number(payroll.grossSalary))}</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Total de Descontos</div>
                            <div class="total-value">${formatCurrency(totalDiscounts)}</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Valor Líquido</div>
                            <div class="total-value">${formatCurrency(Number(payroll.netSalary))}</div>
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <div class="summary-grid">
                        <div class="summary-item">
                            <span>Sal. Base:</span>
                            <span>${formatCurrency(Number(payroll.baseSalary))}</span>
                        </div>
                        <div class="summary-item">
                            <span>Sal. Contr. INSS:</span>
                            <span>${formatCurrency(Number(payroll.baseSalary))}</span>
                        </div>
                        <div class="summary-item">
                            <span>Base de Cálc. FGTS:</span>
                            <span>${formatCurrency(Number(payroll.grossSalary))}</span>
                        </div>
                        <div class="summary-item">
                            <span>F.G.T.S. do Mês:</span>
                            <span>${formatCurrency(Number(fgts))}</span>
                        </div>
                        <div class="summary-item">
                            <span>Base do I.R.R.F.:</span>
                            <span>${formatCurrency(Number(payroll.grossSalary) - Number(payroll.inssDiscount))}</span>
                        </div>
                        <div class="summary-item">
                            <span>Dep. IRRF:</span>
                            <span>01</span>
                        </div>
                    </div>
                </div>

                <div class="signature-section">
                    <p>Declaro ter Recebido a importância líquida discriminada neste recibo</p>
                    <div class="signature-line">
                        <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                            <span>DATA: _______________</span>
                            <span>ASSINATURA: _______________</span>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
      `

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html'
        }
      })
    }
  } catch (error) {
    console.error('Individual payroll export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}