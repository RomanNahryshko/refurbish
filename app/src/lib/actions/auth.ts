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

  try {
    // Clear any existing auth cookies before login to prevent conflicts
    const cookies = await import('next/headers')
    const cookieStore = await cookies.cookies()
    
    // Clear existing auth cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      return { error: error.message }
    }
    
    // Update last_login timestamp in user_profiles
    if (data.user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            last_login: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user.id)
        
        if (updateError) {
          // Don't fail the login if last_login update fails
        }
      } catch {
        // Don't fail the login if last_login update fails
      }
    }

    revalidatePath('/', 'layout')
    
    // Force revalidate all paths to clear any cached redirects
    try {
      revalidatePath('/dashboard', 'page')
      revalidatePath('/login', 'page')
    } catch {
      // Ignore revalidation errors
    }
    
    // Return success instead of redirecting
    // The client component will handle the redirect
    return { success: true, user: data.user }
  } catch {
    return { error: 'An unexpected error occurred during login. Please try again.' }
  }
}

export async function logout() {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    redirect('/login')
  }

  const { error } = await supabase.auth.signOut()

  if (error) {
    // Ignore logout errors
  }

  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function updateLastLogin(userId: string) {
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    return { error: 'Supabase not configured' }
  }

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ 
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
    
    if (error) {
      return { error: error.message }
    }
    
    return { success: true }
  } catch {
    return { error: 'Failed to update last login' }
  }
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