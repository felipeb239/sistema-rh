import { useQuery } from '@tanstack/react-query'
import { CompanySettings } from '@/types'

async function fetchCompanySettings(): Promise<CompanySettings | null> {
  try {
    const response = await fetch('/api/company-settings')
    if (!response.ok) {
      return null
    }
    return response.json()
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return null
  }
}

export function useCompanySettings() {
  return useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  })
}
