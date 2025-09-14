import { Header } from '@/components/layout/header'
import { UsersContent } from '@/components/users/users-content'

export default function UsersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          <UsersContent />
        </div>
      </main>
    </div>
  )
}