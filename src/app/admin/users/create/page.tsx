'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { CreateUserForm } from '@/modules/admin/components/create-user-form'
import { LoadingSpinner } from '@/components/common/loading-spinner'

export default function CreateUserPage() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New User</h1>
          <p className="text-muted-foreground mt-2">
            Add a new user to the system with appropriate role and permissions
          </p>
        </div>

        {/* Create User Form */}
        <CreateUserForm currentUserId={currentUserId || undefined} />

        {/* Navigation */}
        <div className="flex gap-4">
          <Link href="/admin/users">
            <Button variant="outline">← Back to Users</Button>
          </Link>
          <Link href="/admin">
            <Button variant="ghost">Admin Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}