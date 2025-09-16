'use client'

import { Header } from '@/components/layout/header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Calculator, Receipt, Phone, Settings, UserCog, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { usePermissions } from '@/hooks/use-permissions'
import { useState } from 'react'
import { AccessDeniedModal } from '@/components/ui/access-denied-modal'

export default function HomePage() {
  const router = useRouter()
  const { canAccess, user, isLoading } = usePermissions()
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean
    moduleName: string
  }>({ isOpen: false, moduleName: '' })

  // Mostrar loading enquanto a sessão está carregando
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    )
  }

  const modules = [
    { name: 'Folha de Pagamento', description: 'Gerencie os holerites dos funcionários', icon: FileText, href: '/payroll', module: 'payroll' },
    { name: 'Funcionários', description: 'Cadastro e gestão de funcionários', icon: Users, href: '/employees', module: 'employees' },
    { name: 'Rubricas', description: 'Configure as rubricas de pagamento', icon: Calculator, href: '/rubrics', module: 'rubrics' },
    { name: 'Recibos', description: 'Gerencie os recibos de pagamento', icon: Receipt, href: '/receipts', module: 'receipts' },
    { name: 'Secretaria', description: 'Lista telefônica e contatos de clientes', icon: Phone, href: '/secretaria', module: 'secretaria' },
    { name: 'Configurações', description: 'Configurações do sistema', icon: Settings, href: '/settings', module: 'settings' },
    { name: 'Usuários', description: 'Gerenciamento de usuários do sistema', icon: UserCog, href: '/users', module: 'users' },
  ]

  const handleModuleClick = (module: any) => {
    if (canAccess.module(module.module)) {
      router.push(module.href)
    } else {
      setAccessDeniedModal({
        isOpen: true,
        moduleName: module.name
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          {/* Título e informações */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Sistema de Folha de Pagamento</h1>
            <p className="text-muted-foreground mt-2">
              Bem-vindo ao sistema. Selecione um módulo para começar.
            </p>
            
            {/* Informação sobre níveis de acesso */}
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Sistema de Níveis de Acesso
                  </h3>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {user?.level === 1 && "Você tem acesso ao módulo de Secretaria. Os demais módulos estão bloqueados."}
                    {user?.level === 2 && "Você tem acesso a todo o sistema exceto gerenciamento de usuários."}
                    {user?.level === 3 && "Você tem acesso total a todos os módulos do sistema."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Estatísticas de acesso */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 dark:bg-green-800 rounded-full">
                  <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    {modules.filter(m => canAccess.module(m.module)).length} Módulos Acessíveis
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300">
                    De {modules.length} disponíveis
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-100 dark:bg-amber-800 rounded-full">
                  <Shield className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Nível {user?.level || 1}
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {user?.level === 1 && "Secretaria"}
                    {user?.level === 2 && "Sistema Completo"}
                    {user?.level === 3 && "Administrador"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 dark:bg-blue-800 rounded-full">
                  <Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    {modules.filter(m => !canAccess.module(m.module)).length} Módulos Bloqueados
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Solicite acesso ao admin
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de módulos */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((module) => {
              const hasAccess = canAccess.module(module.module)
              
              return (
                <Card 
                  key={module.name} 
                  className={`transition-all duration-200 ${
                    hasAccess 
                      ? 'hover:shadow-md hover:scale-105 border-gray-200 cursor-pointer' 
                      : 'opacity-60 cursor-not-allowed border-gray-100'
                  }`}
                  onClick={() => handleModuleClick(module)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        hasAccess ? 'bg-primary/10 dark:bg-primary/20' : 'bg-gray-100 dark:bg-gray-800'
                      }`}>
                        <module.icon className={`h-6 w-6 ${
                          hasAccess ? 'text-primary dark:text-primary-foreground' : 'text-gray-400 dark:text-gray-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className={`text-lg ${
                          hasAccess ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {module.name}
                        </CardTitle>
                        {!hasAccess && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            🔒 Sem acesso
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className={`text-sm ${
                      hasAccess ? 'text-muted-foreground' : 'text-muted-foreground/60'
                    }`}>
                      {module.description}
                    </CardDescription>
                    {!hasAccess && (
                      <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-800">
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          💡 Entre em contato com o administrador para solicitar acesso a este módulo.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </main>

      {/* Access Denied Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedModal.isOpen}
        onClose={() => setAccessDeniedModal({ isOpen: false, moduleName: '' })}
        moduleName={accessDeniedModal.moduleName}
        userLevel={user?.level || 1}
      />
    </div>
  )
}
