'use server'

import { createClient } from '@/lib/supabase/server'
import { INVESTMENT_CATEGORY_NAME } from '@/modules/categories/seed'
import { INVESTMENT_TARGET_RATIO } from '@/modules/dashboard/constants'

export async function getDashboardSummary(contextId: string) {
  const supabase = await createClient()

  // Para um app de produção, criaríamos views no PostgreSQL para melhor performance.
  // Aqui puxamos as transações do contexto para computar em tempo real.
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('context_id', contextId)

  if (error) {
    console.error('Error fetching dashboard summary', error)
    return {
      expectedIncome: 0,
      actualIncome: 0,
      expectedExpense: 0,
      actualExpense: 0,
      pendingCount: 0,
      overdueCount: 0
    }
  }

  let expectedIncome = 0
  let actualIncome = 0
  let expectedExpense = 0
  let actualExpense = 0
  let pendingCount = 0
  let overdueCount = 0

  for (const tx of transactions) {
    if (tx.type === 'INCOME') {
      expectedIncome += tx.expected_amount
      actualIncome += tx.actual_amount ?? 0
    } else {
      expectedExpense += tx.expected_amount
      actualExpense += tx.actual_amount ?? 0
    }

    if (tx.status === 'PENDING') pendingCount++
    if (tx.status === 'OVERDUE') overdueCount++
  }

  return {
    expectedIncome,
    actualIncome,
    expectedExpense,
    actualExpense,
    pendingCount,
    overdueCount
  }
}

export async function getConsolidatedDashboard() {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return []

  // Get all condominiums and their contexts
  const { data: condominiums } = await supabase
    .from('condominiums')
    .select('*, contexts!inner(id, user_id)')
    .eq('contexts.user_id', userData.user.id)
    
  if (!condominiums || condominiums.length === 0) return []

  // Get all transactions for all these condominiums
  const contextIds = condominiums.map(c => c.contexts.id)
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('context_id, type, expected_amount, actual_amount, status')
    .in('context_id', contextIds)
    
  const txList = transactions || []

  interface PeriodSummary {
    expectedIncome: number
    actualIncome: number
    expectedExpense: number
    actualExpense: number
    pendingCount: number
    overdueCount: number
  }

  // Group by context_id
  const summaryByContext = txList.reduce((acc, tx) => {
    if (!acc[tx.context_id]) {
      acc[tx.context_id] = {
        expectedIncome: 0, actualIncome: 0,
        expectedExpense: 0, actualExpense: 0,
        pendingCount: 0, overdueCount: 0
      }
    }

    const summary = acc[tx.context_id]
    
    if (tx.type === 'INCOME') {
      summary.expectedIncome += tx.expected_amount
      summary.actualIncome += tx.actual_amount ?? 0
    } else {
      summary.expectedExpense += tx.expected_amount
      summary.actualExpense += tx.actual_amount ?? 0
    }

    if (tx.status === 'PENDING') summary.pendingCount++
    if (tx.status === 'OVERDUE') summary.overdueCount++

    return acc
  }, {} as Record<string, PeriodSummary>)

  // Build final array
  return condominiums.map(condo => {
    const s = summaryByContext[condo.contexts.id] || {
      expectedIncome: 0, actualIncome: 0, 
      expectedExpense: 0, actualExpense: 0, 
      pendingCount: 0, overdueCount: 0
    }
    return {
      condominium: condo,
      summary: s,
      balance: s.actualIncome - s.actualExpense
    }
  })
}

export interface CategorySpending {
  name: string
  amount: number
  percentage: number
  previousAmount: number
}

// Gastos por categoria no mês atual, com comparação ao mês anterior, para responder
// "onde está sendo gasto a mais". Usa actual_amount quando já pago, senão o previsto.
export async function getSpendingByCategory(contextId: string): Promise<{
  breakdown: CategorySpending[]
  totalCurrent: number
  totalPrevious: number
}> {
  const supabase = await createClient()

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const toISODate = (d: Date) => d.toISOString().split('T')[0]

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, expected_amount, actual_amount, expected_date, categories(name)')
    .eq('context_id', contextId)
    .eq('type', 'EXPENSE')
    .gte('expected_date', toISODate(prevMonthStart))
    .lt('expected_date', toISODate(nextMonthStart))

  if (error || !transactions) {
    console.error('Error fetching spending breakdown', error)
    return { breakdown: [], totalCurrent: 0, totalPrevious: 0 }
  }

  interface SpendingRow {
    expected_amount: number
    actual_amount: number | null
    expected_date: string
    categories: { name: string } | null
  }

  const currentByCategory = new Map<string, number>()
  const previousByCategory = new Map<string, number>()
  const currentMonthCutoff = toISODate(currentMonthStart)

  for (const tx of transactions as unknown as SpendingRow[]) {
    const amount = tx.actual_amount ?? tx.expected_amount ?? 0
    const categoryName = tx.categories?.name || 'Sem categoria'
    const bucket = tx.expected_date >= currentMonthCutoff ? currentByCategory : previousByCategory
    bucket.set(categoryName, (bucket.get(categoryName) || 0) + amount)
  }

  const totalCurrent = [...currentByCategory.values()].reduce((a, b) => a + b, 0)
  const totalPrevious = [...previousByCategory.values()].reduce((a, b) => a + b, 0)

  const breakdown = [...currentByCategory.entries()]
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: totalCurrent > 0 ? (amount / totalCurrent) * 100 : 0,
      previousAmount: previousByCategory.get(name) || 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return { breakdown, totalCurrent, totalPrevious }
}

export interface InvestmentSummary {
  income: number
  invested: number
  ratio: number
  target: number
  categoryExists: boolean
}

// Quanto da receita do mês atual foi direcionado à categoria "Investimentos",
// comparado à meta (INVESTMENT_TARGET_RATIO, hoje 20% da receita).
export async function getInvestmentSummary(contextId: string): Promise<InvestmentSummary> {
  const supabase = await createClient()

  const empty: InvestmentSummary = { income: 0, invested: 0, ratio: 0, target: INVESTMENT_TARGET_RATIO, categoryExists: false }

  const { data: invCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('context_id', contextId)
    .ilike('name', INVESTMENT_CATEGORY_NAME)
    .maybeSingle()

  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const toISODate = (d: Date) => d.toISOString().split('T')[0]

  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('type, category_id, expected_amount, actual_amount')
    .eq('context_id', contextId)
    .gte('expected_date', toISODate(currentMonthStart))
    .lt('expected_date', toISODate(nextMonthStart))

  if (error || !transactions) {
    console.error('Error fetching investment summary', error)
    return { ...empty, categoryExists: !!invCategory }
  }

  let income = 0
  let invested = 0

  for (const tx of transactions) {
    const amount = tx.actual_amount ?? tx.expected_amount ?? 0
    if (tx.type === 'INCOME') {
      income += amount
    } else if (invCategory && tx.category_id === invCategory.id) {
      invested += amount
    }
  }

  return {
    income,
    invested,
    ratio: income > 0 ? invested / income : 0,
    target: INVESTMENT_TARGET_RATIO,
    categoryExists: !!invCategory,
  }
}
