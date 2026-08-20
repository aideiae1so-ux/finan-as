// Sem 'use server': isto nunca é chamado como action vinculada a um form/client
// component, só de outros Server Components — e o wrapper cache() abaixo não é uma
// "async function" pura, que é o único shape que um arquivo 'use server' pode exportar.
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { seedDefaultCategories } from '@/modules/categories/seed'

// Todo usuário deve ter um contexto PERSONAL. Contas criadas antes desse contexto
// existir na assinatura (ou que falharam nesse passo) o recebem aqui, sob demanda.
//
// Isso é chamado tanto pelo layout do dashboard quanto por páginas individuais no
// mesmo request; `cache()` garante que as chamadas concorrentes dentro de um mesmo
// request dividam a mesma promise em vez de correrem em paralelo e criarem contextos
// pessoais duplicados (o que fazia lançamentos "sumirem": eram salvos sob um contexto
// que a página seguinte já não resolvia mais). `.order().limit(1)` também torna a
// busca determinística (sempre o contexto mais antigo) caso já existam duplicatas.
export const getOrCreatePersonalContext = cache(async (): Promise<string | null> => {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) return null

  const { data: existing } = await supabase
    .from('contexts')
    .select('id')
    .eq('user_id', userData.user.id)
    .eq('type', 'PERSONAL')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id

  const { data: created, error } = await supabase
    .from('contexts')
    .insert({
      user_id: userData.user.id,
      type: 'PERSONAL',
      name: 'Pessoal',
    })
    .select()
    .single()

  if (error || !created) {
    console.error('Error creating personal context', error)
    return null
  }

  await seedDefaultCategories(supabase, created.id, 'PERSONAL')

  return created.id
})
