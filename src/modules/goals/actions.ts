'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Goal {
  id: string
  context_id: string
  name: string
  target_amount: number
  target_date: string | null
  current_saved_amount: number
  created_at: string
}

export async function getGoals(contextId: string): Promise<Goal[]> {
  const supabase = await createClient()
  const { data: goals, error } = await supabase
    .from('goals')
    .select('*')
    .eq('context_id', contextId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching goals', error)
    return []
  }
  return goals
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient()

  const contextId = formData.get('context_id') as string
  const name = formData.get('name') as string
  const targetAmount = parseFloat(formData.get('target_amount') as string)
  const targetDateStr = formData.get('target_date') as string
  const currentSavedStr = formData.get('current_saved_amount') as string

  const { error } = await supabase
    .from('goals')
    .insert({
      context_id: contextId,
      name,
      target_amount: targetAmount,
      target_date: targetDateStr || null,
      current_saved_amount: currentSavedStr ? parseFloat(currentSavedStr) : 0,
    })

  if (error) {
    console.error('Error creating goal', error)
    throw new Error('Failed to create goal')
  }

  revalidatePath('/objetivos')
}

export async function updateSavedAmount(id: string, formData: FormData) {
  const supabase = await createClient()

  const currentSavedAmount = parseFloat(formData.get('current_saved_amount') as string)

  const { error } = await supabase
    .from('goals')
    .update({ current_saved_amount: currentSavedAmount })
    .eq('id', id)

  if (error) {
    console.error('Error updating goal saved amount', error)
    throw new Error('Failed to update goal')
  }

  revalidatePath('/objetivos')
}

export async function deleteGoal(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('goals').delete().eq('id', id)

  if (error) {
    console.error('Error deleting goal', error)
    throw new Error('Failed to delete goal')
  }

  revalidatePath('/objetivos')
}
