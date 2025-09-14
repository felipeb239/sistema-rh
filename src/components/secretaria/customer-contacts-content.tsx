'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Search, Phone, Mail, Edit, Trash2, Building, User } from 'lucide-react'

interface CustomerContact {
  id: string
  companyName: string
  contactName: string
  phones: string[]
  emails: string[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export function CustomerContactsContent() {
  const [contacts, setContacts] = useState<CustomerContact[]>([])
  const [filteredContacts, setFilteredContacts] = useState<CustomerContact[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<CustomerContact | null>(null)
  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phones: [''],
    emails: [''],
    notes: ''
  })

  // Buscar contatos
  const fetchContacts = async () => {
    try {
      const response = await fetch('/api/customer-contacts')
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
      contact.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phones.some(phone => phone.includes(searchTerm)) ||
      contact.emails.some(email => email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredContacts(filtered)
  }, [searchTerm, contacts])

  useEffect(() => {
    fetchContacts()
  }, [])

  // Adicionar telefone
  const addPhone = () => {
    setFormData({
      ...formData,
      phones: [...formData.phones, '']
    })
  }

  // Remover telefone
  const removePhone = (index: number) => {
    if (formData.phones.length > 1) {
      const newPhones = formData.phones.filter((_, i) => i !== index)
      setFormData({ ...formData, phones: newPhones })
    }
  }

  // Atualizar telefone
  const updatePhone = (index: number, value: string) => {
    const newPhones = [...formData.phones]
    newPhones[index] = value
    setFormData({ ...formData, phones: newPhones })
  }

  // Adicionar email
  const addEmail = () => {
    setFormData({
      ...formData,
      emails: [...formData.emails, '']
    })
  }

  // Remover email
  const removeEmail = (index: number) => {
    if (formData.emails.length > 1) {
      const newEmails = formData.emails.filter((_, i) => i !== index)
      setFormData({ ...formData, emails: newEmails })
    }
  }

  // Atualizar email
  const updateEmail = (index: number, value: string) => {
    const newEmails = [...formData.emails]
    newEmails[index] = value
    setFormData({ ...formData, emails: newEmails })
  }

  // Salvar contato
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filtrar campos vazios
    const phones = formData.phones.filter(phone => phone.trim() !== '')
    const emails = formData.emails.filter(email => email.trim() !== '')
    
    if (phones.length === 0 || emails.length === 0) {
      alert('Pelo menos um telefone e um email são obrigatórios')
      return
    }

    try {
      const url = editingContact ? `/api/customer-contacts/${editingContact.id}` : '/api/customer-contacts'
      const method = editingContact ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phones,
          emails
        }),
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
      const response = await fetch(`/api/customer-contacts/${id}`, {
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
  const handleEdit = (contact: CustomerContact) => {
    setEditingContact(contact)
    setFormData({
      companyName: contact.companyName,
      contactName: contact.contactName,
      phones: contact.phones.length > 0 ? contact.phones : [''],
      emails: contact.emails.length > 0 ? contact.emails : [''],
      notes: contact.notes || ''
    })
    setIsDialogOpen(true)
  }

  // Fechar dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setEditingContact(null)
    setFormData({
      companyName: '',
      contactName: '',
      phones: [''],
      emails: [''],
      notes: ''
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
          <h2 className="text-2xl font-bold text-gray-900">Contatos de Clientes</h2>
          <p className="text-gray-600">Gerencie os contatos de clientes e fornecedores</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCloseDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Contato
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Editar Contato' : 'Novo Contato'}
              </DialogTitle>
              <DialogDescription>
                {editingContact ? 'Atualize as informações do contato' : 'Adicione um novo contato de cliente'}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactName">Nome da Pessoa *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Telefones */}
              <div>
                <Label>Telefones *</Label>
                <div className="space-y-2">
                  {formData.phones.map((phone, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={phone}
                        onChange={(e) => updatePhone(index, e.target.value)}
                        placeholder="Telefone"
                        required={index === 0}
                      />
                      {formData.phones.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePhone(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPhone}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Telefone
                  </Button>
                </div>
              </div>

              {/* Emails */}
              <div>
                <Label>Emails *</Label>
                <div className="space-y-2">
                  {formData.emails.map((email, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmail(index, e.target.value)}
                        placeholder="Email"
                        required={index === 0}
                      />
                      {formData.emails.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeEmail(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addEmail}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Email
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows={3}
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
          placeholder="Buscar por empresa, pessoa, telefone ou email..."
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
                  <div className="p-2 bg-green-100 rounded-full">
                    <Building className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{contact.companyName}</CardTitle>
                    <CardDescription>{contact.contactName}</CardDescription>
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
              <div className="space-y-3">
                {/* Telefones */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Telefones</span>
                  </div>
                  <div className="space-y-1">
                    {contact.phones.map((phone, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {phone}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emails */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium">Emails</span>
                  </div>
                  <div className="space-y-1">
                    {contact.emails.map((email, index) => (
                      <div key={index} className="text-sm text-gray-600">
                        {email}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Observações */}
                {contact.notes && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Observações:</span>
                    <p className="text-sm text-gray-600 mt-1">{contact.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContacts.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
