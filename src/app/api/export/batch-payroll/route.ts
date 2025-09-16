import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/formatters'
import { calculateEmployeeRubrics } from '@/lib/employee-rubrics'

function getLastDayOfMonth(month: number, year: number): string {
  const lastDay = new Date(year, month, 0).getDate()
  return lastDay.toString().padStart(2, '0')
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month - 1]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get('month') || new Date().getMonth() + 1 + '')
    const year = parseInt(searchParams.get('year') || new Date().getFullYear() + '')

    // Buscar dados da empresa
    const companySettings = await prisma.companySettings.findFirst()

    const payrolls = await prisma.payroll.findMany({
      where: { 
        month, 
        year 
      },
      include: { 
        employee: {
          include: {
            employeeRubrics: {
              where: { isActive: true },
              include: {
                rubric: true
              }
            }
          }
        }
      },
      orderBy: { 
        employee: { 
          name: 'asc' 
        } 
      }
    })

    if (payrolls.length === 0) {
      return NextResponse.json({ error: 'Nenhum holerite encontrado para o período especificado' }, { status: 404 })
    }

    const lastDay = getLastDayOfMonth(month, year)
    const period = `01 a ${lastDay}`
    const monthName = getMonthName(month)

    // Criar as informações da empresa
    const companyInfo = companySettings ? {
      name: companySettings.companyName || 'FERRAZ DOS PASSOS ADVOCACIA E CONSULTORIA',
      cnpj: companySettings.cnpj || '',
      address: companySettings.address || '',
      city: companySettings.city || '',
      state: companySettings.state || '',
      zipCode: companySettings.zipCode || '',
      phone: companySettings.phone || '',
      email: companySettings.email || ''
    } : {
      name: 'FERRAZ DOS PASSOS ADVOCACIA E CONSULTORIA',
      cnpj: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      phone: '',
      email: ''
    }

    // Gerar função para criar cada holerite (2 cópias por funcionário)
    const generatePayrollHTML = (payroll: any, copyTitle: string) => {
      // CÁLCULO LIMPO DO ZERO - SEM USAR DADOS CONTAMINADOS DO BANCO
      const baseSalary = Number(payroll.baseSalary)
      
      // Calcular rubricas ativas do funcionário
      const employeeRubrics = calculateEmployeeRubrics(
        payroll.employee.employeeRubrics.filter((r: any) => r.isActive),
        baseSalary,
        payroll.month,
        payroll.year
      )
      
      // Separar benefícios e descontos das rubricas
      const benefits = employeeRubrics.filter((r: any) => r.isBenefit)
      const rubricDiscounts = employeeRubrics.filter((r: any) => !r.isBenefit)
      
      // Calcular totais das rubricas
      const totalBenefits = benefits.reduce((sum: number, benefit: any) => sum + benefit.value, 0)
      const totalRubricDiscounts = rubricDiscounts.reduce((sum: number, discount: any) => sum + discount.value, 0)
      
      // Calcular salário bruto (base + benefícios das rubricas) - SEM RECIBOS
      const grossSalaryWithoutReceipts = baseSalary + totalBenefits
      
      // INCLUIR INSS E IRRF MANUAL + DESCONTOS DAS RUBRICAS (mas não outros campos contaminados)
      const manualInss = Number(payroll.inssDiscount || 0)
      const manualIrrf = Number(payroll.irrfDiscount || 0)
      const totalDiscounts = totalRubricDiscounts + manualInss + manualIrrf
      
      // Calcular salário líquido final - RUBRICAS + INSS MANUAL
      const netSalaryWithoutReceipts = grossSalaryWithoutReceipts - totalDiscounts

      return `
        <div class="payroll-copy">
          <div class="header">
            <div class="title">RECIBO</div>
            <div class="company-info">
              <div><strong>${companyInfo.name}</strong></div>
              ${companyInfo.cnpj ? `<div>CNPJ: ${companyInfo.cnpj}</div>` : ''}
              ${companyInfo.address ? `<div>${companyInfo.address}${companyInfo.city ? `, ${companyInfo.city}` : ''}${companyInfo.state ? `/${companyInfo.state}` : ''}${companyInfo.zipCode ? ` - CEP: ${companyInfo.zipCode}` : ''}</div>` : ''}
              ${companyInfo.phone ? `<div>Telefone: ${companyInfo.phone}</div>` : ''}
            </div>
            <div class="period-ref">
              <div>Ref.: ${payroll.month.toString().padStart(2, '0')}/${payroll.year}</div>
              <div>Telefone: ${companyInfo.phone || ''}</div>
            </div>
          </div>
          
          <div class="sub-header">
            <div>Recibo de Pagamento Folha Mensal</div>
          </div>
          
          <div class="employee-info">
            <table class="info-table">
              <tr>
                <td><strong>Nome:</strong> ${payroll.employee?.name}</td>
                <td><strong>Mês:</strong> ${payroll.month.toString().padStart(2, '0')}/${payroll.year}</td>
              </tr>
              <tr>
                <td><strong>Função:</strong> ${payroll.employee?.position}</td>
                <td><strong>Nível:</strong></td>
              </tr>
              <tr>
                <td><strong>CPF:</strong> ${payroll.employee?.cpf}</td>
                <td><strong>CBO:</strong> ${payroll.employee?.cbo || ''}</td>
              </tr>
            </table>
          </div>
          
          <div class="amounts-section">
            <table class="amounts-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descrição</th>
                  <th>Referência</th>
                  <th>Vencimentos</th>
                  <th>Descontos</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1067</td>
                  <td>SALÁRIO</td>
                  <td></td>
                  <td class="currency">${formatCurrency(baseSalary)}</td>
                  <td></td>
                </tr>
                ${benefits.map((benefit: any, index: number) => `
                <tr>
                  <td>106${8 + index}</td>
                  <td>${benefit.name.toUpperCase()}</td>
                  <td></td>
                  <td class="currency">${formatCurrency(benefit.value)}</td>
                  <td></td>
                </tr>
                `).join('')}
                ${manualInss > 0 ? `
                <tr>
                  <td>2901</td>
                  <td>INSS</td>
                  <td></td>
                  <td></td>
                  <td class="currency">${formatCurrency(manualInss)}</td>
                </tr>
                ` : ''}
                ${manualIrrf > 0 ? `
                <tr>
                  <td>2902</td>
                  <td>IRRF</td>
                  <td></td>
                  <td></td>
                  <td class="currency">${formatCurrency(manualIrrf)}</td>
                </tr>
                ` : ''}
                ${rubricDiscounts.map((discount: any, index: number) => `
                <tr>
                  <td>290${3 + index}</td>
                  <td>${discount.name.toUpperCase()}</td>
                  <td></td>
                  <td></td>
                  <td class="currency">${formatCurrency(discount.value)}</td>
                </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="totals-section">
            <table class="totals-table">
              <tr>
                <td><strong>Total de Vencimentos</strong></td>
                <td class="currency"><strong>${formatCurrency(grossSalaryWithoutReceipts)}</strong></td>
                <td><strong>Total de Descontos</strong></td>
                <td class="currency"><strong>${formatCurrency(totalDiscounts)}</strong></td>
              </tr>
              <tr>
                <td colspan="2"></td>
                <td><strong>Valor Líquido</strong></td>
                <td class="currency final-value"><strong>${formatCurrency(netSalaryWithoutReceipts)}</strong></td>
              </tr>
            </table>
          </div>
          
          <div class="summary-section">
            <table class="summary-table">
              <tr>
                <td>Sal. Base</td>
                <td>Sal. Contr. INSS</td>
                <td>Base de Cálc. FGTS</td>
                <td>F.G.T.S do Mês</td>
                <td>Base de I.R.R.F.</td>
                <td>Dep. I.R.R.F</td>
              </tr>
              <tr>
                <td class="currency">${formatCurrency(baseSalary)}</td>
                <td class="currency">${formatCurrency(grossSalaryWithoutReceipts)}</td>
                <td class="currency">${formatCurrency(grossSalaryWithoutReceipts)}</td>
                <td class="currency">${formatCurrency(grossSalaryWithoutReceipts * 0.08)}</td>
                <td class="currency">${formatCurrency(grossSalaryWithoutReceipts)}</td>
                <td>00</td>
              </tr>
            </table>
          </div>
          
          <div class="footer-section">
            <div>Declaro ter Recebido a importância líquida discriminada neste recibo</div>
            <div class="signature-line">
              <span>____/____/______</span>
              <span style="margin-left: 200px;">ASSINATURA</span>
            </div>
          </div>
        </div>
      `
    }

    // Gerar HTML para todos os holerites (2 cópias cada)
    const payrollsHtml = payrolls.map(payroll => {
      return `
        ${generatePayrollHTML(payroll, 'VIA DA EMPRESA')}
        ${generatePayrollHTML(payroll, 'VIA DO FUNCIONÁRIO')}
        <div style="page-break-after: always;"></div>
      `
    }).join('')

    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Holerites em Massa - ${monthName}/${year}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 10px;
      line-height: 1.2;
      color: #2c3e50;
      background: white;
      padding: 8mm 15mm;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    
    .payroll-copy {
      width: 180mm;
      max-width: 180mm;
      margin-bottom: 8mm;
      border: 2px solid #34495e;
      border-radius: 6px;
      page-break-inside: avoid;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      overflow: hidden;
      height: calc(50vh - 12mm);
    }
    
    .header {
      background: linear-gradient(135deg, #34495e 0%, #2c3e50 100%);
      color: white;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e74c3c;
      min-height: 35px;
    }
    
    .title {
      font-size: 16px;
      font-weight: bold;
      text-align: left;
      text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
      flex: 0 0 auto;
      width: 70px;
    }
    
    .company-info {
      text-align: center;
      flex: 1;
      font-size: 9px;
      line-height: 1.2;
      padding: 0 15px;
    }
    
    .company-info div:first-child {
      font-size: 10px;
      font-weight: bold;
      margin-bottom: 2px;
    }
    
    .period-ref {
      text-align: right;
      font-size: 9px;
      line-height: 1.2;
      flex: 0 0 auto;
      width: 70px;
    }
    
    .sub-header {
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      text-align: center;
      padding: 4px;
      font-weight: bold;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .employee-info {
      background: #ecf0f1;
      border-bottom: 1px solid #bdc3c7;
    }
    
    .info-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .info-table td {
      padding: 4px 8px;
      border-right: 1px solid #bdc3c7;
      font-size: 9px;
      color: #2c3e50;
      min-width: 120px;
    }
    
    .info-table td:last-child {
      border-right: none;
    }
    
    .info-table strong {
      color: #34495e;
      font-weight: 600;
    }
    
    .amounts-section {
      min-height: 100px;
      background: white;
      flex: 1;
    }
    
    .amounts-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    
    .amounts-table th {
      background: linear-gradient(135deg, #e67e22 0%, #d35400 100%);
      color: white;
      padding: 6px 4px;
      text-align: center;
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .amounts-table th:nth-child(1) { width: 12%; } // Código
    .amounts-table th:nth-child(2) { width: 38%; } // Descrição
    .amounts-table th:nth-child(3) { width: 15%; } // Referência
    .amounts-table th:nth-child(4) { width: 35%; } // Vencimentos
    
    .amounts-table td {
      border: 1px solid #ddd;
      padding: 4px 6px;
      font-size: 8px;
      vertical-align: middle;
      word-wrap: break-word;
    }
    
    .amounts-table td:nth-child(1) { text-align: center; } // Código - centralizado
    .amounts-table td:nth-child(2) { text-align: left; } // Descrição - alinhado à esquerda
    .amounts-table td:nth-child(3) { text-align: center; } // Referência - centralizado
    .amounts-table td:nth-child(4) { text-align: right; } // Vencimentos - alinhado à direita
    
    .amounts-table tbody tr:nth-child(even) {
      background: #f8f9fa;
    }
    
    .amounts-table tbody tr:hover {
      background: #e3f2fd;
    }
    
    .currency {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 600;
      color: #27ae60;
    }
    
    .totals-section {
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-top: 1px solid #34495e;
    }
    
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    
    .totals-table td {
      border: 1px solid #bdc3c7;
      padding: 4px 8px;
      font-size: 9px;
      font-weight: 600;
      min-width: 80px;
    }
    
    .totals-table td:nth-child(even) {
      background: white;
    }
    
    .final-value {
      background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%) !important;
      color: white !important;
      font-weight: bold;
      text-align: right;
      font-size: 10px;
    }
    
    .summary-section {
      background: #f8f9fa;
      border-top: 1px solid #34495e;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    
    .summary-table td {
      border: 1px solid #bdc3c7;
      padding: 3px 2px;
      text-align: center;
      font-size: 7px;
      color: #2c3e50;
      min-width: 40px;
    }
    
    .summary-table tr:first-child td {
      background: linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%);
      color: white;
      font-weight: bold;
      font-size: 7px;
    }
    
    .footer-section {
      background: #ecf0f1;
      border-top: 1px solid #34495e;
      padding: 6px 8px;
      text-align: center;
      font-size: 8px;
      color: #2c3e50;
      min-height: 30px;
    }
    
    .signature-line {
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
    }
    
    .signature-line span {
      padding: 3px 10px;
      border-bottom: 1px solid #34495e;
      color: #34495e;
      font-size: 8px;
    }
    
    @media print {
      body {
        padding: 8mm 15mm;
      }
      
      .payroll-copy {
        page-break-after: avoid;
        box-shadow: none;
        height: calc(50vh - 12mm);
      }
    }
    
    @page {
      size: A4;
      margin: 8mm 15mm;
    }
  </style>
</head>
<body>
    ${payrollsHtml}
</body>
</html>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="holerites-${monthName}-${year}.html"`
      }
    })

  } catch (error) {
    console.error('Erro no endpoint:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}