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

    // Buscar dados dos funcionários com suas rubricas
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
        }
      }
    })

    if (employees.length === 0) {
      return NextResponse.json(
        { message: 'Nenhum funcionário ativo encontrado' },
        { status: 400 }
      )
    }

    // Criar holerites base para cada funcionário com rubricas aplicadas
    const payrollsToCreate = employees.map(employee => {
      let grossSalary = Number(employee.salary)
      let totalDiscounts = 0
      let healthInsurance = 0
      let dentalInsurance = 0
      let otherDiscounts = 0
      let customDiscount = 0
      let customDiscountDescription = ''

      // Calcular rubricas do funcionário
      employee.employeeRubrics.forEach(rubric => {
        let value = 0
        
        if (rubric.customValue) {
          value = Number(rubric.customValue)
        } else if (rubric.customPercentage && employee.salary) {
          value = Number(employee.salary) * (Number(rubric.customPercentage) / 100)
        }

        if (value > 0) {
          if (rubric.rubric.type === 'benefit') {
            grossSalary += value
          } else {
            totalDiscounts += value
            
            // Categorizar descontos
            const rubricName = (rubric.customName || rubric.rubric.name).toLowerCase()
            if (rubricName.includes('saúde') || rubricName.includes('plano de saúde')) {
              healthInsurance += value
            } else if (rubricName.includes('odontológico') || rubricName.includes('dental')) {
              dentalInsurance += value
            } else if (rubricName.includes('empréstimo') || rubricName.includes('consignado')) {
              customDiscount += value
              customDiscountDescription = rubric.customName || rubric.rubric.name
            } else {
              otherDiscounts += value
            }
          }
        }
      })

      const netSalary = grossSalary - totalDiscounts

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
        customDiscountDescription: customDiscountDescription || null
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
