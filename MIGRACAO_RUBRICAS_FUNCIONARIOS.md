# MIGRAÇÃO: Sistema de Rubricas Específicas por Funcionário

## 📋 RESUMO DAS ALTERAÇÕES
Este documento contém todas as alterações implementadas para criar um sistema de rubricas específicas por funcionário, incluindo criação de rubricas personalizadas e integração com PDFs de holerite.

## 🗄️ 1. ALTERAÇÕES NO BANCO DE DADOS

### Schema Prisma (prisma/schema.prisma)
```prisma
// Adicionar ao modelo PayrollRubric
model PayrollRubric {
  // ... campos existentes ...
  employeeRubrics EmployeeRubric[] // Adicionar esta linha
}

// Adicionar novo modelo EmployeeRubric
model EmployeeRubric {
  id              String        @id @default(cuid())
  employeeId      String        @map("employee_id")
  rubricId        String        @map("rubric_id")
  customName      String?       @map("custom_name")
  customValue     Decimal?      @map("custom_value") @db.Decimal(10, 2)
  customPercentage Decimal?     @map("custom_percentage") @db.Decimal(5, 4)
  isActive        Boolean       @default(true) @map("is_active")
  startDate       DateTime?     @map("start_date")
  endDate         DateTime?     @map("end_date")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")
  employee        Employee      @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  rubric          PayrollRubric @relation(fields: [rubricId], references: [id], onDelete: Cascade)

  @@unique([employeeId, rubricId], name: "employee_rubric_unique")
  @@map("employee_rubrics")
}

// Adicionar ao modelo Employee
model Employee {
  // ... campos existentes ...
  employeeRubrics EmployeeRubric[] // Adicionar esta linha
}
```

### Comandos para aplicar no banco:
```bash
npx prisma db push
npx prisma generate
```

## 🔧 2. TIPOS TYPESCRIPT

### src/types/index.ts
```typescript
// Adicionar interfaces
export interface PayrollRubric {
  id: string
  name: string
  description?: string
  type: 'discount' | 'benefit'
  code?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  employeeRubrics?: EmployeeRubric[] // Adicionar
}

export interface EmployeeRubric {
  id: string
  employeeId: string
  employee?: Employee
  rubricId: string
  rubric?: PayrollRubric
  customName?: string
  customValue?: number
  customPercentage?: number
  isActive: boolean
  startDate?: Date
  endDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface EmployeeWithRubrics extends Employee {
  employeeRubrics: (EmployeeRubric & { rubric: PayrollRubric })[]
}
```

## 🌐 3. APIs CRIADAS

