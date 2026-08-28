'use client'

import { useRef, useState, useTransition } from 'react'
import { CreditCard, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createBatchTransactions } from '@/modules/transactions/actions'

interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
}

interface Row {
  key: number
  description: string
  categoryId: string
  amount: string
}

const emptyRow = (key: number): Row => ({ key, description: '', categoryId: '', amount: '' })

export function BatchTransactionDialog({ contextId, categories }: { contextId: string; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const [expectedDate, setExpectedDate] = useState(() => new Date().toISOString().split('T')[0])
  const [rows, setRows] = useState<Row[]>([emptyRow(0)])
  const [isPending, startTransition] = useTransition()
  const nextKey = useRef(1)

  // Fatura de cartão só gera despesas — categorias de receita não fazem sentido aqui.
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')

  const addRow = () => {
    setRows((prev) => [...prev, emptyRow(nextKey.current++)])
  }

  const removeRow = (key: number) => {
    setRows((prev) => prev.filter((r) => r.key !== key))
  }

  const updateRow = (key: number, field: keyof Omit<Row, 'key'>, value: string) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)))
  }

  const hasValidRow = rows.some((r) => r.description.trim() && r.categoryId && parseFloat(r.amount) > 0)

  const handleSave = () => {
    startTransition(async () => {
      await createBatchTransactions(
        contextId,
        expectedDate,
        rows.map((r) => ({ description: r.description, categoryId: r.categoryId, amount: parseFloat(r.amount) || 0 }))
      )
      setRows([emptyRow(nextKey.current++)])
      setOpen(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <CreditCard className="h-4 w-4" />
        Lançar Fatura
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Lançar Fatura do Cartão de Crédito</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="space-y-2 max-w-[220px]">
            <Label htmlFor="batch_date">Data (aplicada a todas as linhas)</Label>
            <Input
              id="batch_date"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-[1fr_1fr_130px_28px] gap-2 text-xs font-medium text-muted-foreground px-1">
              <span>Descrição</span>
              <span>Categoria</span>
              <span>Valor</span>
              <span></span>
            </div>
            {rows.map((row) => (
              <div key={row.key} className="grid grid-cols-[1fr_1fr_130px_28px] gap-2 items-center">
                <Input
                  placeholder="Ex: Uber"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, 'description', e.target.value)}
                />
                <Select value={row.categoryId} onValueChange={(v) => v && updateRow(row.key, 'categoryId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={row.amount}
                  onChange={(e) => updateRow(row.key, 'amount', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  aria-label="Remover linha"
                  className="text-muted-foreground hover:text-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4" />
            Adicionar linha
          </Button>

          <div className="pt-4 flex justify-end">
            <Button type="button" onClick={handleSave} disabled={!hasValidRow || isPending}>
              {isPending ? 'Salvando...' : 'Salvar Tudo'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
