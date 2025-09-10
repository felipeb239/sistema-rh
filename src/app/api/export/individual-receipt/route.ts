import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatCPF, getMonthName } from '@/lib/utils'

// Função para obter o último dia do mês
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}
import { CompanySettings } from '@/types'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const receiptId = searchParams.get('id')
    const format = searchParams.get('format') || 'pdf' // 'pdf' or 'csv'

    if (!receiptId) {
      return NextResponse.json({ error: 'ID do recibo é obrigatório' }, { status: 400 })
    }

    const receipt = await prisma.receipt.findUnique({
      where: { id: receiptId },
      include: { 
        employee: true,
        type: true
      }
    })

    if (!receipt) {
      return NextResponse.json({ error: 'Recibo não encontrado' }, { status: 404 })
    }

    const companySettings: CompanySettings | null = await prisma.companySettings.findFirst()

    if (format === 'csv') {
      // CSV Export
      const headers = [
        'Funcionário', 'CPF', 'Cargo', 'Tipo', 'Mês/Ano',
        'Valor Diário', 'Dias', 'Valor Total'
      ]
      
      const csvContent = headers.join(';') + '\n' + [
        receipt.employee?.name || '',
        formatCPF(receipt.employee?.cpf || ''),
        receipt.employee?.position || '',
        receipt.type?.name || 'Tipo não encontrado',
        `01 a ${getLastDayOfMonth(receipt.year, receipt.month).toString().padStart(2, '0')} de ${getMonthName(receipt.month)}/${receipt.year}`,
        receipt.dailyValue.toFixed(2).replace('.', ','),
        receipt.days,
        receipt.value.toFixed(2).replace('.', ',')
      ].join(';') + '\n'

      const bom = '\ufeff'
      const finalCsvContent = bom + csvContent

      return new NextResponse(finalCsvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="recibo_${receipt.type?.name?.replace(/\s+/g, '_') || 'tipo'}_${receipt.employee?.name?.replace(/\s+/g, '_')}_${receipt.month}_${receipt.year}.csv"`
        }
      })
    } else {
      // PDF Export (HTML format for printing) - Layout compacto
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recibo - ${receipt.employee?.name}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 8mm; 
                    font-size: 9pt; 
                    line-height: 1.1;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 5mm; 
                    border-bottom: 1px solid #333;
                    padding-bottom: 3mm;
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 11pt; 
                    font-weight: bold;
                }
                .header p { 
                    margin: 1px 0; 
                    font-size: 8pt; 
                }
                .column .header {
                    text-align: center;
                    margin-bottom: 5mm;
                    padding-bottom: 3mm;
                    border-bottom: 1px solid #333;
                }
                .column .header h1 {
                    font-size: 11pt;
                    margin: 0;
                    font-weight: bold;
                }
                .column .header p {
                    margin: 1px 0;
                    font-size: 8pt;
                }
                .receipt-title {
                    text-align: center;
                    font-size: 12pt;
                    font-weight: bold;
                    margin: 5px 0;
                    text-transform: uppercase;
                }
                .column .receipt-title {
                    font-size: 12pt;
                    margin: 5px 0;
                }
                .two-columns {
                    display: block;
                    margin-bottom: 3mm;
                }
                .column {
                    width: 100%;
                    padding: 4mm;
                    margin-bottom: 8mm;
                    page-break-inside: avoid;
                    border-bottom: 1px dashed #333;
                }
                .column:last-child {
                    margin-bottom: 0;
                    border-bottom: none;
                }
                .column h3 {
                    margin: 0 0 3mm 0;
                    font-size: 10pt;
                    text-align: center;
                    border-bottom: 1px solid #333;
                    padding-bottom: 2mm;
                }
                .employee-info, .receipt-details {
                    margin-bottom: 3mm;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 2mm;
                    font-size: 8pt;
                }
                .info-row .label {
                    font-weight: bold;
                }
                .details-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 8pt;
                    border: 1px solid #333;
                }
                .details-table th {
                    background-color: #f0f0f0;
                    padding: 2mm;
                    border: 1px solid #333;
                    font-weight: bold;
                    text-align: center;
                }
                .details-table td {
                    padding: 1mm 2mm;
                    border: 1px solid #333;
                    text-align: left;
                }
                .details-table .value-cell {
                    text-align: right;
                    font-weight: bold;
                }
                .details-table .total-row {
                    background-color: #f8f8f8;
                    font-weight: bold;
                }
                .details-table .total-row td {
                    padding: 2mm;
                    border-top: 2px solid #333;
                }
                .label {
                    font-weight: 500;
                }
                .value {
                    text-align: right;
                }
                .signature-section {
                    margin-top: 5mm;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-box {
                    text-align: center;
                    width: 45%;
                }
                .signature-line {
                    border-bottom: 1px solid #333;
                    margin-bottom: 1mm;
                    height: 20px;
                }
                .signature-box p {
                    margin: 0;
                    font-size: 7pt;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 3mm; 
                    font-size: 7pt; 
                    color: #777; 
                    border-top: 1px solid #ccc;
                    padding-top: 2mm;
                }
                @media print {
                    body { margin: 5mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="two-columns">
                <!-- VIA DA EMPRESA -->
                <div class="column">
                    <div class="header">
                        <h1>${companySettings?.companyName || 'Nome da Empresa'}</h1>
                        <p>${companySettings?.address || ''} - ${companySettings?.city || ''}, ${companySettings?.state || ''}</p>
                        <p>CNPJ: ${companySettings?.cnpj || ''} | Telefone: ${companySettings?.phone || ''}</p>
                    </div>

                    <div class="receipt-title">
                        RECIBO DE ${receipt.type?.name?.toUpperCase() || 'TIPO'}
                    </div>

                    <h3>VIA DA EMPRESA</h3>
                    
                    <div class="employee-info">
                        <div class="info-row">
                            <span class="label">Nome: ${receipt.employee?.name || ''}</span>
                            <span class="label">CPF: ${formatCPF(receipt.employee?.cpf || '')}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Cargo: ${receipt.employee?.position || ''}</span>
                            <span class="label">Departamento: ${receipt.employee?.department || ''}</span>
                        </div>
                    </div>

                    <div class="receipt-details">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição</th>
                                    <th>Referência</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>${receipt.type?.name || 'Tipo não encontrado'}</td>
                                    <td>${receipt.days} dias x ${formatCurrency(Number(receipt.dailyValue) || 0)}</td>
                                    <td class="value-cell">${formatCurrency(Number(receipt.value) || 0)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3"><strong>VALOR TOTAL:</strong></td>
                                    <td class="value-cell"><strong>${formatCurrency(Number(receipt.value) || 0)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>Assinatura do Funcionário</p>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>Assinatura do Responsável</p>
                        </div>
                    </div>
                </div>

                <!-- VIA DO FUNCIONÁRIO -->
                <div class="column">
                    <div class="header">
                        <h1>${companySettings?.companyName || 'Nome da Empresa'}</h1>
                        <p>${companySettings?.address || ''} - ${companySettings?.city || ''}, ${companySettings?.state || ''}</p>
                        <p>CNPJ: ${companySettings?.cnpj || ''} | Telefone: ${companySettings?.phone || ''}</p>
                    </div>

                    <div class="receipt-title">
                        RECIBO DE ${receipt.type?.name?.toUpperCase() || 'TIPO'}
                    </div>

                    <h3>VIA DO FUNCIONÁRIO</h3>
                    
                    <div class="employee-info">
                        <div class="info-row">
                            <span class="label">Nome: ${receipt.employee?.name || ''}</span>
                            <span class="label">CPF: ${formatCPF(receipt.employee?.cpf || '')}</span>
                        </div>
                        <div class="info-row">
                            <span class="label">Cargo: ${receipt.employee?.position || ''}</span>
                            <span class="label">Departamento: ${receipt.employee?.department || ''}</span>
                        </div>
                    </div>

                    <div class="receipt-details">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Descrição</th>
                                    <th>Referência</th>
                                    <th>Valor</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>1</td>
                                    <td>${receipt.type?.name || 'Tipo não encontrado'}</td>
                                    <td>${receipt.days} dias x ${formatCurrency(Number(receipt.dailyValue) || 0)}</td>
                                    <td class="value-cell">${formatCurrency(Number(receipt.value) || 0)}</td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="total-row">
                                    <td colspan="3"><strong>VALOR TOTAL:</strong></td>
                                    <td class="value-cell"><strong>${formatCurrency(Number(receipt.value) || 0)}</strong></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div class="signature-section">
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>Assinatura do Funcionário</p>
                        </div>
                        <div class="signature-box">
                            <div class="signature-line"></div>
                            <p>Assinatura do Responsável</p>
                        </div>
                    </div>
                </div>
            </div>

            <div class="footer">
                <p>Gerado em ${formatDate(new Date())}</p>
                <p>Este recibo comprova o pagamento referente ao período indicado.</p>
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
    console.error('Individual receipt export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
