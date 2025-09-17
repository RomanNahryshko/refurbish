'use client'

import { createSupabaseClient } from '@/lib/supabase/client'
import { LoginFormData } from '@/lib/types/business-types'

export async function loginClient(formData: LoginFormData) {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Supabase is not configured. Please set up your environment variables.' }
  }

  try {
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
      } catch (updateError) {
        // Don't fail the login if last_login update fails
      }
    }

    return { success: true, user: data.user }
  } catch (error) {
    return { error: 'An unexpected error occurred during login. Please try again.' }
  }
}

export async function logoutClient() {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Supabase client not available' }
  }

  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return { error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { error: 'An unexpected error occurred during logout.' }
  }
}

export async function getCurrentUserClient() {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return null
  }
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return null
    }
    
    if (!user) {
      return null
    }

    // Get user profile with role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return {
        ...user,
        role: 'unknown',
        status: 'unknown'
      }
    }

    return {
      ...user,
      ...profile,
    }
  } catch (error) {
    return null
  }
}

export async function updateLastLoginClient(userId: string) {
  const supabase = createSupabaseClient()
  
  if (!supabase) {
    return { error: 'Supabase client not available' }
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
  } catch (error) {
    return { error: 'Failed to update last login' }
  }
}
