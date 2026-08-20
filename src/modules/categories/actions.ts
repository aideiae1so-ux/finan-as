'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getCategories(contextId: string) {
  const supabase = await createClient()
  const { data: categories, error } = await supabase
    .from('categories')
    .select('*')
    .eq('context_id', contextId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching categories', error)
    return []
  }
  return categories
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const type = formData.get('type') as 'INCOME' | 'EXPENSE'
  const contextId = formData.get('context_id') as string

  const { error } = await supabase
    .from('categories')
    .insert({
      context_id: contextId,
      name,
      type
    })

  if (error) {
    console.error('Error creating category', error)
    throw new Error('Failed to create category')
  }

  revalidatePath('/configuracoes/categorias')
}
