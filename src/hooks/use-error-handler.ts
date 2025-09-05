import { useCallback } from 'react'
import { toast } from 'sonner'

export function useErrorHandler() {
  const handleError = useCallback((error: unknown, fallbackMessage?: string) => {
    let message = fallbackMessage || 'Ocorreu um erro inesperado'
    
    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'string') {
      message = error
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message)
    }
    
    // Log do erro para debugging
    console.error('Error handled:', error)
    
    // Mostrar toast de erro
    toast.error(message)
    
    return message
  }, [])
  
  const handleSuccess = useCallback((message: string) => {
    toast.success(message)
  }, [])
  
  const handleInfo = useCallback((message: string) => {
    toast.info(message)
  }, [])
  
  const handleWarning = useCallback((message: string) => {
    toast.warning(message)
  }, [])
  
  return {
    handleError,
    handleSuccess,
    handleInfo,
    handleWarning,
  }
}
