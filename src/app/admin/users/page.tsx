'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { UserList } from '@/modules/admin/components/user-list'
import { useUser } from '@/lib/hooks/use-user'

export default function UsersPage() {
  const { user } = useUser()
  const currentUserId = user?.id || null

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