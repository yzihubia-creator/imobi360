import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/navigation/sidebar'
import type { UserRole } from '@/lib/permissions'

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

  // Get user's tenant and role
  const { data: userRecord } = await supabase
    .from('users')
    .select('tenant_id, role')
    .eq('auth_user_id', user.id)
    .single()

  if (!userRecord) {
    redirect('/login')
  }

  const tenantId = userRecord.tenant_id
  const userRole = (userRecord.role || 'viewer') as UserRole

  // Get tenant name for branding
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  const tenantName = tenant?.name || 'CRM'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-slate-950/95 backdrop-blur-sm flex flex-col">
        <div className="flex h-16 items-center border-b border-white/10 px-6 flex-shrink-0">
          <h1 className="text-xl font-semibold text-slate-50">{tenantName}</h1>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <Sidebar tenantId={tenantId} userRole={userRole} />
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-slate-800/50 bg-slate-950/95 backdrop-blur-sm px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-50">Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">{user.email}</span>
            <form action="/api/auth/signout" method="post">
              <button className="text-sm text-slate-400 hover:text-slate-200 transition-colors duration-200 font-medium">
                Sair
              </button>
            </form>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-hidden bg-slate-950">{children}</main>
      </div>
    </div>
  )
}
