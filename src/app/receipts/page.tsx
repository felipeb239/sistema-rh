import { Header } from '@/components/layout/header'
import { ReceiptsContent } from '@/components/receipts/receipts-content'
import { ReceiptTypesManager } from '@/components/receipts/receipt-types-manager'

export default function ReceiptsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="lg:ml-60 xl:ml-64 2xl:ml-72">
        <div className="p-4 sm:p-6 space-y-6">
          <ReceiptsContent />
          <ReceiptTypesManager />
        </div>
      </main>
    </div>
  )
}
