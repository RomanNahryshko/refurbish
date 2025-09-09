'use client'

import Link from 'next/link'
import { use } from 'react'
import { Button } from '@/components/ui/button'
import { EditUserForm } from '@/modules/admin/components/edit-user-form'
import { useUser } from '@/lib/hooks/use-user'

interface EditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default function EditUserPage({ params }: EditUserPageProps) {
  const { id } = use(params)
  const { user } = useUser()
  const currentUserId = user?.id || null
  const currentUserRole = user?.role || null

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
        <EditUserForm 
          userId={id} 
          currentUserId={currentUserId || undefined} 
          currentUserRole={currentUserRole || undefined}
        />

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