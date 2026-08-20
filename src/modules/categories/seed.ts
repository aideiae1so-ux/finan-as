import { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_CATEGORIES: Record<'PERSONAL' | 'CONDOMINIUM', { name: string; type: 'INCOME' | 'EXPENSE' }[]> = {
  PERSONAL: [
    { name: 'Salário', type: 'INCOME' },
    { name: 'Outras Receitas', type: 'INCOME' },
    { name: 'Moradia', type: 'EXPENSE' },
    { name: 'Alimentação', type: 'EXPENSE' },
    { name: 'Transporte', type: 'EXPENSE' },
    { name: 'Saúde', type: 'EXPENSE' },
    { name: 'Lazer', type: 'EXPENSE' },
    { name: 'Investimentos', type: 'EXPENSE' },
    { name: 'Outras Despesas', type: 'EXPENSE' },
  ],
  CONDOMINIUM: [
    { name: 'Taxa Condominial', type: 'INCOME' },
    { name: 'Outras Receitas', type: 'INCOME' },
    { name: 'Manutenção', type: 'EXPENSE' },
    { name: 'Limpeza', type: 'EXPENSE' },
    { name: 'Segurança', type: 'EXPENSE' },
    { name: 'Água e Luz', type: 'EXPENSE' },
    { name: 'Investimentos', type: 'EXPENSE' },
    { name: 'Outras Despesas', type: 'EXPENSE' },
  ],
}

// Nome reservado usado pelo dashboard de análise para calcular a meta de investimento (20% da receita).
export const INVESTMENT_CATEGORY_NAME = 'Investimentos'

export async function seedDefaultCategories(
  supabase: SupabaseClient,
  contextId: string,
  contextType: 'PERSONAL' | 'CONDOMINIUM'
) {
  const rows = DEFAULT_CATEGORIES[contextType].map((c) => ({
    context_id: contextId,
    name: c.name,
    type: c.type,
  }))

  const { error } = await supabase.from('categories').insert(rows)
  if (error) {
    console.error('Error seeding default categories', error)
  }
}
