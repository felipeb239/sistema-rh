'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, UserPlus } from 'lucide-react'
import { PhoneDirectoryContent } from '@/components/secretaria/phone-directory-content'
import { CustomerContactsContent } from '@/components/secretaria/customer-contacts-content'
import { Header } from '@/components/layout/header'

export default function SecretariaPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Secretaria</h1>
            <p className="text-gray-600 mt-2">
              Gerencie a lista telefônica e contatos de clientes
            </p>
          </div>

          <Tabs defaultValue="phone-directory" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="phone-directory" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Lista Telefônica
              </TabsTrigger>
              <TabsTrigger value="customer-contacts" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Contatos de Clientes
              </TabsTrigger>
            </TabsList>

            <TabsContent value="phone-directory" className="mt-6">
              <PhoneDirectoryContent />
            </TabsContent>

            <TabsContent value="customer-contacts" className="mt-6">
              <CustomerContactsContent />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
