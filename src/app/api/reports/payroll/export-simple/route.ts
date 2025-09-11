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
</body>
</html>`
}
