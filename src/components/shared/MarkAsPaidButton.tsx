'use client'

import { useTransition } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { markAsPaid } from '@/modules/transactions/actions'

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function MarkAsPaidButton({ id, description, amount }: { id: string; description: string; amount: number }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Marcar "${description}" (${formatCurrency(amount)}) como pago hoje?`)) return
    startTransition(async () => {
      await markAsPaid(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Marcar como pago"
      title="Marcar como pago"
      className="text-muted-foreground hover:text-green-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      <CheckCircle2 className="h-4 w-4" />
    </button>
  )
}
