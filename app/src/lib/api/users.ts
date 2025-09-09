import type { SupabaseClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient, generateTemporaryPassword } from '@/lib/supabase/admin'
import { UserRole, TechnicianLevel, UserAccountStatus, SupabaseAuthUser } from '@/lib/types/business-types'

// Enhanced types for better type safety
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

export interface UserProfile {
  id: string
  full_name: string
  role: UserRole
  status: UserAccountStatus
  technician_level?: TechnicianLevel | null
  must_change_password: boolean
  phone_number?: string
  employee_id?: string
  created_by?: string
  last_login?: string
  created_at: string
  updated_at: string
}

export interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
}

export interface UserWithAuth extends UserProfile {
  auth_user: AuthUser | null
}

/**
 * Users API with dependency injection pattern
 * Accepts Supabase client as parameter to avoid creating multiple clients
 */
export class UsersAPI {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get all users with their profiles
   * Requires ops_manager role
   */
  async getAll(filters?: UserFilters): Promise<UserWithAuth[]> {
    try {
      // Build base query
      let query = this.supabase
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
      // Note: We don't apply search filter here because we need to search both name and email

      const { data: profiles, error: profilesError } = await query

      if (profilesError) {
        throw new Error(`Failed to fetch users: ${profilesError.message}`)
      }

      if (!profiles || profiles.length === 0) {
        return []
      }

      // Try to get user emails if admin client is available
      const authUsers = await this.getAuthUsers()
      
      // Combine profile data with auth data
      const usersWithEmails = profiles.map((profile: UserProfile) => {
        const authUser = authUsers?.users.find(u => u.id === profile.id)
        return {
          ...profile,
          auth_user: authUser ? this.mapAuthUser(authUser) : null
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
    } catch (error) {
      console.error('Error in getAll:', error)
      throw error
    }
  }

  /**
   * Get a single user by ID
   * Requires ops_manager role
   */
  async getById(userId: string): Promise<UserWithAuth> {
    try {
      // Get user profile
      const { data: profile, error: profileError } = await this.supabase
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
      const authUser = await this.getAuthUserById(userId)

      return {
        ...profile,
        auth_user: authUser
      }
    } catch (error) {
      console.error('Error in getById:', error)
      throw error
    }
  }

  /**
   * Create a new user account
   * Requires service role key - admin operation
   */
  async create(userData: CreateUserData, performedBy: string) {
    try {
      const adminClient = createSupabaseAdminClient()
      if (!adminClient) {
        throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
      }

      // Generate temporary password if not provided
      const temporaryPassword = userData.temporary_password || generateTemporaryPassword()

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
        created_by: performedBy,
        created_at: new Date().toISOString()
      }

      const { data: profile, error: profileError } = await adminClient
        .from('user_profiles')
        .insert(profileData)
        .select()
        .single()

      if (profileError) {
        throw new Error(`Failed to create user profile: ${profileError.message}`)
      }

      return {
        ...profile,
        auth_user: {
          id: authUser.user.id,
          email: authUser.user.email,
          created_at: authUser.user.created_at
        },
        temporaryPassword
      }
    } catch (error) {
      console.error('Error in create:', error)
      throw new Error(`User creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update user profile information
   * Requires ops_manager role
   */
  async update(userId: string, userData: UpdateUserData, _performedBy: string): Promise<UserProfile> {
    try {
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
      const { data: updateData, error } = await this.supabase
        .from('user_profiles')
        .update(updatePayload)
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update user: ${error.message}`)
      }

      return updateData
    } catch (error) {
      console.error('Error in update:', error)
      throw error
    }
  }

  /**
   * Disable/Enable user account
   * Requires ops_manager role
   */
  async updateStatus(userId: string, status: UserAccountStatus, _performedBy: string): Promise<UserProfile> {
    try {
      const { data: statusData, error } = await this.supabase
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
    } catch (error) {
      console.error('Error in updateStatus:', error)
      throw error
    }
  }

  /**
   * Reset user password (will trigger password reset email)
   * Requires service role key
   */
  async resetPassword(userId: string, _email: string, _performedBy: string) {
    try {
      const adminClient = createSupabaseAdminClient()
      if (!adminClient) {
        throw new Error('Admin client not configured. Set SUPABASE_SERVICE_ROLE_KEY environment variable.')
      }

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
      console.error('Error in resetPassword:', error)
      throw new Error(`Password reset failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get auth users from admin client
   */
  private async getAuthUsers() {
    try {
      const adminClient = createSupabaseAdminClient()
      if (!adminClient) return null
      
      const { data, error } = await adminClient.auth.admin.listUsers()
      if (error) {
        console.warn('Could not fetch auth users:', error)
        return null
      }
      
      return data
    } catch (error) {
      console.warn('Error fetching auth users:', error)
      return null
    }
  }

  /**
   * Get single auth user by ID
   */
  private async getAuthUserById(userId: string): Promise<AuthUser | null> {
    try {
      const adminClient = createSupabaseAdminClient()
      if (!adminClient) return null
      
      const { data, error } = await adminClient.auth.admin.getUserById(userId)
      if (error || !data) {
        console.warn('Could not fetch auth user data:', error?.message)
        return null
      }
      
      return this.mapAuthUser(data.user)
    } catch (error) {
      console.warn('Error fetching auth user:', error)
      return null
    }
  }

  /**
   * Map auth user to our interface
   */
  private mapAuthUser(authUser: SupabaseAuthUser): AuthUser {
    return {
      id: authUser.id,
      email: authUser.email || '',
      created_at: authUser.created_at || new Date().toISOString(),
      last_sign_in_at: authUser.last_sign_in_at,
      email_confirmed_at: authUser.email_confirmed_at
    }
  }
}

/**
 * Factory function to create UsersAPI instance with client
 * This maintains backward compatibility while implementing dependency injection
 */
export function createUsersAPI(supabase: SupabaseClient): UsersAPI {
  return new UsersAPI(supabase)
}

/**
 * Legacy singleton instance for backward compatibility
 * @deprecated Use createUsersAPI() with dependency injection instead
 */
import { createSupabaseClient } from '@/lib/supabase/client'
export const usersApi = new UsersAPI(createSupabaseClient()!)
