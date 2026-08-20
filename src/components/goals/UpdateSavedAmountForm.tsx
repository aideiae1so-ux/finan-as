import { updateSavedAmount } from '@/modules/goals/actions'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function UpdateSavedAmountForm({ id, currentAmount }: { id: string; currentAmount: number }) {
  const updateWithId = updateSavedAmount.bind(null, id)

  return (
    <form action={updateWithId} className="flex items-center gap-2">
      <label htmlFor={`saved-${id}`} className="text-xs text-muted-foreground shrink-0">
        Valor guardado
      </label>
      <Input
        id={`saved-${id}`}
        name="current_saved_amount"
        type="number"
        step="0.01"
        min="0"
        defaultValue={currentAmount}
        className="h-7 text-xs"
      />
      <Button type="submit" size="xs" variant="outline" className="shrink-0">
        Atualizar
      </Button>
    </form>
  )
}
