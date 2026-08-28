import { getFinancialOverview } from '@/modules/dashboard/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { FinancialAnalytics } from '@/components/dashboard/FinancialAnalytics'

const formatMoney = (val: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default async function CondominiumDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  // Neste caso 'id' é o id do Condominium.
  // Precisamos achar o context_id atrelado a este condomínio.
  const { id } = await params
  const supabase = await createClient()

  const { data: condo } = await supabase
    .from('condominiums')
    .select('*, contexts(id)')
    .eq('id', id)
    .single()

  if (!condo || !condo.contexts) {
    return <div className="p-8">Empresa não encontrada ou sem acesso.</div>
  }

  const { summary, spending, investment } = await getFinancialOverview(condo.contexts.id)
  const balance = summary.actualIncome - summary.actualExpense

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel: {condo.name}</h1>
        <p className="text-muted-foreground mt-1">
          Visão financeira detalhada da empresa {condo.cnpj ? `(CNPJ: ${condo.cnpj})` : ''}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatMoney(balance)}
            </div>
            <p className="text-xs text-muted-foreground">Arrecadado - Despesas pagas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrecadação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary.actualIncome)}
            </div>
            <p className="text-xs text-muted-foreground">A receber previsto: {formatMoney(summary.expectedIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Efetivas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMoney(summary.actualExpense)}
            </div>
            <p className="text-xs text-muted-foreground">A pagar previsto: {formatMoney(summary.expectedExpense)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplência / Pendências</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.overdueCount} <span className="text-sm font-normal text-muted-foreground">vencidas</span>
            </div>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} contas pendentes</p>
          </CardContent>
        </Card>
      </div>

      <FinancialAnalytics contextId={condo.contexts.id} spendingBreakdown={spending.breakdown} investment={investment} />
    </div>
  )
}
