import Link from 'next/link'
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { InvestmentSummary } from '@/modules/dashboard/actions'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export function InvestmentGoalCard({ summary, contextId }: { summary: InvestmentSummary; contextId: string }) {
  if (!summary.categoryExists) {
    return (
      <div className="flex h-[220px] flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-muted-foreground max-w-[26ch]">
          Crie uma categoria de despesa chamada &quot;Investimentos&quot; para acompanhar sua meta aqui.
        </p>
        <Link
          href={`/configuracoes/categorias?context_id=${contextId}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          Ir para Categorias
        </Link>
      </div>
    )
  }

  const ratioPct = summary.ratio * 100
  const targetPct = summary.target * 100
  const targetAmount = summary.income * summary.target
  const gap = targetAmount - summary.invested

  const status =
    summary.ratio >= summary.target
      ? { color: 'text-green-600', bar: 'bg-green-600', Icon: CheckCircle2, label: 'Meta atingida' }
      : summary.ratio > 0
      ? { color: 'text-amber-600', bar: 'bg-amber-500', Icon: AlertTriangle, label: 'Abaixo da meta' }
      : { color: 'text-red-600', bar: 'bg-red-600', Icon: AlertCircle, label: 'Nada investido ainda' }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-3xl font-bold tabular-nums">{ratioPct.toFixed(1)}%</span>
          <span className="text-sm text-muted-foreground ml-1">da receita investida este mês</span>
        </div>
      </div>

      <div className="relative h-2.5 w-full rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${status.bar}`}
          style={{ width: `${Math.min(ratioPct, 100)}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-foreground/50"
          style={{ left: `${Math.min(targetPct, 100)}%` }}
        />
      </div>

      <div className={`flex items-center gap-1.5 text-sm font-medium ${status.color}`}>
        <status.Icon className="h-4 w-4" />
        {status.label}
      </div>

      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border text-sm">
        <div>
          <p className="text-muted-foreground">Investido</p>
          <p className="font-semibold tabular-nums">{formatMoney(summary.invested)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Meta ({targetPct.toFixed(0)}% da receita)</p>
          <p className="font-semibold tabular-nums">{formatMoney(targetAmount)}</p>
        </div>
      </div>
      {gap > 0 && (
        <p className="text-xs text-muted-foreground">
          Faltam {formatMoney(gap)} para atingir a meta deste mês.
        </p>
      )}
    </div>
  )
}
