import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getOrCreatePersonalContext } from '@/modules/contexts/actions'
import { getCondominiums } from '@/modules/condominiums/actions'
import type { CompanyOption } from '@/components/shared/ContextSelector'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData?.user) {
    redirect('/login')
  }

  const [personalContextId, condominiums] = await Promise.all([
    getOrCreatePersonalContext(),
    getCondominiums(),
  ])

  const companies: CompanyOption[] = condominiums.map((c) => ({
    id: c.id,
    name: c.name,
    contextId: c.contexts.id,
  }))

  return (
    <div className="min-h-screen bg-muted/30">
      <Header companies={companies} personalContextId={personalContextId} />
      <Sidebar companies={companies} personalContextId={personalContextId} />
      <main className="md:pl-64 pt-16 min-h-screen">
        {children}
      </main>
    </div>
  )
}
