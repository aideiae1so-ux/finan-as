'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { PaymentMethod } from '@/modules/transactions/constants'

export async function getTransactions(contextId: string) {
  const supabase = await createClient()
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('*, categories(name)')
    .eq('context_id', contextId)
    .order('expected_date', { ascending: false })

  if (error) {
    console.error('Error fetching transactions', error)
    return []
  }
  return transactions
}

export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const contextId = formData.get('context_id') as string
  const categoryId = formData.get('category_id') as string
  const description = formData.get('description') as string
  const type = formData.get('type') as 'INCOME' | 'EXPENSE'
  const expectedAmount = parseFloat(formData.get('expected_amount') as string)
  const expectedDate = formData.get('expected_date') as string
  
  // Optional actual payment data
  const actualAmountStr = formData.get('actual_amount') as string
  const actualDateStr = formData.get('actual_date') as string
  
  const actualAmount = actualAmountStr ? parseFloat(actualAmountStr) : null
  const actualDate = actualDateStr ? actualDateStr : null

  // Determine status
  let status = 'PENDING'
  if (actualDate && actualAmount !== null) {
    status = 'PAID'
  } else {
    // Simple check if overdue
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    // Avoid timezone shift issues by extracting just the date part if it's YYYY-MM-DD
    const [y, m, d] = expectedDate.split('-').map(Number)
    const expected = new Date(y, m - 1, d)
    
    if (expected < today) {
      status = 'OVERDUE'
    }
  }

  const installmentsCountStr = formData.get('installments_count') as string
  const installmentsCount = installmentsCountStr ? parseInt(installmentsCountStr) : 1

  const isRecurring = formData.get('is_recurring') === 'on'
  const frequency = formData.get('frequency') as 'MONTHLY' | 'WEEKLY' | 'YEARLY' || 'MONTHLY'
  const paymentMethod = (formData.get('payment_method') as PaymentMethod) || 'OUTRO'

  if (installmentsCount > 1) {
    // 1. Handle Installments
    const { data: group, error: groupErr } = await supabase
      .from('installment_groups')
      .insert({
        context_id: contextId,
        description,
        total_amount: expectedAmount * installmentsCount,
        total_installments: installmentsCount
      })
      .select()
      .single()

    if (groupErr || !group) throw new Error('Failed to create installment group')

    const transactionsToInsert = []
    let baseDate = new Date(expectedDate)
    // Avoid timezone shift
    const [y, m, d] = expectedDate.split('-').map(Number)
    baseDate = new Date(y, m - 1, d)

    for (let i = 1; i <= installmentsCount; i++) {
      const currentExpectedDate = new Date(baseDate)
      currentExpectedDate.setMonth(baseDate.getMonth() + (i - 1))
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let status = 'PENDING'
      if (currentExpectedDate < today) status = 'OVERDUE'

      transactionsToInsert.push({
        context_id: contextId,
        category_id: categoryId,
        installment_group_id: group.id,
        description: `${description} (${i}/${installmentsCount})`,
        type,
        payment_method: paymentMethod,
        expected_amount: expectedAmount,
        expected_date: currentExpectedDate.toISOString().split('T')[0],
        status,
        installment_number: i
      })
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert)
    if (error) throw new Error('Failed to insert installments')

  } else if (isRecurring) {
    // 2. Handle Recurrence
    const { data: rec, error: recErr } = await supabase
      .from('recurrences')
      .insert({
        context_id: contextId,
        description,
        frequency,
        start_date: expectedDate,
        default_amount: expectedAmount
      })
      .select()
      .single()

    if (recErr || !rec) throw new Error('Failed to create recurrence rule')

    // Generate the first 12 months (or equivalent) immediately
    const transactionsToInsert = []
    let baseDate = new Date(expectedDate)
    const [y, m, d] = expectedDate.split('-').map(Number)
    baseDate = new Date(y, m - 1, d)

    for (let i = 0; i < 12; i++) {
      const currentExpectedDate = new Date(baseDate)
      if (frequency === 'MONTHLY') currentExpectedDate.setMonth(baseDate.getMonth() + i)
      if (frequency === 'YEARLY') currentExpectedDate.setFullYear(baseDate.getFullYear() + i)
      if (frequency === 'WEEKLY') currentExpectedDate.setDate(baseDate.getDate() + (i * 7))

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      let status = 'PENDING'
      if (currentExpectedDate < today) status = 'OVERDUE'

      transactionsToInsert.push({
        context_id: contextId,
        category_id: categoryId,
        recurrence_id: rec.id,
        description,
        type,
        payment_method: paymentMethod,
        expected_amount: expectedAmount,
        expected_date: currentExpectedDate.toISOString().split('T')[0],
        status
      })
    }

    const { error } = await supabase.from('transactions').insert(transactionsToInsert)
    if (error) throw new Error('Failed to insert recurrences')

  } else {
    // 3. Single Transaction (Original Logic)
    const { error } = await supabase
      .from('transactions')
      .insert({
        context_id: contextId,
        category_id: categoryId,
        description,
        type,
        payment_method: paymentMethod,
        expected_amount: expectedAmount,
        actual_amount: actualAmount,
        expected_date: expectedDate,
        actual_date: actualDate,
        status
      })

    if (error) {
      console.error('Error creating transaction', error)
      throw new Error('Failed to create transaction')
    }
  }

  revalidatePath('/transacoes')
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('transactions').delete().eq('id', id)

  if (error) {
    console.error('Error deleting transaction', error)
    throw new Error('Failed to delete transaction')
  }

  revalidatePath('/transacoes')
}

