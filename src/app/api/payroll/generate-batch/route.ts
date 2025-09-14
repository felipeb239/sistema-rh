import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { month, year, employeeIds } = await request.json()

    if (!month || !year || !employeeIds || !Array.isArray(employeeIds)) {
      return NextResponse.json(
        { message: 'Dados inválidos. Mês, ano e lista de funcionários são obrigatórios.' },
        { status: 400 }
      )
    }

    // Verificar se já existem holerites para estes funcionários no período
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
      return NextResponse.json(
        { message: `Já existem holerites para os seguintes funcionários: ${duplicateNames}` },
        { status: 400 }
      )
    }

    // Buscar dados dos funcionários com suas rubricas e recibos
    console.log('Buscando funcionários com IDs:', employeeIds)
    console.log('Período:', { month, year })
    
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
              { startDate: null },
              { startDate: { lte: new Date(year, month - 1, 1) } }
            ],
            AND: [
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: new Date(year, month - 1, 1) } }
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
    
    console.log('Funcionários encontrados:', employees.map(emp => ({
      id: emp.id,
      name: emp.name,
      receiptsCount: emp.receipts.length,
      receipts: emp.receipts.map(r => ({ type: r.type.name, value: r.value }))
    })))

    if (employees.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum funcionário ativo encontrado' },
        { status: 400 }
      )
    }

    // Criar holerites base para cada funcionário com rubricas e recibos aplicados
    const payrollsToCreate = employees.map(employee => {
      let grossSalary = Number(employee.salary)
      let totalDiscounts = 0
      let healthInsurance = 0
      let dentalInsurance = 0
      let otherDiscounts = 0
      let customDiscount = 0
      let customDiscountDescription = ''
      let receiptBenefits = 0
      let receiptDiscounts = 0

      // Calcular rubricas do funcionário
      console.log(`📋 Processando rubricas para ${employee.name}:`)
      employee.employeeRubrics.forEach(rubric => {
        let value = 0
        
        if (rubric.customValue) {
          value = Number(rubric.customValue)
        } else if (rubric.customPercentage && employee.salary) {
          value = Number(employee.salary) * (Number(rubric.customPercentage) / 100)
        }

        if (value > 0) {
          const rubricName = rubric.customName || rubric.rubric.name
          console.log(`   📋 Rubrica: ${rubricName}`)
          console.log(`   💰 Valor: R$ ${value}`)
          console.log(`   🏷️ Tipo: ${rubric.rubric.type}`)
          console.log(`   🔢 Código: ${rubric.rubric.code || 'sem código'}`)
          
          if (rubric.rubric.type === 'proventos') {
            grossSalary += value
            console.log(`   ✅ Somado ao salário bruto. Novo total: R$ ${grossSalary}`)
          } else {
            totalDiscounts += value
            
            // Categorizar descontos
            const rubricNameLower = rubricName.toLowerCase()
            console.log(`   🔍 Categorizando: "${rubricNameLower}"`)
            
            if (rubricNameLower.includes('saúde') || rubricNameLower.includes('plano de saúde')) {
              healthInsurance += value
              console.log(`   🏥 Categorizado como Plano de Saúde: R$ ${value}`)
            } else if (rubricNameLower.includes('odontológico') || rubricNameLower.includes('dental')) {
              dentalInsurance += value
              console.log(`   🦷 Categorizado como Plano Odontológico: R$ ${value}`)
            } else if (rubricNameLower.includes('empréstimo') || rubricNameLower.includes('consignado')) {
              customDiscount += value
              customDiscountDescription = rubricName
              console.log(`   💳 Categorizado como Empréstimo: R$ ${value}`)
            } else {
              otherDiscounts += value
              console.log(`   📝 Categorizado como Outros Descontos: R$ ${value}`)
            }
            console.log(`   ✅ Somado aos descontos. Total descontos: R$ ${totalDiscounts}`)
          }
        }
      })

      // Calcular recibos do funcionário para o período
      console.log(`Processando recibos para funcionário ${employee.name}:`, employee.receipts)
      employee.receipts.forEach(receipt => {
        console.log(`Verificando recibo: ${receipt.type.name} - Mês: ${receipt.month}, Ano: ${receipt.year} - Período atual: ${month}/${year}`)
        if (receipt.month === month && receipt.year === year) {
          const receiptValue = Number(receipt.value)
          const receiptTypeName = receipt.type.name.toLowerCase()
          
          console.log(`✅ Recibo encontrado: ${receiptTypeName} = R$ ${receiptValue}`)
          
          // Categorizar recibos como benefícios ou descontos
          if (receiptTypeName.includes('vale') || receiptTypeName.includes('alimentação') || 
              receiptTypeName.includes('transporte') || receiptTypeName.includes('refeição') ||
              receiptTypeName.includes('gratificação') || receiptTypeName.includes('função') ||
              receiptTypeName.includes('ajuda') || receiptTypeName.includes('custo') ||
              receiptTypeName.includes('ressarcimento') || receiptTypeName.includes('combustível') ||
              receiptTypeName.includes('hotel') || receiptTypeName.includes('hospedagem')) {
            console.log(`✅ Categorizado como BENEFÍCIO: ${receiptTypeName}`)
            receiptBenefits += receiptValue
            grossSalary += receiptValue
            console.log(`✅ Salário bruto atualizado: R$ ${grossSalary}`)
          } else {
            console.log(`✅ Categorizado como DESCONTO: ${receiptTypeName}`)
            // Recibos que são descontos (ex: empréstimos, consignados)
            receiptDiscounts += receiptValue
            totalDiscounts += receiptValue
            otherDiscounts += receiptValue
          }
        } else {
          console.log(`❌ Recibo não corresponde ao período: ${receipt.month}/${receipt.year} != ${month}/${year}`)
        }
      })

      const netSalary = grossSalary - totalDiscounts

      console.log(`📊 RESUMO FINAL para ${employee.name}:`)
      console.log(`   Salário base: R$ ${employee.salary}`)
      console.log(`   Receipt Benefits: R$ ${receiptBenefits}`)
      console.log(`   Receipt Discounts: R$ ${receiptDiscounts}`)
      console.log(`   Salário bruto final: R$ ${grossSalary}`)
      console.log(`   Total descontos: R$ ${totalDiscounts}`)
      console.log(`   Salário líquido: R$ ${netSalary}`)

      return {
        employeeId: employee.id,
        month,
        year,
        baseSalary: employee.salary,
        grossSalary,
        netSalary,
        // Campos padrão zerados (apenas os que existem no schema)
        inssDiscount: 0,
        irrfDiscount: 0,
        fgtsAmount: 0,
        healthInsurance,
        dentalInsurance,
        otherDiscounts,
        customDiscount,
        customDiscountDescription: customDiscountDescription || null,
        receiptBenefits,
        receiptDiscounts
      }
    })

    // Inserir holerites em lote
    const createdPayrolls = await prisma.payroll.createMany({
      data: payrollsToCreate
    })

    return NextResponse.json({
      message: 'Folha de pagamento gerada com sucesso',
      created: createdPayrolls.count,
      month,
      year,
      employees: employees.map(emp => emp.name)
    })

  } catch (error) {
    console.error('Erro ao gerar folha de pagamento:', error)
    return NextResponse.json(
      { message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
