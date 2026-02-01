import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard/dashboard-nav'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-gray-50/40 flex flex-col">
        <div className="flex h-16 items-center border-b px-6 flex-shrink-0">
          <h1 className="text-xl font-bold">IMOBI360</h1>
        </div>
        <div className="flex-1 overflow-auto">
          <DashboardNav />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button className="text-sm text-gray-600 hover:text-gray-900">
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
