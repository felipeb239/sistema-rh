'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Users,
  FileText,
  Receipt,
  Settings,
  UserCog,
  LogOut,
  Menu,
  X,
  Building2,
  Calculator,
  Phone,
  Lock
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'
import { useCompanySettings } from '@/hooks/use-company-settings'
import { usePermissions } from '@/hooks/use-permissions'
import { AccessDeniedModal } from '@/components/ui/access-denied-modal'

const navigation = [
  { name: 'Folha de Pagamento', href: '/payroll', icon: FileText, module: 'payroll' },
  { name: 'Funcionários', href: '/employees', icon: Users, module: 'employees' },
  { name: 'Rubricas', href: '/rubrics', icon: Calculator, module: 'rubrics' },
  { name: 'Recibos', href: '/receipts', icon: Receipt, module: 'receipts' },
  { name: 'Secretaria', href: '/secretaria', icon: Phone, module: 'secretaria' },
  { name: 'Configurações', href: '/settings', icon: Settings, module: 'settings' },
]

const adminNavigation = [
  { name: 'Usuários', href: '/users', icon: UserCog, module: 'users' },
]

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { data: companySettings } = useCompanySettings()
  const { canAccess, user } = usePermissions()
  const [accessDeniedModal, setAccessDeniedModal] = useState<{
    isOpen: boolean
    moduleName: string
  }>({ isOpen: false, moduleName: '' })

  const isAdmin = session?.user?.role === 'admin'

  const handleLogout = async () => {
    console.log('🔓 Iniciando logout...')
    console.log('🌐 window.location.origin:', window.location.origin)
    
    // Forçar o IP correto para logout com timestamp para evitar cache
    const timestamp = Date.now()
    const correctUrl = `http://192.168.10.31:3000/login?t=${timestamp}`
    console.log('🎯 URL de logout forçada:', correctUrl)
    
    // Usar apenas o NextAuth com redirect automático
    await signOut({ 
      callbackUrl: correctUrl
    })
  }

  const handleNavigationClick = (e: React.MouseEvent, item: any) => {
    e.preventDefault()
    
    if (canAccess.module(item.module)) {
      router.push(item.href)
      setIsOpen(false)
    } else {
      setAccessDeniedModal({
        isOpen: true,
        moduleName: item.name
      })
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-60 xl:w-64 2xl:w-72 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center min-h-20 h-auto px-4 py-4 border-b bg-gradient-to-b from-background to-muted/20">
            {companySettings && companySettings.logo ? (
              <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center space-y-3 w-full hover:opacity-80 transition-opacity cursor-pointer">
                <div className="flex-shrink-0 p-4 bg-white rounded-xl shadow-sm border w-full max-w-[200px]">
                  <img 
                    src={companySettings.logo} 
                    alt={companySettings.companyName || "Logo da empresa"} 
                    className="h-16 w-full sm:h-20 lg:h-24 object-contain"
                  />
                </div>
                <div className="flex flex-col items-center text-center w-full px-2">
                  <h1 className="text-[10px] sm:text-xs lg:text-sm font-semibold leading-tight text-foreground max-w-full break-words">
                    Folha de Pagamento
                  </h1>
                </div>
              </Link>
            ) : (
              <Link href="/" onClick={() => setIsOpen(false)} className="flex flex-col items-center space-y-3 w-full hover:opacity-80 transition-opacity cursor-pointer">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-full max-w-[200px] sm:h-20 lg:h-24 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl shadow-sm border">
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-primary" />
                </div>
                <div className="flex flex-col items-center text-center w-full px-2">
                  <h1 className="text-[10px] sm:text-xs lg:text-sm font-semibold leading-tight text-foreground max-w-full break-words">
                    {companySettings && companySettings.companyName || "Folha de Pagamento"}
                  </h1>
                  <p className="text-[9px] sm:text-[10px] lg:text-xs text-muted-foreground/80 font-medium mt-1">
                    Sistema
                  </p>
                </div>
              </Link>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const hasAccess = canAccess.module(item.module as any)
              
              return (
                <button
                  key={item.name}
                  onClick={(e) => handleNavigationClick(e, item)}
                  className={cn(
                    "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    hasAccess
                      ? isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      : "text-muted-foreground/50 cursor-not-allowed opacity-60"
                  )}
                >
                  <item.icon className="mr-3 h-4 w-4" />
                  {item.name}
                  {!hasAccess && <Lock className="ml-auto h-3 w-3" />}
                </button>
              )
            })}

            <div className="pt-4 border-t">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administração
              </p>
              <div className="mt-2 space-y-1">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href
                  const hasAccess = canAccess.module(item.module as any)
                  
                  return (
                    <button
                      key={item.name}
                      onClick={(e) => handleNavigationClick(e, item)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        hasAccess
                          ? isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          : "text-muted-foreground/50 cursor-not-allowed opacity-60"
                      )}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                      {!hasAccess && <Lock className="ml-auto h-3 w-3" />}
                    </button>
                  )
                })}
              </div>
            </div>
          </nav>

          {/* User info and logout */}
          <div className="p-4 border-t">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-primary-foreground">
                  {session?.user?.name?.charAt(0) || session?.user?.username?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name || session?.user?.username}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.level === 1 && 'Secretaria'}
                  {user?.level === 2 && 'Sistema Completo'}
                  {user?.level === 3 && 'Administrador'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Access Denied Modal */}
      <AccessDeniedModal
        isOpen={accessDeniedModal.isOpen}
        onClose={() => setAccessDeniedModal({ isOpen: false, moduleName: '' })}
        moduleName={accessDeniedModal.moduleName}
        userLevel={user?.level || 1}
      />
    </>
  )
}
