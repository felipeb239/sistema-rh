'use client'

import { useState, useEffect } from 'react'

export interface User {
  id: string
  username: string
  name: string
  email?: string
  role: 'admin' | 'user'
  level: number
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar usuários
  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
        setError(null)
      } else {
        setError('Erro ao carregar usuários')
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      setError('Erro ao carregar usuários')
    } finally {
      setIsLoading(false)
    }
  }

  // Criar usuário
  const createUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await fetchUsers()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  // Atualizar usuário
  const updateUser = async (id: string, userData: Partial<User>) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      })

      if (response.ok) {
        await fetchUsers()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  // Excluir usuário
  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchUsers()
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.error }
      }
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      return { success: false, error: 'Erro interno do servidor' }
    }
  }

  // Alternar status do usuário
  const toggleUserStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    return await updateUser(id, { status: newStatus })
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return {
    users,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus
  }
}
