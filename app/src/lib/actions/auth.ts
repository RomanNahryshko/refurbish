'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import { LoginFormData } from '@/lib/types/business-types'

export async function login(formData: LoginFormData) {
  console.log('🔐 Login action started with:', { email: formData.email })
  
  const supabase = await createSupabaseServerClient()
  
  if (!supabase) {
    console.error('❌ Supabase server client creation failed')
    return { error: 'Supabase is not configured. Please set up your environment variables.' }
  }

  console.log('✅ Supabase server client created successfully')

  try {
    // Clear any existing auth cookies before login to prevent conflicts
    console.log('🧹 Clearing existing auth cookies...')
    const cookies = await import('next/headers')
    const cookieStore = await cookies.cookies()
    
    // Log all cookies before clearing
    const allCookies = cookieStore.getAll()
    console.log('🍪 All cookies before clearing:', allCookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))
    
    // Clear existing auth cookies
    cookieStore.delete('sb-access-token')
    cookieStore.delete('sb-refresh-token')
    console.log('✅ Auth cookies cleared')
    
    console.log('🔑 Attempting to sign in with password...')
    const { data, error } = await supabase.auth.signInWithPassword({
      email: formData.email,
      password: formData.password,
    })

    if (error) {
      console.error('❌ Supabase auth error:', error)
      return { error: error.message }
    }

    console.log('✅ Supabase auth successful, user:', data.user?.id)
    console.log('📧 User email:', data.user?.email)
    
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
          console.error('⚠️ Failed to update last_login:', updateError)
          // Don't fail the login if last_login update fails
        } else {
          console.log('✅ Last login timestamp updated successfully')
        }
      } catch (updateError) {
        console.error('⚠️ Error updating last_login:', updateError)
        // Don't fail the login if last_login update fails
      }
    }
    
    // Log cookies after successful login
    const cookiesAfterLogin = cookieStore.getAll()
    console.log('🍪 All cookies after login:', cookiesAfterLogin.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })))

    revalidatePath('/', 'layout')
    console.log('✅ Path revalidated')
    
    // Force revalidate all paths to clear any cached redirects
    try {
      revalidatePath('/dashboard', 'page')
      revalidatePath('/login', 'page')
      console.log('✅ All paths revalidated')
    } catch (revalidateError) {
      console.warn('⚠️ Path revalidation warning:', revalidateError)
    }
    
    // Return success instead of redirecting
    // The client component will handle the redirect
    console.log('✅ Login action completed successfully')
    return { success: true, user: data.user }
  } catch (error) {
    console.error('❌ Unexpected error in login action:', error)
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
    console.error('Logout error:', error)
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