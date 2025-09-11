import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatCPF, getMonthName } from '@/lib/utils'
import { CompanySettings } from '@/types'
import { calculateEmployeeRubrics } from '@/lib/employee-rubrics'

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
      include: { 
        employee: {
          include: {
            employeeRubrics: {
              include: {
                rubric: true
              }
            }
          }
        }
      }
    })

    if (!payroll) {
      return NextResponse.json({ error: 'Holerite não encontrado' }, { status: 404 })
    }

    // Debug: verificar se customDiscountDescription está presente
    console.log('Payroll data:', {
      id: payroll.id,
      customDiscountDescription: payroll.customDiscountDescription,
      otherDiscounts: payroll.otherDiscounts
    })

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
      
      // Usar os valores já calculados na geração da folha
      const baseSalary = Number(payroll.baseSalary)
      const grossSalary = Number(payroll.grossSalary)
      const netSalary = Number(payroll.netSalary)
      
      // Calcular total de descontos usando os valores do banco
      const totalDiscounts = Number(payroll.inssDiscount || 0) + 
                            Number(payroll.irrfDiscount || 0) + 
                            Number(payroll.healthInsurance || 0) + 
                            Number(payroll.dentalInsurance || 0) + 
                            Number(payroll.customDiscount || 0) + 
                            Number(payroll.otherDiscounts || 0)
      
      // Calcular rubricas específicas apenas para exibição no PDF
      const calculatedRubrics = payroll.employee?.employeeRubrics ? 
        calculateEmployeeRubrics(
          payroll.employee.employeeRubrics,
          Number(payroll.baseSalary),
          payroll.month,
          payroll.year
        ) : []
      
      // Debug: verificar cálculos
      console.log('PDF Calculation Debug:', {
        baseSalary,
        grossSalary,
        netSalary,
        totalDiscounts,
        calculatedRubrics: calculatedRubrics.map(r => ({ name: r.name, value: r.value, isBenefit: r.isBenefit }))
      })
      
      const fgts = (baseSalary * 0.08).toFixed(2)

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Holerite - ${payroll.employee?.name} - ${getMonthName(payroll.month)}/${payroll.year}</title>
            <style>
                @page { margin: 4mm; size: A4; }
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; font-size: 12pt; line-height: 1.4; }
                .container { max-width: 800px; margin: 0 auto; }
                .receipt-section { margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                .cut-line { border-top: 3px dashed #333; margin: 20px 0; text-align: center; position: relative; }
                .cut-line::after { content: "CORTAR AQUI"; background: white; padding: 0 15px; color: #666; font-size: 12pt; font-weight: bold; position: absolute; top: -12px; left: 50%; transform: translateX(-50%); }
                .header { background-color: #2c3e50; color: white; padding: 15px; text-align: center; margin-bottom: 15px; }
                .header h1 { margin: 0; font-size: 18pt; font-weight: bold; }
                .company-info { background-color: #f8f9fa; padding: 12px; border: 1px solid #ddd; margin-bottom: 12px; }
                .company-name { font-weight: bold; font-size: 14pt; margin-bottom: 5px; }
                .company-details { font-size: 11pt; color: #666; }
                .employee-section { background-color: #e9ecef; padding: 12px; border: 1px solid #ddd; margin-bottom: 12px; }
                .employee-title { font-weight: bold; font-size: 14pt; margin-bottom: 8px; }
                .employee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
                .employee-item { display: flex; align-items: center; }
                .employee-label { font-weight: bold; margin-right: 8px; min-width: 80px; font-size: 11pt; }
                .main-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 11pt; }
                .main-table th, .main-table td { border: 1px solid #333; padding: 8px; text-align: left; }
                .main-table th { background-color: #f0f0f0; font-weight: bold; text-align: center; }
                .main-table .text-right { text-align: right; }
                .main-table .text-center { text-align: center; }
                .total-section { background-color: #f8f9fa; padding: 12px; border: 1px solid #ddd; margin-bottom: 12px; }
                .total-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; }
                .total-item { text-align: center; }
                .total-label { font-size: 11pt; color: #666; }
                .total-value { font-size: 14pt; font-weight: bold; }
                .summary-section { background-color: #e9ecef; padding: 12px; border: 1px solid #ddd; margin-bottom: 12px; }
                .summary-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; font-size: 11pt; }
                .summary-item { display: flex; justify-content: space-between; }
                .signature-section { margin-top: 15px; text-align: center; font-size: 11pt; }
                .signature-line { border-top: 1px solid #333; margin-top: 15px; padding-top: 8px; }
                
                /* Estilos para impressão */
                @media print {
                    body { font-size: 6pt; line-height: 0.9; padding: 0; }
                    .container { max-width: 100%; }
                    .receipt-section { margin-bottom: 6px; border: none; padding: 0; box-shadow: none; }
                    .cut-line { margin: 8px 0; }
                    .cut-line::after { font-size: 5pt; }
                    .header { padding: 3px; margin-bottom: 3px; }
                    .header h1 { font-size: 9pt; }
                    .company-info { padding: 3px; margin-bottom: 3px; }
                    .company-name { font-size: 7pt; margin-bottom: 1px; }
                    .company-details { font-size: 5pt; }
                    .employee-section { padding: 3px; margin-bottom: 3px; }
                    .employee-title { font-size: 7pt; margin-bottom: 1px; }
                    .employee-grid { gap: 1px; }
                    .employee-label { margin-right: 4px; min-width: 45px; font-size: 5pt; }
                    .main-table { margin-bottom: 3px; font-size: 5pt; }
                    .main-table th, .main-table td { padding: 1px; }
                    .total-section { padding: 3px; margin-bottom: 3px; }
                    .total-grid { gap: 2px; }
                    .total-label { font-size: 5pt; }
                    .total-value { font-size: 7pt; }
                    .summary-section { padding: 3px; margin-bottom: 3px; }
                    .summary-grid { gap: 2px; font-size: 5pt; }
                    .signature-section { margin-top: 3px; font-size: 5pt; }
                    .signature-line { margin-top: 4px; padding-top: 1px; }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <!-- PRIMEIRA GUIA - FUNCIONÁRIO -->
                <div class="receipt-section">
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
                            <td>${payroll.customDiscountDescription || 'OUTROS DESCONTOS'}</td>
                            <td class="text-center">-</td>
                            <td class="text-right">-</td>
                            <td class="text-right">${formatCurrency(Number(payroll.otherDiscounts))}</td>
                        </tr>
                        ` : ''}
                        ${(() => {
                          if (!payroll.employee?.employeeRubrics) return ''
                          
                          const calculatedRubrics = calculateEmployeeRubrics(
                            payroll.employee.employeeRubrics,
                            Number(payroll.baseSalary),
                            payroll.month,
                            payroll.year
                          )
                          
                          return calculatedRubrics.map((rubric, index) => `
                        <tr>
                            <td class="text-center">${3407 + index}</td>
                            <td>${rubric.name.toUpperCase()}</td>
                            <td class="text-center">-</td>
                            <td class="text-right">${rubric.isBenefit ? formatCurrency(rubric.value) : '-'}</td>
                            <td class="text-right">${!rubric.isBenefit ? formatCurrency(rubric.value) : '-'}</td>
                        </tr>
                        `).join('')
                        })()}
                    </tbody>
                </table>

                <div class="total-section">
                    <div class="total-grid">
                        <div class="total-item">
                            <div class="total-label">Total de Vencimentos</div>
                            <div class="total-value">${formatCurrency(grossSalary)}</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Total de Descontos</div>
                            <div class="total-value">${formatCurrency(totalDiscounts)}</div>
                        </div>
                        <div class="total-item">
                            <div class="total-label">Valor Líquido</div>
                            <div class="total-value">${formatCurrency(netSalary)}</div>
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
                            <span>${formatCurrency(baseSalary)}</span>
                        </div>
                        <div class="summary-item">
                            <span>Base de Cálc. FGTS:</span>
                            <span>${formatCurrency(baseSalary)}</span>
                        </div>
                        <div class="summary-item">
                            <span>F.G.T.S. do Mês:</span>
                            <span>${formatCurrency(Number(fgts))}</span>
                        </div>
                        <div class="summary-item">
                            <span>Base do I.R.R.F.:</span>
                            <span>${formatCurrency(baseSalary - Number(payroll.inssDiscount || 0))}</span>
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

                <!-- LINHA DE CORTE -->
                <div class="cut-line"></div>

                <!-- SEGUNDA GUIA - EMPRESA -->
                <div class="receipt-section">
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
                                <span>${payroll.employee?.name?.toUpperCase() || ''}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Função:</span>
                                <span>${payroll.employee?.position || ''}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">CPF:</span>
                                <span>${payroll.employee?.cpf || ''}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Admissão:</span>
                                <span>${payroll.employee?.hireDate ? new Date(payroll.employee.hireDate).toLocaleDateString('pt-BR') : ''}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Período:</span>
                                <span>01/${String(payroll.month).padStart(2, '0')}/${payroll.year} a ${new Date(payroll.year, payroll.month, 0).getDate()}/${String(payroll.month).padStart(2, '0')}/${payroll.year}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">Seção:</span>
                                <span>${payroll.employee?.department || ''}</span>
                            </div>
                            <div class="employee-item">
                                <span class="employee-label">PIS:</span>
                                <span>${payroll.employee?.pis || ''}</span>
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
                                <td>${payroll.customDiscountDescription || 'OUTROS DESCONTOS'}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">-</td>
                                <td class="text-right">${formatCurrency(Number(payroll.otherDiscounts))}</td>
                            </tr>
                            ` : ''}
                            ${(() => {
                              if (!payroll.employee?.employeeRubrics) return ''
                              
                              const calculatedRubrics = calculateEmployeeRubrics(
                                payroll.employee.employeeRubrics,
                                Number(payroll.baseSalary),
                                payroll.month,
                                payroll.year
                              )
                              
                              return calculatedRubrics.map((rubric, index) => `
                            <tr>
                                <td class="text-center">${3407 + index}</td>
                                <td>${rubric.name.toUpperCase()}</td>
                                <td class="text-center">-</td>
                                <td class="text-right">${rubric.isBenefit ? formatCurrency(rubric.value) : '-'}</td>
                                <td class="text-right">${!rubric.isBenefit ? formatCurrency(rubric.value) : '-'}</td>
                            </tr>
                            `).join('')
                            })()}
                        </tbody>
                    </table>

                    <div class="total-section">
                        <div class="total-grid">
                            <div class="total-item">
                                <div class="total-label">Total de Vencimentos</div>
                                <div class="total-value">${formatCurrency(grossSalary)}</div>
                            </div>
                            <div class="total-item">
                                <div class="total-label">Total de Descontos</div>
                                <div class="total-value">${formatCurrency(totalDiscounts)}</div>
                            </div>
                            <div class="total-item">
                                <div class="total-label">Valor Líquido</div>
                                <div class="total-value">${formatCurrency(netSalary)}</div>
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
                                <span>${formatCurrency(baseSalary)}</span>
                            </div>
                            <div class="summary-item">
                                <span>Base de Cálc. FGTS:</span>
                                <span>${formatCurrency(baseSalary)}</span>
                            </div>
                            <div class="summary-item">
                                <span>F.G.T.S. do Mês:</span>
                                <span>${formatCurrency(Number(fgts))}</span>
                            </div>
                            <div class="summary-item">
                                <span>Base do I.R.R.F.:</span>
                                <span>${formatCurrency(baseSalary - Number(payroll.inssDiscount || 0))}</span>
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