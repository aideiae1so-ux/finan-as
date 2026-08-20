'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { seedDefaultCategories } from '@/modules/categories/seed'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/login?error=Invalid credentials')
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: authData, error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/login?error=Could not authenticate user')
  }

  // Se a confirmação de e-mail estiver ativa no projeto Supabase, ainda não existe
  // sessão neste ponto (RLS exige auth.uid()). Nesse caso o contexto pessoal é criado
  // sob demanda no primeiro acesso autenticado, via getOrCreatePersonalContext().
  if (authData.session && authData.user) {
    const { data: context, error: ctxError } = await supabase
      .from('contexts')
      .insert({
        user_id: authData.user.id,
        type: 'PERSONAL',
        name: 'Pessoal',
      })
      .select()
      .single()

    if (!ctxError && context) {
      await seedDefaultCategories(supabase, context.id, 'PERSONAL')
    } else {
      console.error('Error creating personal context on signup', ctxError)
    }

    revalidatePath('/', 'layout')
    redirect('/admin')
  }

  // Projeto com confirmação de e-mail ativa: não há sessão ainda, então mandar para
  // /admin só devolveria o usuário para /login sem explicação nenhuma.
  redirect('/login?message=' + encodeURIComponent('Cadastro realizado! Verifique seu e-mail para confirmar a conta antes de entrar.'))
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
