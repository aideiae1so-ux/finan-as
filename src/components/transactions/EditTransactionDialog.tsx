'use client'

import { useState } from 'react'
import { Pencil } from 'lucide-react'
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
import { updateTransaction } from '@/modules/transactions/actions'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/modules/transactions/constants'
import type { TransactionRow } from '@/components/transactions/TransactionsTable'

interface Category {
  id: string
  name: string
}

const STATUS_LABELS = {
  PENDING: 'Pendente',
  PAID: 'Pago',
  OVERDUE: 'Vencido',
  CANCELLED: 'Cancelado',
} as const

export function EditTransactionDialog({ transaction, categories }: { transaction: TransactionRow; categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const updateWithId = updateTransaction.bind(null, transaction.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" aria-label="Editar lançamento" title="Editar lançamento" className="text-muted-foreground hover:text-primary transition-colors" />}>
        <Pencil className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Lançamento</DialogTitle>
        </DialogHeader>
        <form action={async (formData) => { await updateWithId(formData); setOpen(false) }} className="space-y-4 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-type-${transaction.id}`}>Tipo</Label>
              <Select name="type" required defaultValue={transaction.type}>
                <SelectTrigger id={`edit-type-${transaction.id}`}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INCOME">Receita (+)</SelectItem>
                  <SelectItem value="EXPENSE">Despesa (-)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-category-${transaction.id}`}>Categoria</Label>
              <Select name="category_id" required defaultValue={transaction.category_id ?? undefined}>
                <SelectTrigger id={`edit-category-${transaction.id}`}>
                  <SelectValue placeholder="Categoria..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`edit-description-${transaction.id}`}>Descrição</Label>
            <Input id={`edit-description-${transaction.id}`} name="description" required defaultValue={transaction.description} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-expected-date-${transaction.id}`}>Data Prevista</Label>
              <Input id={`edit-expected-date-${transaction.id}`} name="expected_date" type="date" required defaultValue={transaction.expected_date.split('T')[0]} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-expected-amount-${transaction.id}`}>Valor Previsto</Label>
              <Input id={`edit-expected-amount-${transaction.id}`} name="expected_amount" type="number" step="0.01" required defaultValue={transaction.expected_amount} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-payment-method-${transaction.id}`}>Forma de Pagamento</Label>
              <Select name="payment_method" defaultValue={transaction.payment_method}>
                <SelectTrigger id={`edit-payment-method-${transaction.id}`}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-status-${transaction.id}`}>Status</Label>
              <Select name="status" required defaultValue={transaction.status}>
                <SelectTrigger id={`edit-status-${transaction.id}`}>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="border-t pt-4 mt-4 text-sm text-muted-foreground mb-2">
            Se já foi paga/recebida, confira a data e o valor efetivo:
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`edit-actual-date-${transaction.id}`}>Data Efetiva</Label>
              <Input
                id={`edit-actual-date-${transaction.id}`}
                name="actual_date"
                type="date"
                defaultValue={transaction.actual_date ? transaction.actual_date.split('T')[0] : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`edit-actual-amount-${transaction.id}`}>Valor Efetivo</Label>
              <Input
                id={`edit-actual-amount-${transaction.id}`}
                name="actual_amount"
                type="number"
                step="0.01"
                defaultValue={transaction.actual_amount ?? ''}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit">Salvar Alterações</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
