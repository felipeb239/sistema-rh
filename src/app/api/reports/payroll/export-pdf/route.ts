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
      totalReceiptBenefits: 0,
      totalReceiptDiscounts: 0,
      count: payrolls.length,
      // Totais detalhados por tipo de desconto
      totalInss: 0,
      totalIrrf: 0,
      totalHealthInsurance: 0,
      totalDentalInsurance: 0,
      totalCustomDiscounts: 0,
      totalOtherDiscounts: 0,
      // Totais de proventos
      totalBaseSalary: 0,
      totalBenefits: 0
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
      
      // Incluir recibos nos totais
      if (payroll.receiptBenefits) {
        totals.totalReceiptBenefits += Number(payroll.receiptBenefits)
      }
      if (payroll.receiptDiscounts) {
        totals.totalReceiptDiscounts += Number(payroll.receiptDiscounts)
      }
    })

    // Gerar HTML otimizado para conversão em PDF
    const htmlContent = generatePDFHTML(payrolls, totals, companySettings, monthNum, yearNum, receipts)

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

function generatePDFHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number, receipts: any[]): string {
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
  

  const htmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Folha de Pagamento - ${monthName}/${year}</title>
    <script src="https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js"></script>
    <script src="https://unpkg.com/html2canvas@latest/dist/html2canvas.min.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 11px;
            line-height: 1.3;
            color: #333;
            background: white;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 25px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .company-name {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
        }
        
        .period {
            font-size: 16px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .generated-date {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        
        .summary-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .summary-item {
            text-align: center;
        }
        
        .summary-item .label {
            font-size: 10px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .summary-item .value {
            font-size: 14px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .summary-item.total .value {
            color: #27ae60;
            font-size: 16px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        
        th {
            background: #34495e;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 9px;
        }
        
        td {
            padding: 6px;
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
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
        
        .totals-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
        }
        
        .total-item {
            text-align: center;
        }
        
        .total-item .label {
            font-size: 10px;
            opacity: 0.8;
            margin-bottom: 5px;
        }
        
        .total-item .value {
            font-size: 12px;
            font-weight: bold;
        }
        
        .total-item.main .value {
            font-size: 16px;
            color: #27ae60;
        }
        
        .pdf-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            border: none;
            padding: 12px 20px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            z-index: 1000;
        }
        
        .pdf-button:hover {
            background: #0056b3;
        }
        
        /* Cards de Descontos */
        .deductions-summary-section {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #fc8181;
        }
        
        .deductions-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
        }
        
        .deduction-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .deduction-card:hover {
            transform: translateY(-2px);
        }
        
        .deduction-card.inss-card {
            border-color: #f56565;
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        }
        
        .deduction-card.irrf-card {
            border-color: #ed8936;
            background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
        }
        
        .deduction-card.health-card {
            border-color: #4299e1;
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
        }
        
        .deduction-card.dental-card {
            border-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }
        
        .deduction-card.custom-card {
            border-color: #9f7aea;
            background: linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%);
        }
        
        .deduction-card.total-deductions-card {
            border-color: #e53e3e;
            background: linear-gradient(135deg, #fed7d7 0%, #fc8181 100%);
            color: white;
        }
        
        .deduction-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .deduction-type {
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        .deduction-count {
            color: #718096;
            font-size: 9px;
            margin-bottom: 8px;
        }
        
        .deduction-total {
            font-weight: bold;
            font-size: 13px;
            color: #e53e3e;
        }
        
        .deduction-card.total-deductions-card .deduction-type,
        .deduction-card.total-deductions-card .deduction-count,
        .deduction-card.total-deductions-card .deduction-total {
            color: white;
        }
        
        /* Cards de Proventos */
        .earnings-summary-section {
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 2px solid #68d391;
        }
        
        .earnings-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .earning-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #e2e8f0;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        
        .earning-card:hover {
            transform: translateY(-2px);
        }
        
        .earning-card.base-salary-card {
            border-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }
        
        .earning-card.benefits-card {
            border-color: #38a169;
            background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
        }
        
        .earning-card.total-earnings-card {
            border-color: #2f855a;
            background: linear-gradient(135deg, #c6f6d5 0%, #68d391 100%);
            color: white;
        }
        
        .earning-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .earning-type {
            font-weight: bold;
            color: #2d3748;
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        .earning-count {
            color: #718096;
            font-size: 9px;
            margin-bottom: 8px;
        }
        
        .earning-total {
            font-weight: bold;
            font-size: 13px;
            color: #38a169;
        }
        
        .earning-card.total-earnings-card .earning-type,
        .earning-card.total-earnings-card .earning-count,
        .earning-card.total-earnings-card .earning-total {
            color: white;
        }
        
        /* Cards de Recibos (mantido) */
        .receipts-summary-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid #e9ecef;
        }
        
        .receipts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
        }
        
        .receipt-summary-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #dee2e6;
            text-align: center;
        }
        
        .receipt-type {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 8px;
            font-size: 12px;
        }
        
        .receipt-count {
            color: #6c757d;
            font-size: 10px;
            margin-bottom: 5px;
        }
        
        .receipt-total {
            font-weight: bold;
            color: #27ae60;
            font-size: 14px;
        }
        
        @media print {
            .pdf-button {
                display: none;
            }
            
            body {
                padding: 10px;
                font-size: 10px;
            }
            
            .summary-section {
                grid-template-columns: repeat(4, 1fr);
            }
            
            .totals-grid {
                grid-template-columns: repeat(4, 1fr);
            }
        }
        
        @page {
            size: A4;
            margin: 15mm;
        }
    </style>
</head>
<body>
        <div style="position: fixed; top: 20px; right: 20px; z-index: 1000; display: flex; gap: 10px;">
            <button class="pdf-button" onclick="downloadPDF()">📄 Baixar PDF</button>
            <button class="pdf-button" onclick="printPage()" style="background: #28a745;">🖨️ Imprimir</button>
        </div>
    
    <div id="content">
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
                <div class="label">Recibos (Proventos)</div>
                <div class="value currency">${formatCurrency(totals.totalReceiptBenefits)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Total de Descontos</div>
                <div class="value currency">${formatCurrency(totals.totalDiscounts)}</div>
            </div>
            <div class="summary-item">
                <div class="label">Recibos (Descontos)</div>
                <div class="value currency">${formatCurrency(totals.totalReceiptDiscounts)}</div>
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
                    <th style="width: 4%;">#</th>
                    <th style="width: 25%;">Funcionário</th>
                    <th style="width: 15%;">Cargo</th>
                    <th style="width: 12%;">Salário Base</th>
                    <th style="width: 12%;">Recibos (+)</th>
                    <th style="width: 12%;">Descontos</th>
                    <th style="width: 10%;">Recibos (-)</th>
                    <th style="width: 10%;">Líquido</th>
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
                  
                  const receiptBenefits = Number(payroll.receiptBenefits || 0)
                  const receiptDiscounts = Number(payroll.receiptDiscounts || 0)
                  
                  return `
                    <tr>
                        <td class="text-center">${index + 1}</td>
                        <td>${payroll.employee.name}</td>
                        <td>${payroll.employee.position || '-'}</td>
                        <td class="text-right currency">${formatCurrency(Number(payroll.baseSalary))}</td>
                        <td class="text-right currency">${receiptBenefits > 0 ? formatCurrency(receiptBenefits) : '-'}</td>
                        <td class="text-right currency">${formatCurrency(totalDiscounts)}</td>
                        <td class="text-right currency">${receiptDiscounts > 0 ? formatCurrency(receiptDiscounts) : '-'}</td>
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
                    <div class="label">Recibos (+)</div>
                    <div class="value currency">${formatCurrency(totals.totalReceiptBenefits)}</div>
                </div>
                <div class="total-item">
                    <div class="label">Total Descontos</div>
                    <div class="value currency">${formatCurrency(totals.totalDiscounts)}</div>
                </div>
                <div class="total-item">
                    <div class="label">Recibos (-)</div>
                    <div class="value currency">${formatCurrency(totals.totalReceiptDiscounts)}</div>
                </div>
                <div class="total-item main">
                    <div class="label">Salário Líquido</div>
                    <div class="value currency">${formatCurrency(totals.totalNetSalary)}</div>
                </div>
            </div>
        </div>
        
        <!-- Cards de Descontos Detalhados -->
        <div class="deductions-summary-section">
            <h3 style="color: #e74c3c; margin-bottom: 15px; font-size: 14px; border-bottom: 2px solid #e74c3c; padding-bottom: 5px;">
                💸 RESUMO DETALHADO DOS DESCONTOS
            </h3>
            <div class="deductions-grid">
                <div class="deduction-card inss-card">
                    <div class="deduction-icon">🏛️</div>
                    <div class="deduction-type">INSS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalInss)}</div>
                </div>
                <div class="deduction-card irrf-card">
                    <div class="deduction-icon">📊</div>
                    <div class="deduction-type">IRRF</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalIrrf)}</div>
                </div>
                <div class="deduction-card health-card">
                    <div class="deduction-icon">🏥</div>
                    <div class="deduction-type">PLANO DE SAÚDE</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalHealthInsurance)}</div>
                </div>
                <div class="deduction-card dental-card">
                    <div class="deduction-icon">🦷</div>
                    <div class="deduction-type">PLANO ODONTOLÓGICO</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalDentalInsurance)}</div>
                </div>
                <div class="deduction-card custom-card">
                    <div class="deduction-icon">📝</div>
                    <div class="deduction-type">OUTROS DESCONTOS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalCustomDiscounts + totals.totalOtherDiscounts)}</div>
                </div>
                <div class="deduction-card total-deductions-card">
                    <div class="deduction-icon">💼</div>
                    <div class="deduction-type">TOTAL DESCONTOS</div>
                    <div class="deduction-count">${totals.count} funcionários</div>
                    <div class="deduction-total">${formatCurrency(totals.totalDiscounts)}</div>
                </div>
            </div>
        </div>

        <!-- Cards de Proventos Detalhados -->
        <div class="earnings-summary-section">
            <h3 style="color: #27ae60; margin-bottom: 15px; font-size: 14px; border-bottom: 2px solid #27ae60; padding-bottom: 5px;">
                💰 RESUMO DETALHADO DOS PROVENTOS
            </h3>
            <div class="earnings-grid">
                <div class="earning-card base-salary-card">
                    <div class="earning-icon">💵</div>
                    <div class="earning-type">SALÁRIO BASE</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalBaseSalary)}</div>
                </div>
                <div class="earning-card benefits-card">
                    <div class="earning-icon">🎁</div>
                    <div class="earning-type">BENEFÍCIOS</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalReceiptBenefits)}</div>
                </div>
                <div class="earning-card total-earnings-card">
                    <div class="earning-icon">📈</div>
                    <div class="earning-type">TOTAL PROVENTOS</div>
                    <div class="earning-count">${totals.count} funcionários</div>
                    <div class="earning-total">${formatCurrency(totals.totalGrossSalary)}</div>
                </div>
            </div>
        </div>

        <!-- Resumo Discriminado dos Recibos -->
        <div class="receipts-summary-section">
            <h3 style="color: #2c3e50; margin-bottom: 15px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">
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
            <div style="text-align: center; color: #666; padding: 20px;">
                Nenhum recibo emitido neste período.
            </div>
            `}
        </div>
    </div>

    <script>
        function downloadPDF() {
            const button = document.querySelector('.pdf-button');
            button.textContent = '⏳ Gerando PDF...';
            button.disabled = true;
            
            // Verificar se as bibliotecas estão carregadas
            if (typeof window.jspdf === 'undefined' || typeof html2canvas === 'undefined') {
                console.error('Bibliotecas não carregadas');
                button.textContent = '❌ Erro: Bibliotecas não carregadas';
                button.disabled = false;
                return;
            }
            
            const element = document.getElementById('content');
            
            html2canvas(element, {
                scale: 1.5,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            }).then(function(canvas) {
                const imgData = canvas.toDataURL('image/jpeg', 0.8);
                const { jsPDF } = window.jspdf;
                const pdf = new jsPDF('p', 'mm', 'a4');
                
                const imgWidth = 210;
                const pageHeight = 295;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let heightLeft = imgHeight;
                
                let position = 0;
                
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                
                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save('folha-pagamento-${monthName.toLowerCase()}-${year}.pdf');
                
                button.textContent = '✅ PDF Baixado!';
                button.style.background = '#28a745';
                button.disabled = false;
                
                setTimeout(() => {
                    button.textContent = '📄 Baixar PDF';
                    button.style.background = '#007bff';
                }, 3000);
            }).catch(function(error) {
                console.error('Erro ao gerar PDF:', error);
                button.textContent = '❌ Erro ao gerar PDF';
                button.disabled = false;
                
                setTimeout(() => {
                    button.textContent = '📄 Baixar PDF';
                }, 3000);
            });
        }
        
        function printPage() {
            window.print();
        }
        
        // Verificar se as bibliotecas carregaram
        function checkLibraries() {
            if (typeof window.jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
                console.log('Bibliotecas carregadas com sucesso');
                // Auto-download após 3 segundos
                setTimeout(() => {
                    downloadPDF();
                }, 3000);
            } else {
                console.log('Aguardando bibliotecas...');
                setTimeout(checkLibraries, 500);
            }
        }
        
        // Iniciar verificação quando a página carregar
        document.addEventListener('DOMContentLoaded', function() {
            checkLibraries();
        });
    </script>
</body>
</html>`

  
  return htmlContent
}
