'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExtraFees(condominiumId: string) {
  const supabase = await createClient()

  const { data: fees, error } = await supabase
    .from('extra_fees')
    .select('*, transactions(actual_amount)')
    .eq('condominium_id', condominiumId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching extra fees', error)
    return []
  }

  // Calculate collected amount
  return fees.map(fee => {
    const collected = fee.transactions.reduce((acc: number, tx: { actual_amount: number | null }) => acc + (tx.actual_amount || 0), 0)
    return {
      ...fee,
      collected_amount: collected
    }
  })
}

export async function createExtraFee(formData: FormData) {
  const supabase = await createClient()

  const condominiumId = formData.get('condominium_id') as string
  const description = formData.get('description') as string
  const totalAmount = parseFloat(formData.get('total_amount') as string)
  const installmentsCount = parseInt(formData.get('installments_count') as string)
  const startDate = formData.get('start_date') as string
  const periodicity = formData.get('periodicity') as 'MONTHLY' | 'WEEKLY' | 'YEARLY' || 'MONTHLY'

  const installmentAmount = totalAmount / installmentsCount

  // We need context_id to insert transactions
  const { data: condo } = await supabase
    .from('condominiums')
    .select('context_id')
    .eq('id', condominiumId)
    .single()

  if (!condo) throw new Error('Condominium not found')
  const contextId = condo.context_id

  // We need a category for Extra Fees (find or create)
  let { data: cat } = await supabase
    .from('categories')
    .select('id')
    .eq('context_id', contextId)
    .ilike('name', '%Taxa Extra%')
    .single()

  if (!cat) {
    const { data: newCat } = await supabase
      .from('categories')
      .insert({ context_id: contextId, name: 'Taxa Extra', type: 'INCOME' })
      .select('id')
      .single()
    cat = newCat
  }

  if (!cat) throw new Error('Could not find or create category')

  // Calculate end_date based on periodicity and start_date
  let endDate = new Date(startDate)
  const [y, m, d] = startDate.split('-').map(Number)
  endDate = new Date(y, m - 1, d)

  if (periodicity === 'MONTHLY') endDate.setMonth(endDate.getMonth() + installmentsCount - 1)
  else if (periodicity === 'YEARLY') endDate.setFullYear(endDate.getFullYear() + installmentsCount - 1)
  else if (periodicity === 'WEEKLY') endDate.setDate(endDate.getDate() + (installmentsCount - 1) * 7)

  // 1. Create Extra Fee
  const { data: fee, error: feeErr } = await supabase
    .from('extra_fees')
    .insert({
      condominium_id: condominiumId,
      description,
      total_amount: totalAmount,
      installments_count: installmentsCount,
      installment_amount: installmentAmount,
      start_date: startDate,
      end_date: endDate.toISOString().split('T')[0],
      periodicity,
      status: 'ACTIVE'
    })
    .select()
    .single()

  if (feeErr || !fee) throw new Error('Failed to create extra fee')

  // 2. Create Global Transactions for the expected collection per month
  const transactionsToInsert = []
  const baseDate = new Date(y, m - 1, d)

  for (let i = 1; i <= installmentsCount; i++) {
    const currentExpectedDate = new Date(baseDate)
    
    if (periodicity === 'MONTHLY') currentExpectedDate.setMonth(baseDate.getMonth() + (i - 1))
    else if (periodicity === 'YEARLY') currentExpectedDate.setFullYear(baseDate.getFullYear() + (i - 1))
    else if (periodicity === 'WEEKLY') currentExpectedDate.setDate(baseDate.getDate() + ((i - 1) * 7))

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let status = 'PENDING'
    if (currentExpectedDate < today) status = 'OVERDUE'

    transactionsToInsert.push({
      context_id: contextId,
      category_id: cat.id,
      extra_fee_id: fee.id,
      description: `Arrecadação: ${description} (${i}/${installmentsCount})`,
      type: 'INCOME',
      expected_amount: installmentAmount,
      expected_date: currentExpectedDate.toISOString().split('T')[0],
      status,
      installment_number: i
    })
  }

  const { error: txErr } = await supabase.from('transactions').insert(transactionsToInsert)
  if (txErr) throw new Error('Failed to insert extra fee transactions')

  revalidatePath(`/empresa/${condominiumId}/taxas-extras`)
}
