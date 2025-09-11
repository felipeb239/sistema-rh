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

    // Gerar HTML otimizado para conversão em PDF
    const htmlContent = generatePDFHTML(payrolls, totals, companySettings, monthNum, yearNum)

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

function generatePDFHTML(payrolls: any[], totals: any, companySettings: any, month: number, year: number): string {
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
}
