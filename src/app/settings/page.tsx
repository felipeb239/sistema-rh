import { Header } from '@/components/layout/header'
import { SettingsContent } from '@/components/settings/settings-content'

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          <SettingsContent />
        </div>
      </main>
    </div>
  )
}
