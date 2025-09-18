'use client'

import { useEffect, useState } from 'react'
import { CreateUserForm } from '@/modules/admin/components/create-user-form'
import { LoadingSpinner } from '@/components/common/loading-spinner'
import { useSupabaseClient } from '@/lib/stores/supabase-store'

export default function CreateUserPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = useSupabaseClient()

  useEffect(() => {
    const getCurrentUser = async () => {
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser()
        setCurrentUserId(user?.id || null)
        
        if (user) {
          // Get user role from profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setCurrentUserRole(profile?.role || null)
        }
        
        setLoading(false)
      }
    }

    getCurrentUser()
  }, [supabase])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="md" />
          <span className="ml-2">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground mt-2">
            Add a new user to the system with appropriate role and permissions
          </p>
        </div>

        {/* Create User Form */}
        <CreateUserForm 
          currentUserId={currentUserId || undefined} 
          currentUserRole={currentUserRole || undefined}
        />

      </div>
    </div>
  )
}