export async function markAsPaid(id: string) {
  const supabase = await createClient()

  // Resolve o valor no servidor (em vez de aceitar um valor vindo do cliente)
  // pra que chamar essa action diretamente não permita gravar um actual_amount
  // arbitrário — a linha "está paga" pelo valor que ela já tinha, ponto.
  const { data: tx, error: fetchError } = await supabase
    .from('transactions')
    .select('expected_amount')
    .eq('id', id)
    .single()

  if (fetchError || !tx) {
    console.error('Error fetching transaction to mark as paid', fetchError)
    throw new Error('Failed to mark transaction as paid')
  }

  const today = new Date().toISOString().split('T')[0]

  const { error } = await supabase
    .from('transactions')
    .update({ status: 'PAID', actual_date: today, actual_amount: tx.expected_amount })
    .eq('id', id)
    .in('status', ['PENDING', 'OVERDUE'])

  if (error) {
    console.error('Error marking transaction as paid', error)
    throw new Error('Failed to mark transaction as paid')
  }

  revalidatePath('/transacoes')
}

export interface BatchTransactionRow {
  description: string
  categoryId: string
  amount: number
}

export async function createBatchTransactions(
  contextId: string,
  expectedDate: string,
  rows: BatchTransactionRow[]
) {
  const supabase = await createClient()

  const validRows = rows.filter((r) => r.description.trim() && r.categoryId && r.amount > 0)
  if (validRows.length === 0) return

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, m, d] = expectedDate.split('-').map(Number)
  const expected = new Date(y, m - 1, d)
  const status = expected < today ? 'OVERDUE' : 'PENDING'

  const transactionsToInsert = validRows.map((row) => ({
    context_id: contextId,
    category_id: row.categoryId,
    description: row.description,
    type: 'EXPENSE' as const,
    payment_method: 'CARTAO_CREDITO' as const,
    expected_amount: row.amount,
    expected_date: expectedDate,
    status,
  }))

  const { error } = await supabase.from('transactions').insert(transactionsToInsert)

  if (error) {
    console.error('Error creating batch transactions', error)
    throw new Error('Failed to create batch transactions')
  }

  revalidatePath('/transacoes')
}
