'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { seedDefaultCategories } from '@/modules/categories/seed'

export async function getCondominiums() {
  const supabase = await createClient()
  const { data: condominiums, error } = await supabase
    .from('condominiums')
    .select('*, contexts!inner(*)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching condominiums', error)
    return []
  }
  return condominiums
}

export async function createCondominium(formData: FormData) {
  const supabase = await createClient()
  
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) throw new Error('Not authenticated')

  const name = formData.get('name') as string
  const cnpj = formData.get('cnpj') as string
  const active = formData.get('active') === 'on'

  // 1. Create Context
  const { data: context, error: ctxError } = await supabase
    .from('contexts')
    .insert({
      user_id: userData.user.id,
      type: 'CONDOMINIUM',
      name: name
    })
    .select()
    .single()

  if (ctxError || !context) {
    console.error('Error creating context', ctxError)
    throw new Error('Failed to create context')
  }

  // 2. Create Condominium linked to Context
  const { error: condError } = await supabase
    .from('condominiums')
    .insert({
      context_id: context.id,
      name,
      cnpj,
      active
    })

  if (condError) {
    console.error('Error creating condominium', condError)
    throw new Error('Failed to create condominium')
  }

  await seedDefaultCategories(supabase, context.id, 'CONDOMINIUM')

  revalidatePath('/admin/empresas')
  revalidatePath('/admin')
}
