'use client'

import { useSession } from 'next-auth/react'
import { Module, canAccessModule, getAccessibleModules, getUserLevelInfo } from '@/lib/permissions'

export function usePermissions() {
  const { data: session, status } = useSession()
  
  // Verificação de segurança para evitar erros durante o carregamento
  if (status === 'loading') {
    return {
      user: null,
      userLevel: 1,
      isLoading: true,
      canAccess: {
        module: () => false,
        action: () => false
      },
      accessibleModules: [],
      levelInfo: { name: 'Carregando...', description: '', color: 'gray' },
      isAdmin: false,
      isSystemUser: false,
      isSecretariaOnly: true,
      isAuthenticated: false
    }
  }

  const user = session?.user
  const userLevel = user?.level || 1
  const isLoading = status === 'loading'

  const canAccess = {
    module: (module: Module) => canAccessModule(userLevel, module),
    action: (module: Module, action: string) => {
      // Por enquanto, se tem acesso ao módulo, tem acesso a todas as ações
      return canAccessModule(userLevel, module)
    }
  }

  const accessibleModules = getAccessibleModules(userLevel)
  const levelInfo = getUserLevelInfo(userLevel)
  const isAdmin = userLevel === 3
  const isSystemUser = userLevel >= 2
  const isSecretariaOnly = userLevel === 1

  return {
    user,
    userLevel,
    isLoading,
    canAccess,
    accessibleModules,
    levelInfo,
    isAdmin,
    isSystemUser,
    isSecretariaOnly,
    isAuthenticated: !!user
  }
}
