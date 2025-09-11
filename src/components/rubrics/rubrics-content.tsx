'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayrollRubricsManager } from '@/components/payroll/payroll-rubrics-manager'
import { EmployeeRubricsManager } from '@/components/payroll/employee-rubrics-manager'
import { Calculator, Users, Settings } from 'lucide-react'

export function RubricsContent() {
  const [activeTab, setActiveTab] = useState('global')

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Rubricas</h1>
        <p className="text-muted-foreground">
          Configure rubricas globais e aplique-as aos funcionários
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Rubricas Globais
          </TabsTrigger>
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Rubricas por Funcionário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Rubricas Globais
              </CardTitle>
              <CardDescription>
                Crie e gerencie os tipos de rubricas disponíveis no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PayrollRubricsManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rubricas por Funcionário
              </CardTitle>
              <CardDescription>
                Aplique rubricas específicas aos funcionários com valores e períodos personalizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeRubricsManager
                selectedMonth={new Date().getMonth() + 1}
                selectedYear={new Date().getFullYear()}
                onRubricsUpdated={() => {}}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
