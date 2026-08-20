'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/(auth)/login/actions'
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Settings,
  Tags,
  Receipt,
  LogOut,
  Target,
} from 'lucide-react'
import type { CompanyOption } from '@/components/shared/ContextSelector'

export function Sidebar({
  companies,
  personalContextId,
}: {
  companies: CompanyOption[]
  personalContextId: string | null
}) {
  const pathname = usePathname()

  const isActive = (path: string) =>
    pathname.startsWith(path) ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'

  const activeCompanyId = pathname.match(/^\/empresa\/([^/]+)/)?.[1]
  const activeCompany = companies.find((c) => c.id === activeCompanyId)
  // Fora de uma empresa específica, os lançamentos/categorias caem no contexto pessoal.
  const currentContextId = activeCompany?.contextId ?? personalContextId

  return (
    <aside className="w-64 border-r border-border bg-card h-screen flex flex-col hidden md:flex fixed left-0 top-0 pt-16">
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <Link href="/admin" className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/admin')}`}>
          <LayoutDashboard className="mr-3 h-5 w-5" />
          Control Tower
        </Link>

        <Link href="/pessoal" className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/pessoal')}`}>
          <Wallet className="mr-3 h-5 w-5" />
          Meu Painel
        </Link>

        {companies.length > 0 && (
          <div className="pt-6 pb-2">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Empresas</p>
          </div>
        )}
        {companies.map((company) => (
          <div key={company.id}>
            <Link
              href={`/empresa/${company.id}`}
              className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${pathname === `/empresa/${company.id}` ? 'bg-accent text-accent-foreground font-semibold' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'}`}
            >
              <Building2 className="mr-3 h-5 w-5 shrink-0" />
              <span className="truncate">{company.name}</span>
            </Link>
            {activeCompanyId === company.id && (
              <Link
                href={`/empresa/${company.id}/taxas-extras`}
                className={`ml-4 flex items-center px-3 py-2 rounded-md text-sm transition-colors ${isActive(`/empresa/${company.id}/taxas-extras`)}`}
              >
                <Receipt className="mr-3 h-4 w-4" />
                Taxas Extras
              </Link>
            )}
          </div>
        ))}

        <div className="pt-6 pb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lançamentos</p>
        </div>
        <Link
          href={currentContextId ? `/transacoes?context_id=${currentContextId}` : '/transacoes'}
          className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/transacoes')}`}
        >
          <Wallet className="mr-3 h-5 w-5" />
          Contas a Pagar / Receber
        </Link>
        <Link
          href={currentContextId ? `/configuracoes/categorias?context_id=${currentContextId}` : '/configuracoes/categorias'}
          className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/configuracoes/categorias')}`}
        >
          <Tags className="mr-3 h-5 w-5" />
          Categorias
        </Link>

        <div className="pt-6 pb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Planejamento</p>
        </div>
        <Link
          href={currentContextId ? `/objetivos?context_id=${currentContextId}` : '/objetivos'}
          className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/objetivos')}`}
        >
          <Target className="mr-3 h-5 w-5" />
          Objetivos
        </Link>

        <div className="pt-6 pb-2">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Configurações</p>
        </div>
        <Link href="/admin/empresas" className={`flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${isActive('/admin/empresas')}`}>
          <Settings className="mr-3 h-5 w-5" />
          Gerir Empresas
        </Link>
      </div>

      <div className="border-t border-border p-4">
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center px-3 py-2.5 rounded-md text-sm text-red-600 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
