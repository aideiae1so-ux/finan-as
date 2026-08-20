'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteTransaction } from '@/modules/transactions/actions'

export function DeleteTransactionButton({ id, description }: { id: string; description: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Excluir o lançamento "${description}"? Essa ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteTransaction(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Excluir lançamento"
      title="Excluir lançamento"
      className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