### src/app/api/employees/[id]/rubrics/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Buscar rubricas de um colaborador específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id

    // Buscar colaborador com suas rubricas
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        employeeRubrics: {
          include: {
            rubric: true
          },
          where: {
            isActive: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Buscar todas as rubricas globais disponíveis
    const availableRubrics = await prisma.payrollRubric.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Filtrar rubricas que ainda não foram aplicadas ao colaborador
    const appliedRubricIds = employee.employeeRubrics.map(er => er.rubricId)
    const unappliedRubrics = availableRubrics.filter(rubric => 
      !appliedRubricIds.includes(rubric.id)
    )

    return NextResponse.json({
      employee: {
        id: employee.id,
        name: employee.name,
        position: employee.position,
        department: employee.department
      },
      appliedRubrics: employee.employeeRubrics,
      availableRubrics: unappliedRubrics
    })

  } catch (error) {
    console.error('Erro ao buscar rubricas do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// POST - Adicionar rubrica a um colaborador
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const employeeId = params.id
    const body = await request.json()
    const { 
      rubricId, 
      customName, 
      customValue, 
      customPercentage, 
      startDate, 
      endDate 
    } = body

    // Validar dados
    if (!rubricId) {
      return NextResponse.json({ error: 'ID da rubrica é obrigatório' }, { status: 400 })
    }

    if (!customValue && !customPercentage) {
      return NextResponse.json({ 
        error: 'Valor fixo ou percentual é obrigatório' 
      }, { status: 400 })
    }

    // Verificar se o colaborador existe
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    })

    if (!employee) {
      return NextResponse.json({ error: 'Colaborador não encontrado' }, { status: 404 })
    }

    // Verificar se a rubrica existe
    const rubric = await prisma.payrollRubric.findUnique({
      where: { id: rubricId }
    })

    if (!rubric) {
      return NextResponse.json({ error: 'Rubrica não encontrada' }, { status: 404 })
    }

    // Verificar se já existe uma rubrica aplicada para este colaborador
    const existingRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (existingRubric) {
      return NextResponse.json({ 
        error: 'Esta rubrica já foi aplicada a este colaborador' 
      }, { status: 400 })
    }

    // Criar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.create({
      data: {
        employeeId,
        rubricId,
        customName,
        customValue: customValue ? parseFloat(customValue) : null,
        customPercentage: customPercentage ? parseFloat(customPercentage) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null
      },
      include: {
        rubric: true
      }
    })

    return NextResponse.json({
      success: true,
      data: employeeRubric
    })

  } catch (error) {
    console.error('Erro ao adicionar rubrica ao colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

### src/app/api/employees/[id]/rubrics/[rubricId]/route.ts
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PUT - Atualizar rubrica de um colaborador
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; rubricId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: employeeId, rubricId } = params
    const body = await request.json()
    const { 
      customName, 
      customValue, 
      customPercentage, 
      startDate, 
      endDate,
      isActive 
    } = body

    // Validar dados
    if (!customValue && !customPercentage) {
      return NextResponse.json({ 
        error: 'Valor fixo ou percentual é obrigatório' 
      }, { status: 400 })
    }

    // Buscar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (!employeeRubric) {
      return NextResponse.json({ 
        error: 'Rubrica não encontrada para este colaborador' 
      }, { status: 404 })
    }

    // Atualizar rubrica
    const updatedRubric = await prisma.employeeRubric.update({
      where: { id: employeeRubric.id },
      data: {
        customName,
        customValue: customValue ? parseFloat(customValue) : null,
        customPercentage: customPercentage ? parseFloat(customPercentage) : null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== undefined ? isActive : employeeRubric.isActive
      },
      include: {
        rubric: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedRubric
    })

  } catch (error) {
    console.error('Erro ao atualizar rubrica do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// DELETE - Remover rubrica de um colaborador
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; rubricId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: employeeId, rubricId } = params

    // Buscar rubrica do colaborador
    const employeeRubric = await prisma.employeeRubric.findUnique({
      where: {
        employee_rubric_unique: {
          employeeId,
          rubricId
        }
      }
    })

    if (!employeeRubric) {
      return NextResponse.json({ 
        error: 'Rubrica não encontrada para este colaborador' 
      }, { status: 404 })
    }

    // Remover rubrica
    await prisma.employeeRubric.delete({
      where: { id: employeeRubric.id }
    })

    return NextResponse.json({
      success: true,
      message: 'Rubrica removida com sucesso'
    })

  } catch (error) {
    console.error('Erro ao remover rubrica do colaborador:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

## 🎨 4. COMPONENTES UI CRIADOS

### src/components/ui/badge.tsx
```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
```

## 📝 5. FUNÇÕES UTILITÁRIAS

### src/lib/employee-rubrics.ts
```typescript
import { EmployeeRubric } from '@/types'

export interface RubricCalculation {
  name: string
  value: number
  type: 'fixed' | 'percentage'
  isBenefit: boolean
}

export function calculateEmployeeRubrics(
  employeeRubrics: EmployeeRubric[],
  baseSalary: number,
  month?: number,
  year?: number
): RubricCalculation[] {
  const now = new Date()
  const currentMonth = month || now.getMonth() + 1
  const currentYear = year || now.getFullYear()

  return employeeRubrics
    .filter(employeeRubric => {
      if (!employeeRubric.isActive) return false
      
      // Verificar se está dentro do período de vigência
      if (employeeRubric.startDate) {
        const startDate = new Date(employeeRubric.startDate)
        if (startDate.getMonth() + 1 > currentMonth || startDate.getFullYear() > currentYear) {
          return false
        }
      }
      
      if (employeeRubric.endDate) {
        const endDate = new Date(employeeRubric.endDate)
        if (endDate.getMonth() + 1 < currentMonth || endDate.getFullYear() < currentYear) {
          return false
        }
      }
      
      return true
    })
    .map(employeeRubric => {
      let value = 0
      let type: 'fixed' | 'percentage' = 'fixed'
      
      if (employeeRubric.customValue) {
        value = Number(employeeRubric.customValue) || 0
        type = 'fixed'
      } else if (employeeRubric.customPercentage) {
        value = baseSalary * (Number(employeeRubric.customPercentage) || 0)
        type = 'percentage'
      }

      return {
        name: employeeRubric.customName || employeeRubric.rubric?.name || 'Rubrica',
        value,
        type,
        isBenefit: employeeRubric.rubric?.type === 'benefit'
      }
    })
}

export function getRubricTotals(rubrics: RubricCalculation[]) {
  const benefits = rubrics.filter(r => r.isBenefit)
  const discounts = rubrics.filter(r => !r.isBenefit)
  
  return {
    totalBenefits: benefits.reduce((sum, r) => sum + r.value, 0),
    totalDiscounts: discounts.reduce((sum, r) => sum + r.value, 0),
    benefits,
    discounts
  }
}
```

## 🔄 6. COMPONENTES PRINCIPAIS

### src/components/employees/employee-rubrics-dialog.tsx
[Arquivo completo - muito extenso, criar baseado no padrão existente]

### src/components/payroll/employee-rubrics-display.tsx
[Arquivo completo - muito extenso, criar baseado no padrão existente]

## 📊 7. ALTERAÇÕES NO PDF

### src/app/api/export/individual-payroll/route.ts
[Modificações específicas para incluir rubricas no PDF - ver arquivo original]

## ⚠️ 8. CORREÇÕES IMPORTANTES

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remover experimental: { appDir: true } - obsoleto no Next.js 14
}

module.exports = nextConfig
```

## 🚀 9. COMANDOS DE APLICAÇÃO

```bash
# 1. Aplicar mudanças no banco
npx prisma db push

# 2. Gerar tipos
npx prisma generate

# 3. Reiniciar servidor
npm run dev
```

## ✅ 10. FUNCIONALIDADES IMPLEMENTADAS

- ✅ Sistema de rubricas específicas por funcionário
- ✅ Criação de rubricas personalizadas
- ✅ Aplicação de rubricas com valores fixos ou percentuais
- ✅ Controle de datas de vigência
- ✅ Integração com cálculo de holerite
- ✅ Inclusão no PDF exportado
- ✅ Interface de gerenciamento completa
- ✅ Validações e tratamento de erros
- ✅ Persistência no banco de dados

## 📋 11. ARQUIVOS CRIADOS/MODIFICADOS

### Novos arquivos:
- src/app/api/employees/[id]/rubrics/route.ts
- src/app/api/employees/[id]/rubrics/[rubricId]/route.ts
- src/components/employees/employee-rubrics-dialog.tsx
- src/components/payroll/employee-rubrics-display.tsx
- src/components/ui/badge.tsx
- src/lib/employee-rubrics.ts

### Arquivos modificados:
- prisma/schema.prisma
- src/types/index.ts
- src/components/employees/employees-content.tsx
- src/components/payroll/payroll-form.tsx
- src/components/payroll/payroll-content.tsx
- src/app/api/export/individual-payroll/route.ts
- next.config.js

## 🎯 12. TESTE FINAL

Após aplicar todas as alterações:
1. Acesse a página de funcionários
2. Clique no ícone de engrenagem ao lado de um funcionário
3. Teste criar uma nova rubrica
4. Teste aplicar rubricas existentes
5. Crie um holerite e verifique se as rubricas aparecem
6. Exporte o PDF e confirme a inclusão das rubricas

---

**IMPORTANTE**: Faça backup do projeto original antes de aplicar estas alterações!
