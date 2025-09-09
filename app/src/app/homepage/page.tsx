'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/lib/hooks/use-user';
import { RouteGuard } from '@/components/auth/route-guard';
import { LoadingSpinner } from '@/components/common/loading-spinner';

// First row - 5 main modules
const firstRowModules = [
  {
    title: 'Batch Intake',
    description: 'Import new devices',
    href: '/batch-intake',
    icon: '📦',
  },
  {
    title: 'Dashboard',
    description: 'Overview & metrics',
    href: '/dashboard',
    icon: '📈',
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

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();

  // Check if user is authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Show loading state while checking authentication
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  // If no user, don't render anything (will redirect)
  if (!user) {
    return null;
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="container mx-auto p-6">
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
    </RouteGuard>
  );
}
