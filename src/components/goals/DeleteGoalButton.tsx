'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { deleteGoal } from '@/modules/goals/actions'

export function DeleteGoalButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    if (!confirm(`Excluir o objetivo "${name}"? Essa ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteGoal(id)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Excluir objetivo"
      title="Excluir objetivo"
      className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
