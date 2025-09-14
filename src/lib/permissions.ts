export type Module = 'secretaria' | 'payroll' | 'employees' | 'receipts' | 'rubrics' | 'users' | 'settings'
export type Action = 'read' | 'write' | 'delete' | 'manage'

export const ACCESS_LEVELS = {
  SECRETARIA: 1,    // Apenas Secretaria
  SISTEMA: 2,       // Sistema completo exceto usuários
  ADMIN: 3          // Acesso total
} as const

export const MODULE_ACCESS = {
  [ACCESS_LEVELS.SECRETARIA]: ['secretaria'],
  [ACCESS_LEVELS.SISTEMA]: ['secretaria', 'payroll', 'employees', 'receipts', 'rubrics', 'settings'],
  [ACCESS_LEVELS.ADMIN]: ['secretaria', 'payroll', 'employees', 'receipts', 'rubrics', 'users', 'settings']
} as const

export function canAccessModule(userLevel: number, module: Module): boolean {
  const accessibleModules = MODULE_ACCESS[userLevel as keyof typeof MODULE_ACCESS] || []
  return accessibleModules.includes(module)
}

export function getAccessibleModules(userLevel: number): Module[] {
  return MODULE_ACCESS[userLevel as keyof typeof MODULE_ACCESS] || []
}

export function getUserLevelInfo(level: number) {
  switch (level) {
    case 1:
      return {
        name: 'Secretaria',
        description: 'Acesso apenas ao módulo de Secretaria',
        color: 'blue'
      }
    case 2:
      return {
        name: 'Sistema Completo',
        description: 'Acesso a todo o sistema exceto gerenciamento de usuários',
        color: 'green'
      }
    case 3:
      return {
        name: 'Administrador',
        description: 'Acesso total a todos os módulos do sistema',
        color: 'purple'
      }
    default:
      return {
        name: 'Desconhecido',
        description: 'Nível de acesso não reconhecido',
        color: 'gray'
      }
  }
}
