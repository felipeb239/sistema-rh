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
  const { canAccess, user } = usePermissions()
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean
    moduleName: string
  }>({ isOpen: false, moduleName: '' })

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
            <h1 className="text-3xl font-bold text-gray-900">Sistema de Folha de Pagamento</h1>
            <p className="text-gray-600 mt-2">
              Bem-vindo ao sistema. Selecione um módulo para começar.
            </p>
            
            {/* Informação sobre níveis de acesso */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-900 mb-1">
                    Sistema de Níveis de Acesso
                  </h3>
                  <p className="text-xs text-blue-700">
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
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-green-100 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-900">
                    {modules.filter(m => canAccess.module(m.module)).length} Módulos Acessíveis
                  </p>
                  <p className="text-xs text-green-700">
                    De {modules.length} disponíveis
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-amber-100 rounded-full">
                  <Shield className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Nível {user?.level || 1}
                  </p>
                  <p className="text-xs text-amber-700">
                    {user?.level === 1 && "Secretaria"}
                    {user?.level === 2 && "Sistema Completo"}
                    {user?.level === 3 && "Administrador"}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2">
                <div className="p-1 bg-blue-100 rounded-full">
                  <Settings className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {modules.filter(m => !canAccess.module(m.module)).length} Módulos Bloqueados
                  </p>
                  <p className="text-xs text-blue-700">
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
                        hasAccess ? 'bg-primary/10' : 'bg-gray-100'
                      }`}>
                        <module.icon className={`h-6 w-6 ${
                          hasAccess ? 'text-primary' : 'text-gray-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className={`text-lg ${
                          hasAccess ? 'text-gray-900' : 'text-gray-500'
                        }`}>
                          {module.name}
                        </CardTitle>
                        {!hasAccess && (
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            🔒 Sem acesso
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className={`text-sm ${
                      hasAccess ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {module.description}
                    </CardDescription>
                    {!hasAccess && (
                      <div className="mt-3 p-2 bg-amber-50 rounded-md border border-amber-200">
                        <p className="text-xs text-amber-700">
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
