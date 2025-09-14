import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDate, formatCPF, getMonthName } from '@/lib/utils'
import { CompanySettings } from '@/types'

// Função para obter o último dia do mês
function getLastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

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

    // Buscar todos os recibos do período
    const receipts = await prisma.receipt.findMany({
      where: {
        month: monthNum,
        year: yearNum
      },
      include: {
        employee: true,
        type: true
      },
      orderBy: [
        { employee: { name: 'asc' } },
        { type: { name: 'asc' } }
      ]
    })

    if (receipts.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhum recibo encontrado para este período' 
      }, { status: 404 })
    }

    // Buscar configurações da empresa
    const companySettings: CompanySettings | null = await prisma.companySettings.findFirst()

    // Gerar HTML com todos os recibos
    const htmlContent = generateBatchReceiptsHTML(receipts, companySettings, monthNum, yearNum)

    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="recibos-${monthNum.toString().padStart(2, '0')}-${yearNum}.html"`
      }
    })

  } catch (error) {
    console.error('Batch receipts export error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateBatchReceiptsHTML(receipts: any[], companySettings: any, month: number, year: number): string {
  const monthName = getMonthName(month)
  const companyName = companySettings?.companyName || 'Nome da Empresa'
  
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
    <title>Recibos - ${monthName}/${year}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 0; 
            font-size: 9pt; 
            line-height: 1.1;
            background: white;
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            box-sizing: border-box;
        }
        
        * {
            box-sizing: border-box;
        }
        
        .header { 
            text-align: center; 
            margin-bottom: 10mm; 
            margin-left: 0;
            margin-right: 0;
            border-bottom: 2px solid #333;
            padding-bottom: 5mm;
        }
        
        .header h1 { 
            margin: 0; 
            font-size: 14pt; 
            font-weight: bold;
        }
        
        .header p { 
            margin: 2px 0; 
            font-size: 10pt; 
        }
        
        .receipt-container {
            margin-bottom: 10mm;
            margin-left: 0;
            margin-right: 0;
            page-break-after: always;
            border: 1px solid #ddd;
            padding: 1mm;
        }
        
        .receipt-container:last-child {
            page-break-after: auto;
        }
        
        .receipt-header {
            text-align: center;
            margin-bottom: 5mm;
            padding-bottom: 3mm;
            border-bottom: 1px solid #333;
        }
        
        .receipt-header h1 {
            font-size: 14pt;
            margin: 0;
            font-weight: bold;
        }
        
        .receipt-header p {
            margin: 1px 0;
            font-size: 9pt;
        }
        
        .receipt-title {
            text-align: center;
            font-size: 12pt;
            font-weight: bold;
            margin: 5px 0;
            text-transform: uppercase;
        }
        
        .two-columns {
            display: block;
            margin-bottom: 5mm;
        }
        
        .column {
            width: 100%;
            padding: 1mm;
            margin-bottom: 5mm;
            border: 1px solid #ddd;
            min-height: 55mm;
            page-break-inside: avoid;
        }
        
        .column:last-child {
            margin-bottom: 0;
        }
        
        .column:first-child {
            border-bottom: 2px dashed #333;
            margin-bottom: 3mm;
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
            flex-wrap: wrap;
        }
        
        .info-row .label {
            font-weight: bold;
        }
        
        .details-table {
            width: 100%;
            max-width: 100%;
            border-collapse: collapse;
            font-size: 8pt;
            border: 1px solid #333;
            table-layout: fixed;
        }
        
        .details-table th {
            background-color: #f0f0f0;
            padding: 0.5mm;
            border: 1px solid #333;
            font-weight: bold;
            text-align: center;
        }
        
        .details-table td {
            padding: 0.5mm;
            border: 1px solid #333;
            text-align: left;
            word-wrap: break-word;
            overflow-wrap: break-word;
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
            height: 15px;
        }
        
        .signature-box p {
            margin: 0;
            font-size: 7pt;
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
        
        @media print {
            .print-buttons {
                display: none;
            }
            
            body {
                margin: 0;
                padding: 0;
                font-size: 8pt;
                width: 100%;
                max-width: none;
                box-sizing: border-box;
            }
            
            .receipt-container {
                margin-bottom: 0;
                margin-left: 0;
                margin-right: 0;
                page-break-after: always;
                border: none;
                padding: 0;
                width: 100%;
                box-sizing: border-box;
            }
            
            .receipt-container:last-child {
                page-break-after: auto;
            }
            
            .header {
                margin-left: 0;
                margin-right: 0;
                width: 100%;
                box-sizing: border-box;
            }
            
            .column {
                width: 100%;
                box-sizing: border-box;
                padding: 0.5mm;
            }
            
            .details-table {
                width: 100%;
                max-width: 100%;
                box-sizing: border-box;
            }
            
            .info-row {
                width: 100%;
                box-sizing: border-box;
            }
        }
        
        @page {
            size: A4;
            margin: 10mm 3mm 10mm 3mm;
        }
    </style>
</head>
<body>
    <div class="print-buttons">
        <button class="print-button" onclick="window.print()">🖨️ Imprimir</button>
        <button class="print-button print" onclick="saveAsPDF()">📄 Salvar como PDF</button>
    </div>

    <div class="header">
        <h1>${companyName}</h1>
        <p>Recibos de ${monthName.toUpperCase()}/${year}</p>
        <p>Total: ${receipts.length} recibo(s) - Gerado em ${formatDate(new Date())}</p>
    </div>

    ${receipts.map(receipt => `
        <div class="receipt-container">
            <div class="two-columns">
                <!-- VIA DA EMPRESA -->
                <div class="column">
                    <div class="receipt-header">
                        <h1>${companyName}</h1>
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
                        <div class="info-row">
                            <span class="label">Período: ${monthName} - 01 a ${getLastDayOfMonth(year, month)} de ${year}</span>
                        </div>
                    </div>

                    <div class="receipt-details">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th style="width: 12%;">Código</th>
                                    <th style="width: 33%;">Descrição</th>
                                    <th style="width: 35%;">Referência</th>
                                    <th style="width: 20%;">Valor</th>
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
                    <div class="receipt-header">
                        <h1>${companyName}</h1>
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
                        <div class="info-row">
                            <span class="label">Período: ${monthName} - 01 a ${getLastDayOfMonth(year, month)} de ${year}</span>
                        </div>
                    </div>

                    <div class="receipt-details">
                        <table class="details-table">
                            <thead>
                                <tr>
                                    <th style="width: 12%;">Código</th>
                                    <th style="width: 33%;">Descrição</th>
                                    <th style="width: 35%;">Referência</th>
                                    <th style="width: 20%;">Valor</th>
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
        </div>
    `).join('')}

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
