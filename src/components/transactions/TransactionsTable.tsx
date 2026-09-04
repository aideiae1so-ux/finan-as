'use client'

import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DeleteTransactionButton } from '@/components/shared/DeleteTransactionButton'
import { MarkAsPaidButton } from '@/components/shared/MarkAsPaidButton'
import { EditTransactionDialog } from '@/components/transactions/EditTransactionDialog'
import { deleteTransactions } from '@/modules/transactions/actions'
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/modules/transactions/constants'

export interface TransactionRow {
  id: string
  description: string
  expected_date: string
  actual_date: string | null
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
  type: 'INCOME' | 'EXPENSE'
  category_id: string | null
  expected_amount: number
  actual_amount: number | null
  payment_method: PaymentMethod
  categories: { name: string } | null
}

interface Category {
  id: string
  name: string
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function TransactionsTable({
  transactions,
  categories,
  emptyLabel,
}: {
  transactions: TransactionRow[]
  categories: Category[]
  emptyLabel: string
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  const allSelected = transactions.length > 0 && selected.size === transactions.length

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(transactions.map((t) => t.id)))
  }

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkDelete = () => {
    if (!confirm(`Excluir ${selected.size} lançamento(s) selecionado(s)? Essa ação não pode ser desfeita.`)) return
    startTransition(async () => {
      await deleteTransactions([...selected])
      setSelected(new Set())
    })
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-md border border-border bg-muted/50 px-3 py-2">
          <span className="text-sm text-muted-foreground">{selected.size} selecionado(s)</span>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={isPending}>
            <Trash2 className="h-4 w-4" />
            Excluir selecionados
          </Button>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-8">
              <input
                type="checkbox"
                aria-label="Selecionar todos"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={allSelected}
                onChange={toggleAll}
              />
            </TableHead>
            <TableHead>Data Prevista</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Pagamento</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Valor</TableHead>
            <TableHead className="w-16"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => {
              const isIncome = tx.type === 'INCOME'
              const amount = tx.actual_amount ?? tx.expected_amount
              const canMarkAsPaid = tx.status === 'PENDING' || tx.status === 'OVERDUE'

              return (
                <TableRow key={tx.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Selecionar ${tx.description}`}
                      className="h-4 w-4 rounded border-input accent-primary"
                      checked={selected.has(tx.id)}
                      onChange={() => toggleOne(tx.id)}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(tx.expected_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                  </TableCell>
                  <TableCell className="font-medium">{tx.description}</TableCell>
                  <TableCell>{tx.categories?.name}</TableCell>
                  <TableCell className="text-muted-foreground">{PAYMENT_METHOD_LABELS[tx.payment_method]}</TableCell>
                  <TableCell>
                    {tx.status === 'PAID' && <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">Pago</span>}
                    {tx.status === 'PENDING' && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Pendente</span>}
                    {tx.status === 'OVERDUE' && <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">Vencido</span>}
                    {tx.status === 'CANCELLED' && <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">Cancelado</span>}
                  </TableCell>
                  <TableCell className={`text-right font-semibold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : '-'}{formatCurrency(amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-3">
                      {canMarkAsPaid && (
                        <MarkAsPaidButton id={tx.id} description={tx.description} amount={tx.expected_amount} />
                      )}
                      <EditTransactionDialog transaction={tx} categories={categories} />
                      <DeleteTransactionButton id={tx.id} description={tx.description} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
