import { Header } from '@/components/layout/header'
import { EmployeesContent } from '@/components/employees/employees-content'

export default function EmployeesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6">
          <EmployeesContent />
        </div>
      </main>
    </div>
  )
}
