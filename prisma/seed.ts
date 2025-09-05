import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin
  const hashedPassword = await bcrypt.hash('admin', 10)
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      name: 'Administrador',
      email: 'admin@empresa.com',
      role: 'admin',
      status: 'active'
    }
  })

  // Criar usuário comum
  const user = await prisma.user.upsert({
    where: { username: 'user' },
    update: {},
    create: {
      username: 'user',
      password: hashedPassword,
      name: 'Usuário Comum',
      email: 'user@empresa.com',
      role: 'user',
      status: 'active'
    }
  })

  // Criar configurações da empresa
  await prisma.companySettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      companyName: 'Sua Empresa',
      cnpj: '12345678000195',
      address: 'Rua Exemplo, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      phone: '(11) 99999-9999',
      email: 'contato@empresa.com',
      website: 'https://empresa.com'
    }
  })

  // Criar tipos de recibos padrão
  const receiptTypes = await Promise.all([
    prisma.receiptType.upsert({
      where: { name: 'Vale Transporte' },
      update: {},
      create: {
        name: 'Vale Transporte',
        description: 'Recibo para vale transporte'
      }
    }),
    prisma.receiptType.upsert({
      where: { name: 'Vale Alimentação' },
      update: {},
      create: {
        name: 'Vale Alimentação',
        description: 'Recibo para vale alimentação'
      }
    }),
    prisma.receiptType.upsert({
      where: { name: 'Vale Combustível' },
      update: {},
      create: {
        name: 'Vale Combustível',
        description: 'Recibo para vale combustível'
      }
    }),
    prisma.receiptType.upsert({
      where: { name: 'Ressarcimento' },
      update: {},
      create: {
        name: 'Ressarcimento',
        description: 'Recibo para ressarcimento de despesas'
      }
    }),
    prisma.receiptType.upsert({
      where: { name: 'Hotel' },
      update: {},
      create: {
        name: 'Hotel',
        description: 'Recibo para hospedagem'
      }
    }),
    prisma.receiptType.upsert({
      where: { name: 'Ajuda de Custo' },
      update: {},
      create: {
        name: 'Ajuda de Custo',
        description: 'Recibo para ajuda de custo'
      }
    })
  ])

  // Criar rubricas padrão para holerites
  const payrollRubrics = await Promise.all([
    // Descontos
    prisma.payrollRubric.upsert({
      where: { name: 'INSS' },
      update: {},
      create: {
        name: 'INSS',
        description: 'Desconto do INSS',
        type: 'discount',
        code: '2801'
      }
    }),
    prisma.payrollRubric.upsert({
      where: { name: 'IRRF' },
      update: {},
      create: {
        name: 'IRRF',
        description: 'Desconto do Imposto de Renda',
        type: 'discount',
        code: '2804'
      }
    }),
    prisma.payrollRubric.upsert({
      where: { name: 'Plano de Saúde' },
      update: {},
      create: {
        name: 'Plano de Saúde',
        description: 'Desconto do plano de saúde',
        type: 'discount',
        code: '3405'
      }
    }),
    prisma.payrollRubric.upsert({
      where: { name: 'Plano Odontológico' },
      update: {},
      create: {
        name: 'Plano Odontológico',
        description: 'Desconto do plano odontológico',
        type: 'discount',
        code: '3407'
      }
    }),
    prisma.payrollRubric.upsert({
      where: { name: 'Outros Descontos' },
      update: {},
      create: {
        name: 'Outros Descontos',
        description: 'Outros descontos diversos',
        type: 'discount',
        code: '3406'
      }
    }),
  ])

  // Criar alguns funcionários de exemplo
  const employees = await Promise.all([
    prisma.employee.upsert({
      where: { cpf: '12345678901' },
      update: {},
      create: {
        name: 'João Silva',
        cpf: '12345678901',
        position: 'Desenvolvedor',
        department: 'TI',
        hireDate: new Date('2023-01-15'),
        salary: 5000.00
      }
    }),
    prisma.employee.upsert({
      where: { cpf: '98765432100' },
      update: {},
      create: {
        name: 'Maria Santos',
        cpf: '98765432100',
        position: 'Analista',
        department: 'RH',
        hireDate: new Date('2023-03-20'),
        salary: 4500.00
      }
    }),
    prisma.employee.upsert({
      where: { cpf: '11122233344' },
      update: {},
      create: {
        name: 'Pedro Costa',
        cpf: '11122233344',
        position: 'Gerente',
        department: 'Vendas',
        hireDate: new Date('2022-11-10'),
        salary: 8000.00
      }
    })
  ])

  // Criar alguns holerites de exemplo
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  for (const employee of employees) {
    await prisma.payroll.upsert({
      where: {
        employeeId_month_year: {
          employeeId: employee.id,
          month: currentMonth,
          year: currentYear
        }
      },
      update: {},
      create: {
        employeeId: employee.id,
        month: currentMonth,
        year: currentYear,
        baseSalary: Number(employee.salary),
        inssDiscount: Number(employee.salary) * 0.08, // 8% INSS
        irrfDiscount: Number(employee.salary) * 0.15, // 15% IRRF
        healthInsurance: 200,
        dentalInsurance: 50,
        customDiscount: 0,
        customDiscountDescription: null,
        otherDiscounts: 0,
        grossSalary: Number(employee.salary),
        netSalary: Number(employee.salary) - (Number(employee.salary) * 0.08) - (Number(employee.salary) * 0.15) - 200 - 50,
        fgtsAmount: Number(employee.salary) * 0.08
      }
    })
  }

  // Criar alguns recibos de exemplo
  for (const employee of employees) {
    // Buscar os tipos de recibos criados
    const valeTransporte = await prisma.receiptType.findUnique({
      where: { name: 'Vale Transporte' }
    })
    
    const valeAlimentacao = await prisma.receiptType.findUnique({
      where: { name: 'Vale Alimentação' }
    })

    if (valeTransporte) {
      await prisma.receipt.create({
        data: {
          employeeId: employee.id,
          typeId: valeTransporte.id,
          month: currentMonth,
          year: currentYear,
          dailyValue: 8.50,
          days: 22,
          value: 8.50 * 22
        }
      })
    }

    if (valeAlimentacao) {
      await prisma.receipt.create({
        data: {
          employeeId: employee.id,
          typeId: valeAlimentacao.id,
          month: currentMonth,
          year: currentYear,
          dailyValue: 15.00,
          days: 22,
          value: 15.00 * 22
        }
      })
    }
  }

  // Criar alguns alertas de exemplo
  await prisma.alert.createMany({
    data: [
      {
        type: 'system',
        message: 'Sistema inicializado com sucesso'
      },
      {
        type: 'employee',
        message: 'Novos funcionários cadastrados'
      },
      {
        type: 'payroll',
        message: 'Holerites do mês gerados'
      }
    ]
  })

  console.log('Seed completed successfully!')
  console.log('Admin user created:', admin.username)
  console.log('Regular user created:', user.username)
  console.log('Employees created:', employees.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
