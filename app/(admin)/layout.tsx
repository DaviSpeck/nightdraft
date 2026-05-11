import { requireAuth } from '@/lib/auth'
import Sidebar from '@/components/ui/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth()

  return (
    <div className="flex min-h-screen bg-base">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
