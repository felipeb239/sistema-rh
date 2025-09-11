import { Header } from '@/components/layout/header'
import { RubricsContent } from '@/components/rubrics/rubrics-content'

export default function RubricsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          <RubricsContent />
        </div>
      </main>
    </div>
  )
}
