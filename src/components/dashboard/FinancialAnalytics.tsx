import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { getInvestmentSummary, getSpendingByCategory } from '@/modules/dashboard/actions'
import { SpendingBreakdownChart } from '@/components/dashboard/SpendingBreakdownChart'
import { InvestmentGoalCard } from '@/components/dashboard/InvestmentGoalCard'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export async function FinancialAnalytics({ contextId }: { contextId: string }) {
  const [{ breakdown }, investment] = await Promise.all([
    getSpendingByCategory(contextId),
    getInvestmentSummary(contextId),
  ])

  // A maior alta de gasto vs. mês passado é a única chamada direta que vale destacar
  // fora do gráfico — o resto fica só sob hover, para não poluir a tela.
  const biggestIncrease = breakdown
    .filter((c) => c.previousAmount > 0 && c.amount > c.previousAmount)
    .sort((a, b) => (a.amount - a.previousAmount > b.amount - b.previousAmount ? -1 : 1))[0]

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Onde você está gastando mais</CardTitle>
          <CardDescription>
            {biggestIncrease ? (
              <span className="inline-flex items-center gap-1 text-amber-600">
                <TrendingUp className="h-3.5 w-3.5" />
                {biggestIncrease.name} subiu para {formatMoney(biggestIncrease.amount)} este mês
              </span>
            ) : (
              'Despesas do mês atual por categoria'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SpendingBreakdownChart data={breakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Meta de Investimento</CardTitle>
          <CardDescription>Recomendado: 20% da receita mensal</CardDescription>
        </CardHeader>
        <CardContent>
          <InvestmentGoalCard summary={investment} contextId={contextId} />
        </CardContent>
      </Card>
    </div>
  )
}
