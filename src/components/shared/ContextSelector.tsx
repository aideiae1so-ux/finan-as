'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useContextStore } from '@/store/useContextStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building, User } from 'lucide-react'

export interface CompanyOption {
  id: string
  name: string
  contextId: string
}

export function ContextSelector({
  companies,
  personalContextId,
}: {
  companies: CompanyOption[]
  personalContextId: string | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { setContext } = useContextStore()

  // A URL é a fonte da verdade: se estamos dentro de /empresa/[id], essa é a seleção ativa.
  // Nada aqui depende do estado persistido do Zustand para renderizar, então não há
  // descompasso de hidratação a evitar (diferente da versão anterior deste componente).
  const activeCompanyId = pathname.match(/^\/empresa\/([^/]+)/)?.[1]
  const selectedValue = activeCompanyId
    ? `CONDOMINIUM:${activeCompanyId}`
    : 'PERSONAL'

  const handleValueChange = (value: string | null) => {
    if (!value) return
    if (value === 'PERSONAL') {
      setContext('PERSONAL', personalContextId)
      router.push('/pessoal')
    } else if (value.startsWith('CONDOMINIUM:')) {
      const id = value.split(':')[1]
      const company = companies.find((c) => c.id === id)
      if (!company) return
      setContext('CONDOMINIUM', company.contextId, company.id)
      router.push(`/empresa/${company.id}`)
    }
  }

  return (
    <Select value={selectedValue} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[280px]">
        <SelectValue placeholder="Selecione o contexto..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="PERSONAL">
          <div className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Finanças Pessoais
          </div>
        </SelectItem>

        {companies.map((company) => (
          <SelectItem key={company.id} value={`CONDOMINIUM:${company.id}`}>
            <div className="flex items-center">
              <Building className="mr-2 h-4 w-4" />
              {company.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
