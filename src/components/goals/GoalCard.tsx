import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { AlertCircle, AlertTriangle, CheckCircle2, TrendingUp } from 'lucide-react'
import type { Goal } from '@/modules/goals/actions'
import type { InvestmentSummary, CategorySpending } from '@/modules/dashboard/actions'
import { computeGoalDiagnostic } from '@/modules/goals/diagnostics'
import { UpdateSavedAmountForm } from '@/components/goals/UpdateSavedAmountForm'
import { DeleteGoalButton } from '@/components/goals/DeleteGoalButton'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function GoalCard({
  goal,
  investment,
  spendingBreakdown,
  hasMultipleGoals,
}: {
  goal: Goal
  investment: InvestmentSummary
  spendingBreakdown: CategorySpending[]
  hasMultipleGoals: boolean
}) {
  const d = computeGoalDiagnostic(goal, investment, spendingBreakdown)
  const progressPct = goal.target_amount > 0
    ? Math.min((goal.current_saved_amount / goal.target_amount) * 100, 100)
    : 0

  const status = d.isAchieved
    ? { color: 'text-green-600', Icon: CheckCircle2, label: 'Meta atingida' }
    : d.isOverdue
    ? { color: 'text-red-600', Icon: AlertCircle, label: 'Data alvo já passou' }
    : d.monthlyInvested === 0
    ? { color: 'text-red-600', Icon: AlertCircle, label: 'Sem investimento este mês' }
    : d.gap !== null && d.gap > 0
    ? { color: 'text-amber-600', Icon: AlertTriangle, label: 'Abaixo do ritmo necessário' }
    : d.gap !== null
    ? { color: 'text-green-600', Icon: TrendingUp, label: 'No ritmo certo para a data' }
    : { color: 'text-primary', Icon: TrendingUp, label: 'Em progresso' }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{goal.name}</CardTitle>
            <CardDescription>Meta: {formatMoney(goal.target_amount)}</CardDescription>
          </div>
          <DeleteGoalButton id={goal.id} name={goal.name} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Guardado</span>
            <span className="font-semibold tabular-nums">{formatMoney(goal.current_saved_amount)}</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>

        <div className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
          <status.Icon className="h-4 w-4 shrink-0" />
          {status.label}
        </div>

        {!d.isAchieved && !d.isOverdue && (
          <div className="text-sm text-muted-foreground space-y-1.5">
            {d.monthsAtCurrentPace !== null && (
              <p>
                No ritmo atual ({formatMoney(d.monthlyInvested)}/mês investidos), faltam{' '}
                <span className="font-medium text-foreground">~{Math.ceil(d.monthsAtCurrentPace)} meses</span>.
              </p>
            )}
            {d.requiredMonthly !== null && d.gap !== null && d.gap > 0 && (
              <p>
                Pra bater a meta na data escolhida, precisa investir{' '}
                <span className="font-medium text-foreground">{formatMoney(d.requiredMonthly)}/mês</span>{' '}
                — faltam <span className="font-medium text-amber-600">{formatMoney(d.gap)}/mês</span>.
              </p>
            )}
            {d.suggestion && (
              <p>
                Maior categoria de gasto este mês:{' '}
                <span className="font-medium text-foreground">{d.suggestion.categoryName}</span>{' '}
                ({formatMoney(d.suggestion.amount)}) — pode valer avaliar um corte aí.
              </p>
            )}
            {hasMultipleGoals && (
              <p className="text-xs italic">
                Você tem outros objetivos ativos — essa projeção assume que todo o seu investimento mensal vai só pra este.
              </p>
            )}
          </div>
        )}

        <UpdateSavedAmountForm id={goal.id} currentAmount={goal.current_saved_amount} />
      </CardContent>
    </Card>
  )
}
