import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SupabaseWarning } from '@/components/common/supabase-warning'

const modules = [
  {
    title: 'Batch Intake',
    description: 'Register new phone batches from suppliers',
    href: '/batch-intake',
    icon: '📦',
  },
  {
    title: 'Phone Tracking',
    description: 'Track phones by IMEI through the refurbishment process',
    href: '/phone-tracking',
    icon: '📱',
  },
  {
    title: 'Repair Jobs',
    description: 'Manage and assign repair tasks to technicians',
    href: '/repair-jobs',
    icon: '🔧',
  },
  {
    title: 'Inventory',
    description: 'Monitor spare parts stock levels',
    href: '/inventory',
    icon: '📊',
  },
  {
    title: 'Shipping',
    description: 'Prepare shipping manifests for completed phones',
    href: '/shipping',
    icon: '📦',
  },
  {
    title: 'Admin',
    description: 'System administration and user management',
    href: '/dashboard/admin',
    icon: '⚙️',
  },
]

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <SupabaseWarning />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to ReMobile Refurbish Management System
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Link key={module.href} href={module.href}>
            <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <span className="text-4xl">{module.icon}</span>
                  <div>
                    <CardTitle>{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Stats Section */}
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Phones</CardTitle>
            <span className="text-2xl">📱</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">In system</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Awaiting Repair</CardTitle>
            <span className="text-2xl">🔧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Phones in queue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ready to Ship</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Graded phones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <span className="text-2xl">⚠️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Parts below minimum</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 