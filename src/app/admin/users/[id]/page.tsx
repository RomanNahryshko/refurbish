'use client'

import Link from 'next/link'
import { useEffect, useState, use } from 'react'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { EditUserForm } from '@/modules/admin/components/edit-user-form'
import { LoadingSpinner } from '@/components/common/loading-spinner'

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params)
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground mt-2">
            View and manage user information, role, and account status
          </p>
        </div>

        {/* Edit User Form */}
        <EditUserForm userId={id} currentUserId={currentUserId || undefined} />

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