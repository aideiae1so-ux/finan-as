'use client'

import { ContextSelector, type CompanyOption } from '@/components/shared/ContextSelector'
import { Building2 } from 'lucide-react'

export function Header({
  companies,
  personalContextId,
}: {
  companies: CompanyOption[]
  personalContextId: string | null
}) {
  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-6">
      <div className="flex items-center space-x-2">
        <div className="bg-primary p-2 rounded-lg">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">Suporte Controle Financeiro</span>
      </div>

      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-muted-foreground hidden md:block">Contexto Ativo:</span>
        <ContextSelector companies={companies} personalContextId={personalContextId} />
      </div>
    </header>
  )
}
