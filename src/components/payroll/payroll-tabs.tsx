'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayrollContent } from './payroll-content'
import { FolhaPagamentoContent } from './folha-pagamento-content'

export function PayrollTabs() {
  const [activeTab, setActiveTab] = useState('holerites')

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-6 h-12 bg-muted/50">
        <TabsTrigger 
          value="holerites" 
          className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 hover:bg-muted"
        >
          Holerites
        </TabsTrigger>
        <TabsTrigger 
          value="folha" 
          className="text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:scale-105 transition-all duration-200 hover:bg-muted"
        >
          Folha de Pagamento
        </TabsTrigger>
      </TabsList>
      
            <TabsContent value="holerites" className="space-y-6">
              <PayrollContent />
            </TabsContent>
      
      <TabsContent value="folha" className="space-y-6">
        <FolhaPagamentoContent />
      </TabsContent>
    </Tabs>
  )
}
