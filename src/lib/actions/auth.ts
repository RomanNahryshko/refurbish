'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LoginFormData } from '@/lib/types/business-types'

export async function login(formData: LoginFormData) {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return { error: 'Supabase is not configured. Please set up your environment variables.' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/', 'layout')
  
  // Return success instead of redirecting
  // The client component will handle the redirect
  return { success: true }
}

export async function logout() {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    redirect('/login')
    return
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return null
  }
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return null
  }

  // Get user profile with role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return {
    ...user,
    ...profile,
  }
} 