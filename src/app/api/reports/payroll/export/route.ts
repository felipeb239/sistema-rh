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

    if (monthNum < 1 || monthNum > 12) {
      return NextResponse.json({ 
        error: 'Mês deve estar entre 1 e 12' 
      }, { status: 400 })
    }

    const currentYear = new Date().getFullYear()
    if (yearNum < 2020 || yearNum > currentYear + 10) {
      return NextResponse.json({ 
        error: `Ano deve estar entre 2020 e ${currentYear + 10}` 
      }, { status: 400 })
    }

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
      totalInssDiscount: 0,
      totalIrrfDiscount: 0,
      totalHealthInsurance: 0,
      totalDentalInsurance: 0,
      totalCustomDiscount: 0,
      totalOtherDiscounts: 0,
      totalFgtsAmount: 0,
      totalDiscounts: 0,
      count: payrolls.length
    }

    payrolls.forEach(payroll => {
      totals.totalGrossSalary += Number(payroll.grossSalary)
      totals.totalNetSalary += Number(payroll.netSalary)
      totals.totalInssDiscount += Number(payroll.inssDiscount)
      totals.totalIrrfDiscount += Number(payroll.irrfDiscount)
      totals.totalHealthInsurance += Number(payroll.healthInsurance)
      totals.totalDentalInsurance += Number(payroll.dentalInsurance)
      totals.totalCustomDiscount += Number(payroll.customDiscount)
      totals.totalOtherDiscounts += Number(payroll.otherDiscounts)
      totals.totalFgtsAmount += Number(payroll.fgtsAmount)
      
      const totalDiscounts = Number(payroll.inssDiscount) + 
                           Number(payroll.irrfDiscount) + 
                           Number(payroll.healthInsurance) + 
                           Number(payroll.dentalInsurance) + 
                           Number(payroll.customDiscount) + 
                           Number(payroll.otherDiscounts)
      
      totals.totalDiscounts += totalDiscounts
    })

    // Gerar HTML otimizado para impressão
    try {
      const htmlContent = generatePayrollHTML(payrolls, totals, companySettings, monthNum, yearNum)

      return new NextResponse(htmlContent, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': `inline; filename="relatorio-holerites-${monthNum.toString().padStart(2, '0')}-${yearNum}.html"`
        }
      })
    } catch (htmlError) {
      console.error('Erro ao gerar HTML:', htmlError)
      return NextResponse.json(
        { error: 'Erro ao gerar relatório HTML' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Erro ao exportar relatório:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1] || 'Mês'
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

function generatePayrollHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number): string {
  const getMonthName = (month: number): string => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ]
    return months[month - 1] || 'Mês'
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const monthName = getMonthName(month)
  const companyName = companySettings?.companyName || 'Empresa'
  const cnpj = companySettings?.cnpj || ''
  const address = companySettings?.address || ''
  const city = companySettings?.city || ''
  const state = companySettings?.state || ''
  
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
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 10mm;
        }
        
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .company-details {
            font-size: 11px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .period {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .generated-date {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        
        .summary-cards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 25px;
        }
        
        .summary-card {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 11px;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .summary-card .value {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .summary-card.total .value {
            color: #27ae60;
            font-size: 20px;
        }
        
        .table-container {
            margin-bottom: 25px;
        }
        
        .table-title {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
        }
        
        th {
            background: #34495e;
            color: white;
            padding: 8px 6px;
            text-align: left;
            font-weight: bold;
            font-size: 10px;
        }
        
        td {
            padding: 6px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:nth-child(even) {
            background: #f8f9fa;
        }
        
        tr:hover {
            background: #e3f2fd;
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
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .totals-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
            font-size: 14px;
            font-weight: bold;
        }
        
        .total-item.main .value {
            font-size: 18px;
            color: #27ae60;
        }
        
        .breakdown-section {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #3498db;
        }
        
        .breakdown-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            color: #2c3e50;
        }
        
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 10px;
        }
        
        .breakdown-item {
            display: flex;
            justify-content: space-between;
            padding: 5px 0;
            border-bottom: 1px solid #e9ecef;
        }
        
        .breakdown-item:last-child {
            border-bottom: none;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 15px;
        }
        
        @media print {
            body {
                font-size: 10px;
            }
            
            .container {
                padding: 5mm;
            }
            
            .summary-cards {
                grid-template-columns: repeat(4, 1fr);
            }
            
            .breakdown-grid {
                grid-template-columns: repeat(3, 1fr);
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
    <div class="container">
        <!-- Cabeçalho -->
        <div class="header">
            <div class="company-name">${companyName}</div>
            <div class="company-details">
                ${cnpj ? `CNPJ: ${cnpj}` : ''}
                ${address ? ` | ${address}` : ''}
                ${city && state ? ` - ${city}/${state}` : ''}
            </div>
            <div class="period">FOLHA DE PAGAMENTO - ${monthName.toUpperCase()}/${year}</div>
            <div class="generated-date">Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</div>
        </div>
        
        <!-- Resumo Executivo -->
        <div class="summary-cards">
            <div class="summary-card">
                <h3>Funcionários</h3>
                <div class="value">${totals.count}</div>
            </div>
            <div class="summary-card">
                <h3>Salário Bruto Total</h3>
                <div class="value currency">${formatCurrency(totals.totalGrossSalary)}</div>
            </div>
            <div class="summary-card">
                <h3>Total de Descontos</h3>
                <div class="value currency">${formatCurrency(totals.totalDiscounts)}</div>
            </div>
            <div class="summary-card total">
                <h3>Salário Líquido Total</h3>
                <div class="value currency">${formatCurrency(totals.totalNetSalary)}</div>
            </div>
        </div>
        
        <!-- Tabela de Funcionários -->
        <div class="table-container">
            <div class="table-title">DETALHAMENTO POR FUNCIONÁRIO</div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 40%;">Funcionário</th>
                        <th style="width: 15%;">Cargo</th>
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
        </div>
        
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
        
        <!-- Detalhamento dos Descontos -->
        <div class="breakdown-section">
            <div class="breakdown-title">DETALHAMENTO DOS DESCONTOS</div>
            <div class="breakdown-grid">
                <div class="breakdown-item">
                    <span>INSS</span>
                    <span class="currency">${formatCurrency(totals.totalInssDiscount)}</span>
                </div>
                <div class="breakdown-item">
                    <span>IRRF</span>
                    <span class="currency">${formatCurrency(totals.totalIrrfDiscount)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Plano de Saúde</span>
                    <span class="currency">${formatCurrency(totals.totalHealthInsurance)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Plano Odontológico</span>
                    <span class="currency">${formatCurrency(totals.totalDentalInsurance)}</span>
                </div>
                <div class="breakdown-item">
                    <span>Outros Descontos</span>
                    <span class="currency">${formatCurrency(totals.totalOtherDiscounts)}</span>
                </div>
                <div class="breakdown-item">
                    <span>FGTS (8%)</span>
                    <span class="currency">${formatCurrency(totals.totalFgtsAmount)}</span>
                </div>
            </div>
        </div>
        
        <!-- Rodapé -->
        <div class="footer">
            <p>Relatório gerado automaticamente pelo Sistema de Folha de Pagamento</p>
            <p>Para dúvidas, entre em contato com o departamento de RH</p>
        </div>
    </div>
</body>
</html>
  `
}
