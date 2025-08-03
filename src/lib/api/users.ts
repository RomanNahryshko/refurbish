import { createClient } from '@/lib/supabase/client'
import { createAdminClient, generateTemporaryPassword } from '@/lib/supabase/admin'
import { User, UserAudit } from '@/lib/types/business-types'

// Types for user management
export interface CreateUserData {
  email: string
  full_name: string
  role: 'data_entry' | 'qc_controller' | 'technician' | 'ops_manager'
  temporary_password?: string
}

export interface UpdateUserData {
  full_name?: string
  role?: 'data_entry' | 'qc_controller' | 'technician' | 'ops_manager'
  status?: string
}

export interface UserFilters {
  role?: string
  status?: string
  search?: string
}

export const usersApi = {
  /**
   * Get all users with their profiles
   * Requires ops_manager role
   */
  async getAll(filters?: UserFilters) {
    const adminClient = createAdminClient()
    if (!adminClient) {
      throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }

    // Get user profiles
    let query = adminClient
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role,
        status,
        must_change_password,
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

    // Get user emails from auth.users using admin client
    const { data: authUsers, error: authError } = await adminClient.auth.admin.listUsers()

    if (authError) {
      console.error('Error fetching auth users:', authError)
      throw new Error(`Failed to fetch user emails: ${authError.message}`)
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
    const adminClient = createAdminClient()
    if (!adminClient) {
      throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
    }

    // Get user profile
    const { data: profile, error: profileError } = await adminClient
      .from('user_profiles')
      .select(`
        id,
        full_name,
        role,
        status,
        must_change_password,
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

    // Get auth user data
    const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(userId)

    if (authError) {
      console.warn('Could not fetch auth user data:', authError.message)
    }

    return {
      ...profile,
      auth_user: authUser.user ? {
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
      const profileData: any = {
        id: authUser.user.id,
        full_name: userData.full_name,
        role: userData.role,
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

      // Log the action
      await this.logAuditAction({
        user_id: authUser.user.id,
        action: 'create_user',
        performed_by: performedBy,
        details: { 
          email: userData.email,
          role: userData.role,
          full_name: userData.full_name
        }
      })

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
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    // Update user profile
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...userData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`)
    }

    // Log the action for audit trail
    await this.logAuditAction({
      user_id: userId,
      action: 'update_user',
      performed_by: performedBy,
      details: { updated_fields: Object.keys(userData) }
    })

    return data
  },

  /**
   * Disable/Enable user account
   * Requires ops_manager role
   */
  async updateStatus(userId: string, status: 'active' | 'disabled', performedBy: string) {
    const supabase = createClient()
    if (!supabase) throw new Error('Supabase client not initialized')

    const { data, error } = await supabase
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

    // Log the action
    await this.logAuditAction({
      user_id: userId,
      action: status === 'active' ? 'enable_user' : 'disable_user',
      performed_by: performedBy,
      details: { new_status: status }
    })

    return data
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
      const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
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

      // Log the action
      await this.logAuditAction({
        user_id: userId,
        action: 'reset_password',
        performed_by: performedBy,
        details: { email }
      })

      return {
        success: true,
        temporaryPassword: newPassword
      }
    } catch (error) {
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  /**
   * Get user audit logs
   * Requires ops_manager role
   */
  async getAuditLogs(userId?: string, limit: number = 50) {
    const adminClient = createAdminClient()
    if (!adminClient) throw new Error('Admin client not initialized')

    // Get audit logs without relationships first
    let query = adminClient
      .from('user_audit')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: auditLogs, error } = await query

    if (error) {
      throw new Error(`Failed to fetch audit logs: ${error.message}`)
    }

    if (!auditLogs || auditLogs.length === 0) {
      return []
    }

    // Get all unique user IDs from the audit logs
    const userIds = Array.from(new Set([
      ...auditLogs.map(log => log.user_id),
      ...auditLogs.map(log => log.performed_by).filter(Boolean)
    ]))

    // Get user profiles for these IDs
    const { data: userProfiles } = await adminClient
      .from('user_profiles')
      .select('id, full_name')
      .in('id', userIds)

    // Map profiles by ID for quick lookup
    const profileMap = new Map()
    userProfiles?.forEach(profile => {
      profileMap.set(profile.id, profile)
    })

    // Enhance audit logs with user information
    const enhancedLogs = auditLogs.map(log => ({
      ...log,
      user: profileMap.get(log.user_id),
      performer: profileMap.get(log.performed_by)
    }))

    return enhancedLogs
  },

  /**
   * Log an audit action
   * Internal function for tracking admin actions
   */
  async logAuditAction(auditData: {
    user_id: string
    action: string
    performed_by: string
    details?: Record<string, unknown>
  }) {
    const adminClient = createAdminClient()
    if (!adminClient) return // Fail silently for audit logs

    // Only log if performed_by is a valid UUID
    if (!auditData.performed_by || 
        auditData.performed_by === 'unknown-admin' || 
        !auditData.performed_by.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      console.warn('Skipping audit log - invalid performer UUID:', auditData.performed_by)
      return
    }

    const { error } = await adminClient
      .from('user_audit')
      .insert({
        user_id: auditData.user_id,
        action: auditData.action,
        performed_by: auditData.performed_by,
        details: auditData.details || {},
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log audit action:', error.message)
    }
  }
}