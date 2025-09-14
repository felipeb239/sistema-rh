'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Shield, Lock, ArrowLeft, UserCog } from 'lucide-react'
import { getUserLevelInfo } from '@/lib/permissions'

interface AccessDeniedModalProps {
  isOpen: boolean
  onClose: () => void
  moduleName: string
  userLevel: number
}

export function AccessDeniedModal({ isOpen, onClose, moduleName, userLevel }: AccessDeniedModalProps) {
  const levelInfo = getUserLevelInfo(userLevel)

  const getModuleDescription = (module: string) => {
    const descriptions: Record<string, string> = {
      'Folha de Pagamento': 'Gerencie os holerites dos funcionários',
      'Funcionários': 'Cadastro e gestão de funcionários',
      'Rubricas': 'Configure as rubricas de pagamento',
      'Recibos': 'Gerencie os recibos de pagamento',
      'Secretaria': 'Lista telefônica e contatos de clientes',
      'Configurações': 'Configurações do sistema',
      'Usuários': 'Gerenciamento de usuários do sistema'
    }
    return descriptions[module] || 'Módulo do sistema'
  }

  const getRequiredLevel = (module: string) => {
    if (module === 'Usuários') return 3
    if (module === 'Secretaria') return 1
    return 2
  }

  const requiredLevel = getRequiredLevel(moduleName)
  const requiredLevelInfo = getUserLevelInfo(requiredLevel)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-full">
              <Lock className="h-6 w-6 text-red-600" />
            </div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              Acesso Negado
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600">
            Você não tem permissão para acessar este módulo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações sobre o módulo solicitado */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Módulo Solicitado</h3>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-800">{moduleName}</span>
            </div>
            <p className="text-sm text-gray-600">
              {getModuleDescription(moduleName)}
            </p>
          </div>

          {/* Nível de acesso atual */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Seu Nível de Acesso</h3>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded-full ${
                levelInfo.color === 'blue' ? 'bg-blue-100' :
                levelInfo.color === 'green' ? 'bg-green-100' :
                levelInfo.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <UserCog className={`h-4 w-4 ${
                  levelInfo.color === 'blue' ? 'text-blue-600' :
                  levelInfo.color === 'green' ? 'text-green-600' :
                  levelInfo.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <span className="font-medium text-gray-800">
                Nível {userLevel} - {levelInfo.name}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {levelInfo.description}
            </p>
          </div>

          {/* Nível necessário */}
          <div className="p-4 bg-amber-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Nível Necessário</h3>
            <div className="flex items-center gap-2 mb-1">
              <div className={`p-1 rounded-full ${
                requiredLevelInfo.color === 'blue' ? 'bg-blue-100' :
                requiredLevelInfo.color === 'green' ? 'bg-green-100' :
                requiredLevelInfo.color === 'purple' ? 'bg-purple-100' : 'bg-gray-100'
              }`}>
                <Shield className={`h-4 w-4 ${
                  requiredLevelInfo.color === 'blue' ? 'text-blue-600' :
                  requiredLevelInfo.color === 'green' ? 'text-green-600' :
                  requiredLevelInfo.color === 'purple' ? 'text-purple-600' : 'text-gray-600'
                }`} />
              </div>
              <span className="font-medium text-gray-800">
                Nível {requiredLevel} - {requiredLevelInfo.name}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              {requiredLevelInfo.description}
            </p>
          </div>

          {/* Módulos disponíveis para o usuário */}
          <div className="p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Módulos Disponíveis</h3>
            <p className="text-sm text-gray-600 mb-2">
              Com seu nível atual, você pode acessar:
            </p>
            <div className="space-y-1">
              {userLevel === 1 && (
                <div className="text-sm text-gray-700">• Secretaria</div>
              )}
              {userLevel === 2 && (
                <>
                  <div className="text-sm text-gray-700">• Secretaria</div>
                  <div className="text-sm text-gray-700">• Folha de Pagamento</div>
                  <div className="text-sm text-gray-700">• Funcionários</div>
                  <div className="text-sm text-gray-700">• Rubricas</div>
                  <div className="text-sm text-gray-700">• Recibos</div>
                  <div className="text-sm text-gray-700">• Configurações</div>
                </>
              )}
              {userLevel === 3 && (
                <div className="text-sm text-gray-700">• Todos os módulos</div>
              )}
            </div>
          </div>

          {/* Como obter acesso */}
          <div className="p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Como Obter Acesso</h3>
            <p className="text-sm text-gray-600">
              Entre em contato com o administrador do sistema para solicitar 
              acesso a este módulo ou para atualizar seu nível de permissão.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
