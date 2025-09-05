'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserCog } from 'lucide-react'

export function UsersContent() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie os usuários do sistema
        </p>
      </div>

      {/* Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidade em Desenvolvimento</CardTitle>
          <CardDescription>
            Esta página será implementada em breve
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <UserCog className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground mt-2">
              Em breve você poderá gerenciar usuários aqui
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
