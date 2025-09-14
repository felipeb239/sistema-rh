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

    // Gerar HTML simples
    const html = generateSimpleHTML(payrolls, totals, companySettings, monthNum, yearNum)

    return new NextResponse(html, {
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

function generateSimpleHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number): string {
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
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .period {
            font-size: 18px;
            font-weight: bold;
            color: #2c3e50;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .totals {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-top: 20px;
        }
        .total-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
        }
        .total-final {
            font-weight: bold;
            font-size: 16px;
            color: #27ae60;
            border-top: 2px solid #27ae60;
            padding-top: 10px;
            margin-top: 10px;
        }
        
        /* Cards de Descontos e Proventos */
        .deductions-summary, .earnings-summary {
            margin: 20px 0;
            padding: 20px;
            border-radius: 8px;
        }
        
        .deductions-summary {
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
            border: 2px solid #fc8181;
        }
        
        .earnings-summary {
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
            border: 2px solid #68d391;
        }
        
        .deductions-summary h3, .earnings-summary h3 {
            margin: 0 0 15px 0;
            font-size: 16px;
            font-weight: bold;
        }
        
        .deductions-summary h3 {
            color: #e74c3c;
        }
        
        .earnings-summary h3 {
            color: #27ae60;
        }
        
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 15px;
        }
        
        .deduction-card, .earning-card {
            background: white;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            border: 2px solid #e2e8f0;
        }
        
        .deduction-card.inss {
            border-color: #f56565;
            background: linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%);
        }
        
        .deduction-card.irrf {
            border-color: #ed8936;
            background: linear-gradient(135deg, #fffaf0 0%, #feebc8 100%);
        }
        
        .deduction-card.health {
            border-color: #4299e1;
            background: linear-gradient(135deg, #ebf8ff 0%, #bee3f8 100%);
        }
        
        .deduction-card.dental {
            border-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }
        
        .deduction-card.others {
            border-color: #9f7aea;
            background: linear-gradient(135deg, #faf5ff 0%, #e9d8fd 100%);
        }
        
        .earning-card.salary {
            border-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%);
        }
        
        .earning-card.benefits {
            border-color: #38a169;
            background: linear-gradient(135deg, #e6fffa 0%, #b2f5ea 100%);
        }
        
        .card-icon {
            font-size: 24px;
            margin-bottom: 8px;
        }
        
        .card-title {
            font-weight: bold;
            margin-bottom: 8px;
            font-size: 12px;
            color: #2d3748;
        }
        
        .card-value {
            font-weight: bold;
            font-size: 14px;
            color: #2d3748;
        }
        
        .deduction-card .card-value {
            color: #e53e3e;
        }
        
        .earning-card .card-value {
            color: #38a169;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">${companyName}</div>
        <div class="period">FOLHA DE PAGAMENTO - ${monthName.toUpperCase()}/${year}</div>
        <div>Gerado em: ${new Date().toLocaleDateString('pt-BR')}</div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Funcionário</th>
                <th>Cargo</th>
                <th>Salário Bruto</th>
                <th>Descontos</th>
                <th>Salário Líquido</th>
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
                    <td>${index + 1}</td>
                    <td>${payroll.employee.name}</td>
                    <td>${payroll.employee.position || '-'}</td>
                    <td>${formatCurrency(Number(payroll.grossSalary))}</td>
                    <td>${formatCurrency(totalDiscounts)}</td>
                    <td>${formatCurrency(Number(payroll.netSalary))}</td>
                </tr>
              `
            }).join('')}
        </tbody>
    </table>
    
    <div class="totals">
        <div class="total-item">
            <span>Total de Funcionários:</span>
            <span>${totals.count}</span>
        </div>
        <div class="total-item">
            <span>Salário Bruto Total:</span>
            <span>${formatCurrency(totals.totalGrossSalary)}</span>
        </div>
        <div class="total-item">
            <span>Total de Descontos:</span>
            <span>${formatCurrency(totals.totalDiscounts)}</span>
        </div>
        <div class="total-item total-final">
            <span>SALÁRIO LÍQUIDO TOTAL:</span>
            <span>${formatCurrency(totals.totalNetSalary)}</span>
        </div>
    </div>

    <!-- Cards de Descontos Detalhados -->
    <div class="deductions-summary">
        <h3>💸 RESUMO DETALHADO DOS DESCONTOS</h3>
        <div class="cards-grid">
            <div class="deduction-card inss">
                <div class="card-icon">🏛️</div>
                <div class="card-title">INSS</div>
                <div class="card-value">${formatCurrency(totals.totalInss)}</div>
            </div>
            <div class="deduction-card irrf">
                <div class="card-icon">📊</div>
                <div class="card-title">IRRF</div>
                <div class="card-value">${formatCurrency(totals.totalIrrf)}</div>
            </div>
            <div class="deduction-card health">
                <div class="card-icon">🏥</div>
                <div class="card-title">PLANO DE SAÚDE</div>
                <div class="card-value">${formatCurrency(totals.totalHealthInsurance)}</div>
            </div>
            <div class="deduction-card dental">
                <div class="card-icon">🦷</div>
                <div class="card-title">PLANO ODONTOLÓGICO</div>
                <div class="card-value">${formatCurrency(totals.totalDentalInsurance)}</div>
            </div>
            <div class="deduction-card others">
                <div class="card-icon">📝</div>
                <div class="card-title">OUTROS DESCONTOS</div>
                <div class="card-value">${formatCurrency(totals.totalCustomDiscounts + totals.totalOtherDiscounts)}</div>
            </div>
        </div>
    </div>

    <!-- Cards de Proventos Detalhados -->
    <div class="earnings-summary">
        <h3>💰 RESUMO DETALHADO DOS PROVENTOS</h3>
        <div class="cards-grid">
            <div class="earning-card salary">
                <div class="card-icon">💵</div>
                <div class="card-title">SALÁRIO BASE</div>
                <div class="card-value">${formatCurrency(totals.totalBaseSalary)}</div>
            </div>
            <div class="earning-card benefits">
                <div class="card-icon">🎁</div>
                <div class="card-title">BENEFÍCIOS</div>
                <div class="card-value">${formatCurrency(totals.totalGrossSalary - totals.totalBaseSalary)}</div>
            </div>
        </div>
    </div>
</body>
</html>`
}
