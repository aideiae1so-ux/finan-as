'use client'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CategorySpending } from '@/modules/dashboard/actions'

const formatMoney = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: CategorySpending }[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0].payload
  const delta = item.amount - item.previousAmount
  const deltaPct = item.previousAmount > 0 ? (delta / item.previousAmount) * 100 : null

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-popover-foreground">{item.name}</p>
      <p className="text-muted-foreground tabular-nums">{formatMoney(item.amount)} este mês</p>
      {deltaPct !== null && (
        <p className={`tabular-nums ${delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
          {delta > 0 ? '+' : ''}{deltaPct.toFixed(0)}% vs. mês anterior
        </p>
      )}
    </div>
  )
}

export function SpendingBreakdownChart({ data }: { data: CategorySpending[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
        Nenhuma despesa lançada neste mês ainda.
      </div>
    )
  }

  const top = data.slice(0, 8)
  const rowHeight = 32
  const chartHeight = Math.max(top.length * rowHeight, 120)

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart data={top} layout="vertical" margin={{ top: 0, right: 24, bottom: 0, left: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis
          type="category"
          dataKey="name"
          width={132}
          axisLine={false}
          tickLine={false}
          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
        />
        <Tooltip cursor={{ fill: 'var(--muted)' }} content={<ChartTooltip />} />
        <Bar dataKey="amount" fill="var(--primary)" radius={[0, 4, 4, 0]} maxBarSize={20} />
      </BarChart>
    </ResponsiveContainer>
  )
}
