'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useUserTheme } from '@/hooks/use-user-theme'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme, isLoading } = useUserTheme()

  if (isLoading) {
    return (
      <Button variant="outline" size="icon" disabled>
        <div className="h-[1.2rem] w-[1.2rem] animate-spin rounded-full border-2 border-current border-t-transparent" />
        <span className="sr-only">Carregando tema</span>
      </Button>
    )
  }

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case 'dark':
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      case 'system':
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  const getTooltip = () => {
    switch (theme) {
      case 'light':
        return 'Tema claro - Clique para alternar'
      case 'dark':
        return 'Tema escuro - Clique para alternar'
      case 'system':
        return 'Tema do sistema - Clique para alternar'
      default:
        return 'Alternar tema'
    }
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={cycleTheme}
      title={getTooltip()}
    >
      {getIcon()}
      <span className="sr-only">{getTooltip()}</span>
    </Button>
  )
}