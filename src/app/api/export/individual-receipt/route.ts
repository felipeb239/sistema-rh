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
      // PDF Export (HTML format for printing)
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
                    margin: 20mm; 
                    font-size: 10pt; 
                    line-height: 1.4;
                }
                .header { 
                    text-align: center; 
                    margin-bottom: 20mm; 
                    border-bottom: 2px solid #333;
                    padding-bottom: 10mm;
                }
                .header img { 
                    max-width: 150px; 
                    max-height: 80px; 
                    object-fit: contain; 
                    margin-bottom: 10px; 
                }
                .header h1 { 
                    margin: 0; 
                    font-size: 16pt; 
                    font-weight: bold;
                }
                .header p { 
                    margin: 2px 0; 
                    font-size: 9pt; 
                }
                .receipt-title {
                    text-align: center;
                    font-size: 18pt;
                    font-weight: bold;
                    margin: 20px 0;
                    text-transform: uppercase;
                }
                .employee-info {
                    background-color: #f8f9fa;
                    padding: 15px;
                    margin-bottom: 20px;
                    border-radius: 5px;
                }
                .receipt-details {
                    background-color: #f8f9fa;
                    padding: 20px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                }
                .row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    padding: 5px 0;
                }
                .row.total {
                    font-weight: bold;
                    font-size: 12pt;
                    border-top: 2px solid #333;
                    padding-top: 10px;
                    margin-top: 15px;
                }
                .label {
                    font-weight: 500;
                }
                .value {
                    text-align: right;
                }
                .signature-section {
                    margin-top: 40px;
                    display: flex;
                    justify-content: space-between;
                }
                .signature-box {
                    text-align: center;
                    width: 45%;
                }
                .signature-line {
                    border-bottom: 1px solid #333;
                    margin-bottom: 5px;
                    height: 40px;
                }
                .footer { 
                    text-align: center; 
                    margin-top: 20mm; 
                    font-size: 8pt; 
                    color: #777; 
                    border-top: 1px solid #ccc;
                    padding-top: 10px;
                }
                @media print {
                    body { margin: 10mm; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${companySettings?.logo ? `<img src="${companySettings.logo}" alt="${companySettings.companyName || 'Logo da Empresa'}">` : ''}
                <h1>${companySettings?.companyName || 'Nome da Empresa'}</h1>
                <p>${companySettings?.address || ''} - ${companySettings?.city || ''}, ${companySettings?.state || ''}</p>
                <p>CNPJ: ${companySettings?.cnpj || ''} | Telefone: ${companySettings?.phone || ''}</p>
            </div>

            <div class="receipt-title">
                RECIBO DE ${receipt.type?.name?.toUpperCase() || 'TIPO'}
            </div>

            <div class="employee-info">
                <h3>Dados do Funcionário</h3>
                <div class="row">
                    <span class="label">Nome:</span>
                    <span class="value">${receipt.employee?.name || ''}</span>
                </div>
                <div class="row">
                    <span class="label">CPF:</span>
                    <span class="value">${formatCPF(receipt.employee?.cpf || '')}</span>
                </div>
                <div class="row">
                    <span class="label">Cargo:</span>
                    <span class="value">${receipt.employee?.position || ''}</span>
                </div>
                <div class="row">
                    <span class="label">Departamento:</span>
                    <span class="value">${receipt.employee?.department || ''}</span>
                </div>
            </div>

            <div class="receipt-details">
                <h3>Detalhes do Recibo</h3>
                <div class="row">
                    <span class="label">Tipo:</span>
                    <span class="value">${receipt.type?.name || 'Tipo não encontrado'}</span>
                </div>
                <div class="row">
                    <span class="label">Período:</span>
                    <span class="value">01 a ${getLastDayOfMonth(receipt.year, receipt.month).toString().padStart(2, '0')} de ${getMonthName(receipt.month)}/${receipt.year}</span>
                </div>
                <div class="row">
                    <span class="label">Valor Diário:</span>
                    <span class="value">${formatCurrency(Number(receipt.dailyValue) || 0)}</span>
                </div>
                <div class="row">
                    <span class="label">Número de Dias:</span>
                    <span class="value">${receipt.days}</span>
                </div>
                <div class="row total">
                    <span class="label">VALOR TOTAL:</span>
                    <span class="value">${formatCurrency(Number(receipt.value) || 0)}</span>
                </div>
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
