'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { UserList } from '@/modules/admin/components/user-list'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function UsersPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id || null)
      setLoading(false)
    }

    getCurrentUser()
  }, [])

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage user accounts, roles, and permissions
            </p>
          </div>
          <Link href="/admin/users/create">
            <Button>Create New User</Button>
          </Link>
        </div>

        {/* User List Component */}
        <UserList currentUserId={currentUserId || undefined} />

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/admin">
            <Button variant="outline">← Back to Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}