'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useUser } from '@/lib/hooks/use-user';
import { useProfile } from '@/lib/hooks/use-profile';
import { useUIPermissions } from '@/lib/hooks/use-permissions';
import { RouteGuard } from '@/components/auth/route-guard';
import { LoadingSpinner } from '@/components/common/loading-spinner';

interface HomepageModule {
  title: string
  description: string
  href: string
  icon: string
  showIf?: (permissions: ReturnType<typeof useUIPermissions>) => boolean
}

const allModules: HomepageModule[] = [
  {
    title: 'Dashboard',
    description: 'Overview & metrics',
    href: '/dashboard',
    icon: '📈',
    showIf: (perms) => perms.isAdmin || perms.isGeneralManager
  },
  {
    title: 'Batch Intake',
    description: 'Import new devices',
    href: '/batch-intake',
    icon: '📦',
    showIf: (perms) => perms.canCreateBatches
  },
  {
    title: 'Devices',
    description: 'Track by IMEI',
    href: '/devices',
    icon: '📱',
    showIf: (perms) => perms.canViewDevices
  },
  {
    title: 'Repair Jobs',
    description: 'Manage repairs',
    href: '/repair-jobs',
    icon: '🔧',
    showIf: (perms) => perms.canViewRepairJobs && !perms.isQC
  },
  {
    title: 'Quality Control',
    description: 'Final QC & grading',
    href: '/qc',
    icon: '📋',
    showIf: (perms) => perms.canViewQC
  },
  {
    title: 'Inventory',
    description: 'Parts stock levels',
    href: '/inventory',
    icon: '📊',
    showIf: (perms) => perms.canViewInventory && !perms.isOpsManager && !perms.isTechnician
  },
  {
    title: 'Admin',
    description: 'User management',
    href: '/admin',
    icon: '⚙️',
    showIf: (perms) => perms.isAdmin || perms.isGeneralManager
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile(!!user);
  const permissions = useUIPermissions(profile || null);

  // Check if user is authenticated
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/login');
    }
  }, [user, userLoading, router]);

  // Filter modules based on user permissions
  const availableModules = allModules.filter(module => {
    if (module.showIf) {
      return module.showIf(permissions);
    }
    return true;
  });

  // Show loading state while checking authentication and profile
  if (userLoading || profileLoading) {
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
          {/* Dynamic grid based on available modules */}
          <div className={`grid gap-6 ${
            availableModules.length <= 2 
              ? 'grid-cols-1 md:grid-cols-2'
              : availableModules.length <= 4
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
              : availableModules.length <= 6
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
              : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6'
          }`}>
            {availableModules.map((module) => (
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
