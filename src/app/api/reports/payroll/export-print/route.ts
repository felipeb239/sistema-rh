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
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json({ 
        error: 'Mês e ano são obrigatórios' 
      }, { status: 400 })
    }

    const monthNum = parseInt(month)
    const yearNum = parseInt(year)

    // Buscar holerites do mês/ano especificado
    const payrolls = await prisma.payroll.findMany({
      where: {
        month: monthNum,
        year: yearNum
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            position: true,
            department: true
          }
        }
      },
      orderBy: {
        employee: {
          name: 'asc'
        }
      }
    })

    // Buscar recibos do período para resumo discriminado
    const receipts = await prisma.receipt.findMany({
      where: {
        month: monthNum,
        year: yearNum
      },
      include: {
        type: true,
        employee: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        type: {
          name: 'asc'
        }
      }
    })

    // Buscar configurações da empresa
    const companySettings = await prisma.companySettings.findFirst()

    // Calcular totais detalhados
    const totals = {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDiscounts: 0,
      count: payrolls.length,
      // Totais detalhados por tipo de desconto
      totalInss: 0,
      totalIrrf: 0,
      totalHealthInsurance: 0,
      totalDentalInsurance: 0,
      totalCustomDiscounts: 0,
      totalOtherDiscounts: 0,
      // Totais de proventos
      totalBaseSalary: 0
    }

    payrolls.forEach(payroll => {
      totals.totalGrossSalary += Number(payroll.grossSalary)
      totals.totalNetSalary += Number(payroll.netSalary)
      totals.totalBaseSalary += Number(payroll.baseSalary)
      
      // Descontos detalhados
      const inssValue = Number(payroll.inssDiscount)
      const irrfValue = Number(payroll.irrfDiscount)
      const healthValue = Number(payroll.healthInsurance)
      const dentalValue = Number(payroll.dentalInsurance)
      const customValue = Number(payroll.customDiscount)
      const otherValue = Number(payroll.otherDiscounts)
      
      totals.totalInss += inssValue
      totals.totalIrrf += irrfValue
      totals.totalHealthInsurance += healthValue
      totals.totalDentalInsurance += dentalValue
      totals.totalCustomDiscounts += customValue
      totals.totalOtherDiscounts += otherValue
      
      const totalDiscounts = inssValue + irrfValue + healthValue + dentalValue + customValue + otherValue
      totals.totalDiscounts += totalDiscounts
    })

    // Gerar HTML otimizado para impressão
    const htmlContent = generatePrintHTML(payrolls, totals, companySettings, monthNum, yearNum, receipts)

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="folha-pagamento-${monthNum.toString().padStart(2, '0')}-${yearNum}.html"`
      }
    })

  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function generatePrintHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number, receipts: any[]): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  
  const monthName = months[month - 1] || 'Mês'
  const companyName = companySettings?.companyName || 'Empresa'
  
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Calcular resumo dos recibos por tipo
  const receiptSummary = receipts.reduce((acc: any, receipt) => {
    const typeName = receipt.type.name
    if (!acc[typeName]) {
      acc[typeName] = {
        count: 0,
        totalValue: 0,
        type: receipt.type
      }
    }
    acc[typeName].count += 1
    acc[typeName].totalValue += Number(receipt.value)
    return acc
  }, {})

  // Converter para array e ordenar por valor total
  const receiptSummaryArray = Object.values(receiptSummary).sort((a: any, b: any) => b.totalValue - a.totalValue)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Folha de Pagamento - ${monthName}/${year}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10px;
            line-height: 1.2;
            color: #333;
            background: white;
        }
        
        .print-buttons {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 1000;
            display: flex;
            gap: 10px;
        }
        
        .print-button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
        }
        
        .print-button:hover {
            background: #0056b3;
        }
        
        .print-button.print {
            background: #28a745;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 15mm;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .period {
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .generated-date {
            font-size: 9px;
            color: #666;
            margin-top: 3px;
        }
        
        .summary-section {
            background: #f8f9fa;
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-item .label {
            font-size: 8px;
            color: #666;
            margin-bottom: 3px;
        }
        
        .summary-item .value {
            font-size: 11px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .summary-item.total .value {
            color: #27ae60;
            font-size: 12px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            font-size: 9px;
        }
        
        th {
            background: #34495e;
            color: white;
            padding: 6px 4px;
            font-weight: bold;
            font-size: 8px;
        }
        
        /* Alinhamento específico dos títulos das colunas */
        th:nth-child(1), /* # */
        th:nth-child(2), /* Funcionário */
        th:nth-child(3)  /* Cargo */
        {
            text-align: left;
        }
        
        th:nth-child(4), /* Salário Bruto */
        th:nth-child(5), /* Descontos */
        th:nth-child(6)  /* Salário Líquido */
        {
            text-align: right;
        }
        
        td {
            padding: 4px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .currency {
            font-family: 'Courier New', monospace;
            font-weight: bold;
        }
        
        .totals-section {
            background: #2c3e50;
            color: white;
            padding: 10px;
            border-radius: 3px;
            margin-bottom: 15px;
        }
        
        .totals-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
        }
        
        .total-item {
            text-align: center;
        }
        
        .total-item .label {
            font-size: 8px;
            opacity: 0.8;
            margin-bottom: 3px;
        }
        
        .total-item .value {
            font-size: 10px;
            font-weight: bold;
        }
        
        .total-item.main .value {
            font-size: 12px;
            color: #27ae60;
        }
        
        @media print {
            .print-buttons {
                display: none;
            }
            
            body {
                font-size: 9px;
            }
            
            .container {
                padding: 10mm;
            }
            
            .summary-section {
                grid-template-columns: repeat(4, 1fr);
            }
            
            .totals-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        
        /* Cards de Descontos - Padrão Simples */
        .deductions-summary-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
        }
        
        .deductions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .deduction-card {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            text-align: center;
        }
        
        .deduction-type {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 10px;
        }
        
        .deduction-count {
            color: #6c757d;
            font-size: 8px;
            margin-bottom: 5px;
        }
        
        .deduction-total {
            font-weight: bold;
            color: #e74c3c;
            font-size: 11px;
        }
        
        /* Cards de Proventos - Padrão Simples */
        .earnings-summary-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
        }
        
        .earnings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .earning-card {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            text-align: center;
        }
        
        .earning-type {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 10px;
        }
        
        .earning-count {
            color: #6c757d;
            font-size: 8px;
            margin-bottom: 5px;
        }
        
        .earning-total {
            font-weight: bold;
            color: #27ae60;
            font-size: 11px;
        }
        
        /* Cards de Recibos (mantido) */
        .receipts-summary-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 15px;
            border: 1px solid #e9ecef;
        }
        
        .receipts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 10px;
        }
        
        .receipt-summary-item {
            background: white;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #dee2e6;
            text-align: center;
        }
        
        .receipt-type {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
            font-size: 10px;
        }
        
        .receipt-count {
            color: #6c757d;
            font-size: 8px;
            margin-bottom: 3px;
        }
        
        .receipt-total {
            font-weight: bold;
            color: #27ae60;
            font-size: 11px;
        }
        
        @page {
            size: A4;
            margin: 10mm;
        }
    </style>
</head>
<body>
    <div class="print-buttons">
        <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
        <button class="print-button print" onclick="saveAsPDF()">📄 Salvar como PDF</button>
    </div>
    
    <div class="container">
        <!-- Cabeçalho -->
        <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="period">FOLHA DE PAGAMENTO - ${monthName.toUpperCase()}/${year}</div>
            <div class="generated-date">Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
        </div>
        
        <!-- Resumo Executivo -->
        <div class="summary-section">
            <div class="summary-item">
                <div class="label">Funcionários</div>
                <div class="value">${totals.count}</div>
            </div>
            <div class="summary-item">
                <div class="label">Salário Bruto Total</div>
                <div class="value currency">${formatCurrency(totals.totalGrossSalary)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total de Descontos</div>
                <div class="value currency">${formatCurrency(totals.totalDiscounts)}</div>
            </div>
            <div class="summary-item total">
                <div class="label">Salário Líquido Total</div>
                <div class="value currency">${formatCurrency(totals.totalNetSalary)}</div>
            </div>
        </div>
        
        <!-- Tabela de Funcionários -->
        <table>
            <thead>
                <tr>
                    <th style="width: 5%;">#</th>
                    <th style="width: 35%;">Funcionário</th>
                    <th style="width: 20%;">Cargo</th>
                    <th style="width: 15%;">Salário Bruto</th>
                    <th style="width: 15%;">Descontos</th>
                    <th style="width: 15%;">Salário Líquido</th>
                </tr>
            </thead>
            <tbody>
                ${payrolls.map((payroll, index) => {
                  const totalDiscounts = Number(payroll.inssDiscount) + 
                                       Number(payroll.irrfDiscount) + 
                                       Number(payroll.healthInsurance) + 
                                       Number(payroll.dentalInsurance) + 
                                       Number(payroll.customDiscount) + 
                                       Number(payroll.otherDiscounts)
                  
                  return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${payroll.employee.name}</td>
                        <td>${payroll.employee.position || '-'}</td>
                        <td class="text-right currency">${formatCurrency(Number(payroll.grossSalary))}</td>
                        <td class="text-right currency">${formatCurrency(totalDiscounts)}</td>
                        <td class="text-right currency">${formatCurrency(Number(payroll.netSalary))}</td>
                    </tr>
                  `
                }).join('')}
            </tbody>
        </table>
        
        <!-- Totais -->
        <div class="totals-section">
            <div class="totals-grid">
                <div class="total-item">
                    <div class="label">Funcionários</div>
                    <div class="value">${totals.count}</div>
                </div>
                <div class="total-item">
                    <div class="label">Salário Bruto</div>
                    <div class="value currency">${formatCurrency(totals.totalGrossSalary)}</div>
                </div>
                <div class="total-item">
                    <div class="label">Total Descontos</div>
                    <div class="value currency">${formatCurrency(totals.totalDiscounts)}</div>
                </div>
                <div class="total-item main">
                    <div class="label">Salário Líquido</div>
                    <div class="value currency">${formatCurrency(totals.totalNetSalary)}</div>
                </div>
            </div>
        </div>
        
        <!-- Cards de Descontos Detalhados -->
        <div class="deductions-summary-section">
            <h3 style="color: #2c3e50; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                RESUMO DETALHADO DOS DESCONTOS
            </h3>
            <div class="deductions-grid">
                <div class="deduction-card">
                    <div class="deduction-type">INSS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalInss)}</div>
                </div>
                <div class="deduction-card">
                    <div class="deduction-type">IRRF</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalIrrf)}</div>
                </div>
                <div class="deduction-card">
                    <div class="deduction-type">PLANO DE SAÚDE</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalHealthInsurance)}</div>
                </div>
                <div class="deduction-card">
                    <div class="deduction-type">PLANO ODONTOLÓGICO</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalDentalInsurance)}</div>
                </div>
                <div class="deduction-card">
                    <div class="deduction-type">OUTROS DESCONTOS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalCustomDiscounts + totals.totalOtherDiscounts)}</div>
                </div>
                <div class="deduction-card">
                    <div class="deduction-type">TOTAL DESCONTOS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalDiscounts)}</div>
                </div>
            </div>
        </div>

        <!-- Cards de Proventos Detalhados -->
        <div class="earnings-summary-section">
            <h3 style="color: #2c3e50; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
                RESUMO DETALHADO DOS PROVENTOS
            </h3>
            <div class="earnings-grid">
                <div class="earning-card">
                    <div class="earning-type">SALÁRIO BASE</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalBaseSalary)}</div>
                </div>
                <div class="earning-card">
                    <div class="earning-type">BENEFÍCIOS</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalGrossSalary - totals.totalBaseSalary)}</div>
                </div>
                <div class="earning-card">
                    <div class="earning-type">TOTAL PROVENTOS</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalGrossSalary)}</div>
                </div>
            </div>
        </div>

        <!-- Resumo Discriminado dos Recibos -->
        <div class="receipts-summary-section">
            <h3 style="color: #2c3e50; margin-bottom: 10px; font-size: 12px; border-bottom: 1px solid #ddd; padding-bottom: 3px;">
                📋 RESUMO DISCRIMINADO DOS RECIBOS
            </h3>
            ${receiptSummaryArray.length > 0 ? `
            <div class="receipts-grid">
                ${receiptSummaryArray.map((receipt: any) => `
                    <div class="receipt-summary-item">
                        <div class="receipt-type">${receipt.type.name}</div>
                        <div class="receipt-count">${receipt.count} recibo(s)</div>
                        <div class="receipt-total">${formatCurrency(receipt.totalValue)}</div>
                    </div>
                `).join('')}
            </div>
            ` : `
            <div style="text-align: center; color: #666; padding: 15px; font-size: 9px;">
                Nenhum recibo emitido neste período.
            </div>
            `}
        </div>
    </div>

    <script>
        function saveAsPDF() {
            // Usar a funcionalidade de impressão do navegador
            // O usuário pode escolher "Salvar como PDF" na janela de impressão
            window.print();
        }
    </script>
</body>
</html>`
}
