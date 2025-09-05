import { Header } from '@/components/layout/header'
import { PayrollContent } from '@/components/payroll/payroll-content'
import { PayrollRubricsManager } from '@/components/payroll/payroll-rubrics-manager'

export default function PayrollPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6 space-y-6">
          <PayrollContent />
          <PayrollRubricsManager />
        </div>
      </main>
    </div>
  )
}
