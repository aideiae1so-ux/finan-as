import { differenceInCalendarMonths } from 'date-fns'
import type { Goal } from '@/modules/goals/actions'
import type { InvestmentSummary, CategorySpending } from '@/modules/dashboard/actions'
import { INVESTMENT_CATEGORY_NAME } from '@/modules/categories/seed'

export interface GoalSuggestion {
  categoryName: string
  amount: number
}

export interface GoalDiagnostic {
  remaining: number
  monthlyInvested: number
  isAchieved: boolean
  isOverdue: boolean
  monthsAtCurrentPace: number | null
  monthsAvailable: number | null
  requiredMonthly: number | null
  gap: number | null
  suggestion: GoalSuggestion | null
}

export function computeGoalDiagnostic(
  goal: Goal,
  investment: InvestmentSummary,
  spendingBreakdown: CategorySpending[]
): GoalDiagnostic {
  const remaining = goal.target_amount - goal.current_saved_amount
  const monthlyInvested = investment.invested
  const isAchieved = remaining <= 0

  const monthsAtCurrentPace = !isAchieved && monthlyInvested > 0
    ? remaining / monthlyInvested
    : null

  let monthsAvailable: number | null = null
  let isOverdue = false
  let requiredMonthly: number | null = null
  let gap: number | null = null

  if (!isAchieved && goal.target_date) {
    monthsAvailable = differenceInCalendarMonths(new Date(goal.target_date), new Date())
    if (monthsAvailable <= 0) {
      isOverdue = true
    } else {
      requiredMonthly = remaining / monthsAvailable
      gap = requiredMonthly - monthlyInvested
    }
  }

  const topCategory = spendingBreakdown.find(
    (c) => c.name.toLowerCase() !== INVESTMENT_CATEGORY_NAME.toLowerCase()
  )
  const needsSuggestion = !isAchieved && (monthlyInvested === 0 || (gap !== null && gap > 0))
  const suggestion: GoalSuggestion | null =
    needsSuggestion && topCategory ? { categoryName: topCategory.name, amount: topCategory.amount } : null

  return {
    remaining,
    monthlyInvested,
    isAchieved,
    isOverdue,
    monthsAtCurrentPace,
    monthsAvailable,
    requiredMonthly,
    gap,
    suggestion,
  }
}
