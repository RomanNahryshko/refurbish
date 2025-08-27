import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseWarning } from '@/components/common/supabase-warning';
import { hasDashboardAccess, getFirstAvailableModule } from '@/lib/config/route-permissions';
import { PasswordStatusChecker } from '@/components/auth/password-status-checker';

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
          href: '/devices',
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
    href: '/admin',
    icon: '⚙️',
  },
]

const dashboardCards = [
  {
    title: "Total Phones",
    value: "0",
    description: "In system",
    icon: "📱",
  },
  {
    title: "Awaiting Repair",
    value: "0",
    description: "Phones in queue",
    icon: "🔧",
  },
  {
    title: "Ready to Ship",
    value: "0",
    description: "Graded phones",
    icon: "✅",
  },
  {
    title: "Low Stock Items",
    value: "0",
    description: "Parts below minimum",
    icon: "⚠️",
  },
];

export default async function DashboardPage() {
  // Check if user has dashboard access
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    // If Supabase is not configured, redirect to login
    redirect('/login');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = profile?.role || 'technician';
  
  // If user doesn't have dashboard access, redirect to first available module
  if (!hasDashboardAccess(userRole)) {
    const firstModule = getFirstAvailableModule(userRole);
    redirect(firstModule);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SupabaseWarning />
      
      {/* Client-side password status checker */}
      <PasswordStatusChecker />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening in your system.</p>
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
        {dashboardCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <span className="text-2xl">{card.icon}</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 