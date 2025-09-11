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

    // Buscar configurações da empresa
    const companySettings = await prisma.companySettings.findFirst()

    // Calcular totais
    const totals = {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDiscounts: 0,
      count: payrolls.length
    }

    payrolls.forEach(payroll => {
      totals.totalGrossSalary += Number(payroll.grossSalary)
      totals.totalNetSalary += Number(payroll.netSalary)
      
      const totalDiscounts = Number(payroll.inssDiscount) + 
                           Number(payroll.irrfDiscount) + 
                           Number(payroll.healthInsurance) + 
                           Number(payroll.dentalInsurance) + 
                           Number(payroll.customDiscount) + 
                           Number(payroll.otherDiscounts)
      
      totals.totalDiscounts += totalDiscounts
    })

    // Gerar HTML otimizado para impressão
    const htmlContent = generatePrintHTML(payrolls, totals, companySettings, monthNum, yearNum)

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

function generatePrintHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number): string {
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
            text-align: left;
            font-weight: bold;
            font-size: 8px;
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
