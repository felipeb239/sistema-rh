'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Phone, Edit, Trash2, User } from 'lucide-react'

interface PhoneContact {
  id: string
  name: string
  phone: string
  department?: string
  position?: string
  createdAt: string
  updatedAt: string
}

export function PhoneDirectoryContent() {
  const [contacts, setContacts] = useState<PhoneContact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<PhoneContact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<PhoneContact | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    department: '',
    position: ''
  })

  // Buscar contatos
  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/phone-directory')
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
        setFilteredContacts(data)
      }
    } catch (error) {
      console.error('Erro ao buscar contatos:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar contatos
  useEffect(() => {
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone.includes(searchTerm) ||
      contact.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredContacts(filtered)
  }, [searchTerm, contacts])

  useEffect(() => {
    fetchContacts()
  }, [])

  // Salvar contato
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingContact ? `/api/phone-directory/${editingContact.id}` : '/api/phone-directory'
      const method = editingContact ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchContacts()
        handleCloseDialog()
      }
    } catch (error) {
      console.error('Erro ao salvar contato:', error)
    }
  }

  // Excluir contato
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) return

    try {
      const response = await fetch(`/api/phone-directory/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchContacts()
      }
    } catch (error) {
      console.error('Erro ao excluir contato:', error)
    }
  }

  // Abrir dialog para edição
  const handleEdit = (contact: PhoneContact) => {
    setEditingContact(contact)
    setFormData({
      name: contact.name,
      phone: contact.phone,
      department: contact.department || '',
      position: contact.position || ''
    })
    setIsDialogOpen(true)
  }

  // Fechar dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingContact(null)
    setFormData({
      name: '',
      phone: '',
      department: '',
      position: ''
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando contatos...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lista Telefônica</h2>
          <p className="text-gray-600">Gerencie os contatos telefônicos internos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Editar Contato' : 'Novo Contato'}
              </DialogTitle>
              <DialogDescription>
                {editingContact ? 'Atualize as informações do contato' : 'Adicione um novo contato à lista telefônica'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="department">Departamento</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="position">Cargo</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingContact ? 'Atualizar' : 'Salvar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar por nome, telefone, departamento ou cargo..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Lista de contatos */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContacts.map((contact) => (
          <Card key={contact.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{contact.name}</CardTitle>
                    {contact.position && (
                      <CardDescription>{contact.position}</CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(contact)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(contact.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{contact.phone}</span>
                </div>
                {contact.department && (
                  <div className="text-sm text-gray-600">
                    <strong>Departamento:</strong> {contact.department}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
          </h3>
          <p className="text-gray-600">
            {searchTerm 
              ? 'Tente ajustar os termos de busca'
              : 'Comece adicionando um novo contato'
            }
          </p>
        </div>
      )}
    </div>
  )
}
