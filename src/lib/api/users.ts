import { createClient } from '@/lib/supabase/server'
import { createAdminClient, generateTemporaryPassword } from '@/lib/supabase/admin'
import { UserRole, TechnicianLevel, UserAccountStatus } from '@/lib/types/business-types'

// Types for user management - matches database schema exactly
export interface CreateUserData {
  email: string
  full_name: string
  role: UserRole
  technician_level?: TechnicianLevel
  temporary_password?: string
}

export interface UpdateUserData {
  full_name?: string
  role?: UserRole
  technician_level?: TechnicianLevel | null
  status?: UserAccountStatus
}

export interface UserFilters {
  role?: UserRole
  status?: UserAccountStatus
  search?: string
}

export const usersApi = {
  /**
   * Get all users with their profiles
   * Requires ops_manager role
   */
  async getAll(filters?: UserFilters) {
    const supabase = await createClient()

    // Get user profiles
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role,
        status,
        technician_level,
        must_change_password,
        phone_number,
        employee_id,
        created_by,
        last_login,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters?.role) {
      query = query.eq('role', filters.role)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.search) {
      // Search in full_name
      query = query.ilike('full_name', `%${filters.search}%`)
    }

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError)
      throw new Error(`Failed to fetch users: ${profilesError.message}`)
    }

    if (!profiles || profiles.length === 0) {
      return []
    }

    // Try to get user emails if admin client is available
    const adminClient = createAdminClient()
    let authUsers = null
    
    if (adminClient) {
      const { data, error: authError } = await adminClient.auth.admin.listUsers()
      if (!authError) {
        authUsers = data
      } else {
        console.warn('Could not fetch auth users:', authError)
      }
    }

    // If we couldn't get auth users, continue without email data
    if (!authUsers) {
      return profiles.map(profile => ({
        ...profile,
        auth_user: null
      }))
    }

    // Combine profile data with auth data
    const usersWithEmails = profiles.map(profile => {
      const authUser = authUsers.users.find(u => u.id === profile.id)
      return {
        ...profile,
        auth_user: authUser ? {
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at
        } : null
      }
    })

    // Apply email search filter if needed
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase()
      return usersWithEmails.filter(user => 
        (user.full_name && String(user.full_name).toLowerCase().includes(searchLower)) ||
        (user.auth_user?.email && user.auth_user.email.toLowerCase().includes(searchLower))
      )
    }

    return usersWithEmails
  },

  /**
   * Get a single user by ID
   * Requires ops_manager role
   */
  async getById(userId: string) {
    const supabase = await createClient()

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role,
        status,
        technician_level,
        must_change_password,
        phone_number,
        employee_id,
        created_by,
        last_login,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single()

    if (profileError) {
      throw new Error(`Failed to fetch user: ${profileError.message}`)
    }

    // Try to get auth user data if admin client is available
    const adminClient = createAdminClient()
    let authUser = null
    
    if (adminClient) {
      const { data, error: authError } = await adminClient.auth.admin.getUserById(userId)
      if (!authError && data) {
        authUser = data
      } else {
        console.warn('Could not fetch auth user data:', authError?.message)
      }
    }

    return {
      ...profile,
      auth_user: authUser?.user ? {
        email: authUser.user.email,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        email_confirmed_at: authUser.user.email_confirmed_at
      } : null
    }
  },

  /**
   * Create a new user account
   * Requires service role key - admin operation
   */
  async create(userData: CreateUserData, performedBy: string) {
    const adminClient = createAdminClient()
    if (!adminClient) {
      throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }

    // Generate temporary password if not provided
    const temporaryPassword = userData.temporary_password || generateTemporaryPassword()

    try {
      // Create user in auth.users table
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        email: userData.email,
        password: temporaryPassword,
        email_confirm: true, // Auto-confirm email for admin-created users
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      })

      if (authError) {
        throw new Error(`Failed to create auth user: ${authError.message}`)
      }

      if (!authUser.user) {
        throw new Error('Failed to create user - no user returned')
      }

      // Create user profile
      const profileData: Record<string, unknown> = {
        id: authUser.user.id,
        full_name: userData.full_name,
        role: userData.role,
        technician_level: userData.role === 'technician' ? (userData.technician_level || 'L1') : null,
        status: 'active',
        must_change_password: true, // Force password change on first login
        created_at: new Date().toISOString()
      }

      // Only add created_by if it's a valid UUID
      if (performedBy && performedBy !== 'unknown-admin' && performedBy.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        profileData.created_by = performedBy
      }

      const { data: profile, error: profileError } = await adminClient
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        // Cleanup: delete the auth user if profile creation fails
        await adminClient.auth.admin.deleteUser(authUser.user.id)
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      return {
        user: {
          ...profile,
          email: authUser.user.email
        },
        temporaryPassword
      }
    } catch (error) {
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Update user profile information
   * Requires ops_manager role
   */
  async update(userId: string, userData: UpdateUserData, performedBy: string) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Prepare update data with technician_level constraint handling
    const updatePayload: Record<string, unknown> = {
      ...userData,
      updated_at: new Date().toISOString()
    }

    // Handle technician_level constraint
    if (userData.role) {
      if (userData.role === 'technician') {
        // If changing to technician, ensure technician_level is set
        updatePayload.technician_level = userData.technician_level || 'L1'
      } else {
        // If changing from technician to other role, clear technician_level
        updatePayload.technician_level = null
      }
    }

    // Update user profile
    const { data: updateData, error } = await supabase
      .from('user_profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    return updateData
  },

  /**
   * Disable/Enable user account
   * Requires ops_manager role
   */
  async updateStatus(userId: string, status: UserAccountStatus, performedBy: string) {
    const supabase = await createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data: statusData, error } = await supabase
      .from('user_profiles')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user status: ${error.message}`)
    }

    return statusData
  },

  /**
   * Reset user password (will trigger password reset email)
   * Requires service role key
   */
  async resetPassword(userId: string, email: string, performedBy: string) {
    const adminClient = createAdminClient()
    if (!adminClient) {
      throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }

    try {
      // Generate new temporary password
      const newPassword = generateTemporaryPassword()

      // Update user password using admin API
      const { error } = await adminClient.auth.admin.updateUserById(userId, {
        password: newPassword
      })

      if (error) {
        throw new Error(`Failed to reset password: ${error.message}`)
      }

      // Mark user to change password on next login
      await adminClient
        .from('user_profiles')
        .update({ 
          must_change_password: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      return {
        success: true,
        temporaryPassword: newPassword
      }
    } catch (error) {
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}