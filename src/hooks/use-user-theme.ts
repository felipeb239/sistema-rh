'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTheme as useNextTheme } from 'next-themes'

type Theme = 'light' | 'dark' | 'system'

export function useUserTheme() {
  const { data: session } = useSession()
  const { theme: nextTheme, setTheme: setNextTheme } = useNextTheme()
  const [userTheme, setUserTheme] = useState<Theme>('system')
  const [isLoading, setIsLoading] = useState(true)

  // Carregar tema do usuário do banco de dados
  useEffect(() => {
    const loadUserTheme = async () => {
      if (!session?.user?.id) {
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/user/theme')
        if (response.ok) {
          const data = await response.json()
          setUserTheme(data.theme)
          
          // Aplicar o tema do usuário
          if (data.theme !== 'system') {
            setNextTheme(data.theme)
          }
        }
      } catch (error) {
        console.error('Erro ao carregar tema do usuário:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserTheme()
  }, [session?.user?.id, setNextTheme])

  // Salvar tema do usuário no banco de dados
  const setTheme = async (theme: Theme) => {
    setUserTheme(theme)
    setNextTheme(theme)

    if (!session?.user?.id) return

    try {
      const response = await fetch('/api/user/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ theme }),
      })

      if (!response.ok) {
        console.error('Erro ao salvar tema do usuário')
      }
    } catch (error) {
      console.error('Erro ao salvar tema do usuário:', error)
    }
  }

  return {
    theme: userTheme,
    setTheme,
    isLoading,
    actualTheme: nextTheme // Tema atual aplicado (considerando system)
  }
}
