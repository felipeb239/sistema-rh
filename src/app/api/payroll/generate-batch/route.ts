import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Iniciando geração de folha...')
    
    const { month, year, employeeIds } = await request.json()
    console.log('Dados recebidos:', { month, year, employeeIds })

    if (!month || !year || !employeeIds || !Array.isArray(employeeIds)) {
      console.log('❌ Dados inválidos')
      return NextResponse.json(
        { message: 'Dados inválidos. Mês, ano e lista de funcionários são obrigatórios.' },
        { status: 400 }
      )
    }

    // Verificar se já existem holerites para estes funcionários no período
    console.log('🔍 Verificando holerites existentes...')
    const existingPayrolls = await prisma.payroll.findMany({
      where: {
        month,
        year,
        employeeId: {
          in: employeeIds
        }
      },
      select: {
        employeeId: true,
        employee: {
          select: {
            name: true
          }
        }
      }
    })

    if (existingPayrolls.length > 0) {
      const duplicateNames = existingPayrolls.map(p => p.employee.name).join(', ')
      console.log('❌ Holerites já existem:', duplicateNames)
      return NextResponse.json(
        { message: `Já existem holerites para os seguintes funcionários: ${duplicateNames}` },
        { status: 400 }
      )
    }

    // Buscar dados dos funcionários com suas rubricas e recibos
    console.log('🔍 Buscando funcionários...')
    const employees = await prisma.employee.findMany({
      where: {
        id: {
          in: employeeIds
        },
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        salary: true,
        employeeRubrics: {
          where: {
            isActive: true,
            OR: [
              {
                startDate: null
              },
              {
                startDate: {
                  lte: new Date(`${year}-${month.toString().padStart(2, '0')}-01T03:00:00.000Z`)
                }
              }
            ],
            AND: [
              {
                OR: [
                  {
                    endDate: null
                  },
                  {
                    endDate: {
                      gte: new Date(`${year}-${month.toString().padStart(2, '0')}-01T03:00:00.000Z`)
                    }
                  }
                ]
              }
            ]
          },
          include: {
            rubric: true
          }
        },
        receipts: {
          where: {
            month: month,
            year: year
          },
          include: {
            type: true
          }
        }
      }
    })
    
    console.log('✅ Funcionários encontrados:', employees.length)
    console.log('Funcionários:', employees.map(emp => ({ id: emp.id, name: emp.name })))

    if (employees.length === 0) {
      console.log('❌ Nenhum funcionário encontrado')
      return NextResponse.json(
        { message: 'Nenhum funcionário ativo encontrado com os IDs fornecidos.' },
        { status: 400 }
      )
    }

    // Criar holerites para cada funcionário
    console.log('🔨 Criando holerites...')
    const payrollsToCreate = employees.map(employee => {
      console.log(`Processando funcionário: ${employee.name}`)
      
      // Calcular valores básicos
      const baseSalary = Number(employee.salary) || 0
      let grossSalary = baseSalary
      let netSalary = baseSalary
      
      // Calcular rubricas do funcionário
      let totalBenefits = 0
      let totalDiscounts = 0
      
      employee.employeeRubrics.forEach(empRubric => {
        const rubric = empRubric.rubric
        let value = 0
        
        if (empRubric.customValue) {
          value = Number(empRubric.customValue)
        } else if (empRubric.customPercentage) {
          value = baseSalary * Number(empRubric.customPercentage)
        } else if (rubric.defaultValue) {
          value = Number(rubric.defaultValue)
        } else if (rubric.defaultPercentage) {
          value = baseSalary * Number(rubric.defaultPercentage)
        }
        
        if (rubric.type === 'benefit') {
          totalBenefits += value
          grossSalary += value
        } else if (rubric.type === 'discount') {
          totalDiscounts += value
          grossSalary -= value
        }
      })
      
      // Calcular recibos do funcionário para o período
      let receiptBenefits = 0
      let receiptDiscounts = 0
      
      employee.receipts.forEach(receipt => {
        const receiptValue = Number(receipt.value)
        const receiptTypeName = receipt.type.name.toLowerCase()
        
        if (receiptTypeName.includes('vale') || receiptTypeName.includes('alimentação') || 
            receiptTypeName.includes('benefício') || receiptTypeName.includes('bonus')) {
          receiptBenefits += receiptValue
          grossSalary += receiptValue
        } else {
          receiptDiscounts += receiptValue
          grossSalary -= receiptValue
        }
      })
      
      // Calcular salário líquido
      netSalary = grossSalary
      
      console.log(`   Salário base: R$ ${baseSalary}`)
      console.log(`   Benefícios (rubricas): R$ ${totalBenefits}`)
      console.log(`   Descontos (rubricas): R$ ${totalDiscounts}`)
      console.log(`   Benefícios (recibos): R$ ${receiptBenefits}`)
      console.log(`   Descontos (recibos): R$ ${receiptDiscounts}`)
      console.log(`   Salário bruto: R$ ${grossSalary}`)
      console.log(`   Salário líquido: R$ ${netSalary}`)

      return {
        id: `payroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        employeeId: employee.id,
        month,
        year,
        baseSalary: baseSalary.toString(),
        grossSalary: grossSalary.toString(),
        netSalary: netSalary.toString(),
        inssDiscount: '0',
        irrfDiscount: '0',
        fgtsAmount: '0',
        healthInsurance: '0',
        dentalInsurance: '0',
        otherDiscounts: '0',
        customDiscount: '0',
        customDiscountDescription: null,
        receiptBenefits: receiptBenefits.toString(),
        receiptDiscounts: receiptDiscounts.toString()
      }
    })

    console.log('🔨 Inserindo holerites no banco...')
    // Inserir holerites em lote
    const createdPayrolls = await prisma.payroll.createMany({
      data: payrollsToCreate
    })

    console.log('✅ Holerites criados com sucesso!')
    console.log('Quantidade:', createdPayrolls.count)

    return NextResponse.json({
      message: 'Folha de pagamento gerada com sucesso',
      created: createdPayrolls.count,
      month,
      year,
      employees: employees.map(emp => emp.name)
    })

  } catch (error) {
    console.error('❌ Erro ao gerar folha de pagamento:', error)
    console.error('Stack trace:', error.stack)
    return NextResponse.json(
      { message: 'Erro interno do servidor', error: error.message },
      { status: 500 }
    )
  }
}