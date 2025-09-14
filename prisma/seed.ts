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
      level: 3, // NOVO - Nível 3: Administrador
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
      level: 2, // NOVO - Nível 2: Sistema Completo
      status: 'active'
    }
  })

  // Criar usuário secretaria
  const secretaria = await prisma.user.upsert({
    where: { username: 'secretaria' },
    update: {},
    create: {
      username: 'secretaria',
      password: hashedPassword,
      name: 'Secretária',
      email: 'secretaria@empresa.com',
      role: 'user',
      level: 1, // NOVO - Nível 1: Secretaria
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
  await prisma.payrollRubric.createMany({
    data: [
      {
        name: 'INSS',
        description: 'Desconto do INSS',
        type: 'discount',
        code: '2801'
      },
      {
        name: 'IRRF',
        description: 'Desconto do Imposto de Renda',
        type: 'discount',
        code: '2804'
      },
      {
        name: 'Plano de Saúde',
        description: 'Desconto do plano de saúde',
        type: 'discount',
        code: '3405'
      },
      {
        name: 'Plano Odontológico',
        description: 'Desconto do plano odontológico',
        type: 'discount',
        code: '3407'
      },
      {
        name: 'Outros Descontos',
        description: 'Outros descontos diversos',
        type: 'discount',
        code: '3406'
      }
    ],
    skipDuplicates: true
  })

  // Criar alguns funcionários de exemplo
  const employees = await prisma.employee.createMany({
    data: [
      {
        name: 'João Silva',
        cpf: '12345678901',
        position: 'Desenvolvedor',
        department: 'TI',
        hireDate: new Date('2023-01-15'),
        salary: 5000.00
      },
      {
        name: 'Maria Santos',
        cpf: '98765432100',
        position: 'Analista',
        department: 'RH',
        hireDate: new Date('2023-03-20'),
        salary: 4500.00
      },
      {
        name: 'Pedro Costa',
        cpf: '11122233344',
        position: 'Gerente',
        department: 'Vendas',
        hireDate: new Date('2022-11-10'),
        salary: 8000.00
      }
    ],
    skipDuplicates: true
  })

  // Buscar os funcionários criados para usar nos holerites
  const createdEmployees = await prisma.employee.findMany({
    where: {
      cpf: {
        in: ['12345678901', '98765432100', '11122233344']
      }
    }
  })

  // Criar alguns holerites de exemplo
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth() + 1
  const currentYear = currentDate.getFullYear()

  for (const employee of createdEmployees) {
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
  for (const employee of createdEmployees) {
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
  console.log('Admin user created:', admin.username, '(Level 3)')
  console.log('Regular user created:', user.username, '(Level 2)')
  console.log('Secretaria user created:', secretaria.username, '(Level 1)')
  console.log('Employees created:', createdEmployees.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
