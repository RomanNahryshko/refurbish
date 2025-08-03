import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AdminPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            System administration and user management
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* User Management Card */}
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Create, edit, and manage user accounts and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/admin/users">
                  <Button className="w-full" variant="default">
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/users/create">
                  <Button className="w-full" variant="outline">
                    Create New User
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Settings Card (Future) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>
                Configure system-wide settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          {/* Reports & Analytics Card (Future) */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                View system usage and performance reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="secondary" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}