'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, Building, Upload, X, Image } from 'lucide-react'
import { CompanySettings } from '@/types'

async function fetchCompanySettings() {
  const response = await fetch('/api/company-settings')
  if (!response.ok) {
    throw new Error('Failed to fetch company settings')
  }
  return response.json()
}

async function updateCompanySettings(data: Partial<CompanySettings>) {
  const response = await fetch('/api/company-settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    throw new Error('Failed to update company settings')
  }
  return response.json()
}

export function SettingsContent() {
  const [formData, setFormData] = useState({
    companyName: '',
    cnpj: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
    website: ''
  })

  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const queryClient = useQueryClient()

  const { data: settings, isLoading } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
  })

  const updateMutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-settings'] })
      // Limpar o arquivo do logo após salvar com sucesso
      setLogoFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  })

  useEffect(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || '',
        cnpj: settings.cnpj || '',
        address: settings.address || '',
        city: settings.city || '',
        state: settings.state || '',
        zipCode: settings.zipCode || '',
        phone: settings.phone || '',
        email: settings.email || '',
        website: settings.website || ''
      })
      setLogo(settings.logo || null)
    }
  }, [settings])

  const handleFileSelect = (file: File) => {
    if (file.size > 2 * 1024 * 1024) { // 2MB
      alert('Arquivo muito grande. Máximo 2MB.')
      return
    }
    
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione apenas arquivos de imagem.')
      return
    }

    setLogoFile(file)
    
    // Preview da imagem
    const reader = new FileReader()
    reader.onload = (e) => {
      setLogo(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemoveLogo = () => {
    setLogo(null)
    setLogoFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    let logoUrl = logo
    
    // Se há um arquivo de logo para upload, fazer o upload primeiro
    if (logoFile) {
      try {
        const uploadFormData = new FormData()
        uploadFormData.append('file', logoFile)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: uploadFormData,
        })
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json()
          logoUrl = uploadResult.url
        } else {
          alert('Erro ao fazer upload do logo')
          return
        }
      } catch (error) {
        console.error('Upload error:', error)
        alert('Erro ao fazer upload do logo')
        return
      }
    }
    
    // Salvar configurações incluindo o logo
    updateMutation.mutate({
      ...formData,
      logo: logoUrl || undefined
    })
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const isLoadingForm = updateMutation.isPending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações da empresa
        </p>
      </div>

      {/* Company Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="h-5 w-5" />
            <span>Dados da Empresa</span>
          </CardTitle>
          <CardDescription>
            Configure as informações básicas da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    required
                    placeholder="Digite o nome da empresa"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => handleChange('cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Endereço</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Digite a cidade"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="SP"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">CEP</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleChange('zipCode', e.target.value)}
                    placeholder="00000-000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contato@empresa.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://empresa.com"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoadingForm}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoadingForm ? 'Salvando...' : 'Salvar Configurações'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Upload className="h-5 w-5" />
            <span>Logo da Empresa</span>
          </CardTitle>
          <CardDescription>
            Faça upload do logo da sua empresa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {logo ? (
              <div className="relative">
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-center">
                    <img 
                      src={logo} 
                      alt="Logo da empresa" 
                      className="max-h-32 max-w-full object-contain"
                    />
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 rounded-full h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragging 
                    ? 'border-primary bg-primary/5' 
                    : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">
                  Arraste e solte o arquivo aqui ou clique para selecionar
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG até 2MB
                </p>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" />
              {logo ? 'Alterar Logo' : 'Selecionar Arquivo'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
