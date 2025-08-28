import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SupabaseWarning } from '@/components/common/supabase-warning';

// First row - 5 main modules
const firstRowModules = [
  {
    title: 'Dashboard',
    description: 'View operational metrics',
    href: '/dashboard',
    icon: '📊',
  },
  {
    title: 'Batch Intake',
    description: 'Register new batches',
    href: '/batch-intake',
    icon: '📦',
  },
  {
    title: 'Devices',
    description: 'Track by IMEI',
    href: '/devices',
    icon: '📱',
  },
  {
    title: 'Repair Jobs',
    description: 'Manage repairs',
    href: '/repair-jobs',
    icon: '🔧',
  },
  {
    title: 'Quality Control',
    description: 'Final QC & grading',
    href: '/qc',
    icon: '📋',
  },
];

// Second row - 2 additional modules
const secondRowModules = [
  {
    title: 'Inventory',
    description: 'Parts stock levels',
    href: '/inventory',
    icon: '📊',
  },
  {
    title: 'Admin',
    description: 'User management',
    href: '/admin',
    icon: '⚙️',
  },
];

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  
  if (!supabase) {
    redirect('/login');
  }
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto p-6">
      <SupabaseWarning />
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome to ReMobile Refurbish</h1>
        <p className="text-muted-foreground">
          Select a module to get started
        </p>
      </div>

      <div className="space-y-6">
        {/* First row - 5 main modules */}
        <div className="grid gap-6 grid-cols-5">
          {firstRowModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-4">
                    <span className="text-5xl">{module.icon}</span>
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription className="mt-2">{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>

        {/* Second row - 2 additional modules (wider cards) */}
        <div className="grid gap-6 grid-cols-2 max-w-5xl mx-auto">
          {secondRowModules.map((module) => (
            <Link key={module.href} href={module.href}>
              <Card className="h-full transition-colors hover:bg-accent/50 cursor-pointer">
                <CardHeader>
                  <div className="flex flex-col items-center text-center gap-4">
                    <span className="text-5xl">{module.icon}</span>
                    <div>
                      <CardTitle>{module.title}</CardTitle>
                      <CardDescription className="mt-2">{module.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
