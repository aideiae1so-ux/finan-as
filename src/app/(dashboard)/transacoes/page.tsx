import { getTransactions, createTransaction } from '@/modules/transactions/actions'
import { getCategories } from '@/modules/categories/actions'
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS } from '@/modules/transactions/constants'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getOrCreatePersonalContext } from '@/modules/contexts/actions'
import { TransactionsTable } from '@/components/transactions/TransactionsTable'
import { BatchTransactionDialog } from '@/components/transactions/BatchTransactionDialog'

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<{ context_id?: string }> }) {
  const params = await searchParams

  // Sem contexto selecionado na URL (ex: vindo do menu lateral fora de uma empresa),
  // caímos no contexto pessoal do usuário, criando-o sob demanda se ainda não existir.
  const currentContextId = params.context_id || (await getOrCreatePersonalContext()) || undefined

  const transactions = currentContextId ? await getTransactions(currentContextId) : []
  const categories = currentContextId ? await getCategories(currentContextId) : []

  const expenses = transactions.filter((tx) => tx.type === 'EXPENSE')
  const incomes = transactions.filter((tx) => tx.type === 'INCOME')

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lançamentos Financeiros</h1>
          <p className="text-muted-foreground mt-1">Contas a pagar e a receber</p>
        </div>

        {currentContextId && (
          <div className="flex gap-2">
            <BatchTransactionDialog contextId={currentContextId} categories={categories} />
            <Dialog>
              <DialogTrigger render={<Button />}>
                Novo Lançamento
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Inserir Transação</DialogTitle>
                </DialogHeader>
                <form action={createTransaction} className="space-y-4 pt-4">
                  <input type="hidden" name="context_id" value={currentContextId} />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <Select name="type" required defaultValue="EXPENSE">
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="INCOME">Receita (+)</SelectItem>
                          <SelectItem value="EXPENSE">Despesa (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category_id">Categoria</Label>
                      <Select name="category_id" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria..." />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Input id="description" name="description" required placeholder="Ex: Conta de Luz" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expected_date">Data Inicial/Vencimento</Label>
                      <Input id="expected_date" name="expected_date" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expected_amount">Valor (da parcela/único)</Label>
                      <Input id="expected_amount" name="expected_amount" type="number" step="0.01" required placeholder="0,00" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="payment_method">Forma de Pagamento</Label>
                    <Select name="payment_method" defaultValue="PIX">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((method) => (
                          <SelectItem key={method} value={method}>{PAYMENT_METHOD_LABELS[method]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 mt-4 text-sm font-semibold mb-2">
                    Opções de Parcelamento / Recorrência
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="installments_count">Qtd. Parcelas (1 = Única)</Label>
                      <Input id="installments_count" name="installments_count" type="number" min="1" defaultValue="1" />
                    </div>
                    <div className="space-y-2 flex flex-col justify-end pb-2">
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="is_recurring" name="is_recurring" className="h-4 w-4 rounded border-input accent-primary" />
                        <Label htmlFor="is_recurring">Lançamento Recorrente (Assinatura)</Label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequência (apenas se for recorrente)</Label>
                    <Select name="frequency" defaultValue="MONTHLY">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MONTHLY">Mensal</SelectItem>
                        <SelectItem value="WEEKLY">Semanal</SelectItem>
                        <SelectItem value="YEARLY">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t pt-4 mt-4 text-sm text-muted-foreground mb-2">
                    Preencha abaixo se a conta (ou a primeira parcela) já foi paga/recebida:
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="actual_date">Data Efetiva</Label>
                      <Input id="actual_date" name="actual_date" type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="actual_amount">Valor Efetivo</Label>
                      <Input id="actual_amount" name="actual_amount" type="number" step="0.01" placeholder="0,00" />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button type="submit">Salvar</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Extrato e Previsões</CardTitle>
        </CardHeader>
        <CardContent>
          {!currentContextId ? (
            <div className="text-center py-6 text-muted-foreground">
              Selecione um contexto (Empresa ou Pessoal) para visualizar as transações.
            </div>
          ) : (
            <Tabs defaultValue="expenses">
              <TabsList>
                <TabsTrigger value="expenses">Despesas ({expenses.length})</TabsTrigger>
                <TabsTrigger value="incomes">Receitas ({incomes.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="expenses">
                <TransactionsTable transactions={expenses} categories={categories} emptyLabel="Nenhuma despesa encontrada." />
              </TabsContent>
              <TabsContent value="incomes">
                <TransactionsTable transactions={incomes} categories={categories} emptyLabel="Nenhuma receita encontrada." />
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
