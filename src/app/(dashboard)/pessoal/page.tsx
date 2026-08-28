import { getFinancialOverview } from '@/modules/dashboard/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getOrCreatePersonalContext } from '@/modules/contexts/actions'
import { FinancialAnalytics } from '@/components/dashboard/FinancialAnalytics'

const formatMoney = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

export default async function PersonalDashboardPage() {
  const personalContextId = await getOrCreatePersonalContext()

  if (!personalContextId) return <div className="p-8">Não autenticado</div>

  const { summary, spending, investment } = await getFinancialOverview(personalContextId)

  const balance = summary.actualIncome - summary.actualExpense

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Finanças Pessoais</h1>
        <p className="text-muted-foreground mt-1">Resumo do seu patrimônio e gastos pessoais</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual (Realizado)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatMoney(balance)}
            </div>
            <p className="text-xs text-muted-foreground">Receitas - Despesas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(summary.actualIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Previsto total: {formatMoney(summary.expectedIncome)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatMoney(summary.actualExpense)}
            </div>
            <p className="text-xs text-muted-foreground">Previsto total: {formatMoney(summary.expectedExpense)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summary.overdueCount} <span className="text-sm font-normal text-muted-foreground">vencidas</span>
            </div>
            <p className="text-xs text-muted-foreground">{summary.pendingCount} contas pendentes</p>
          </CardContent>
        </Card>
      </div>

      <FinancialAnalytics contextId={personalContextId} spendingBreakdown={spending.breakdown} investment={investment} />
    </div>
  )
}
