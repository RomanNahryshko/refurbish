'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/hooks/use-user';
import { useProfile } from '@/lib/hooks/use-profile-optimized';
import { hasDashboardAccess, getFirstAvailableModule } from '@/lib/config/route-permissions';
import DashboardMain from '@/components/dashboard/dashboard-main';
import { RouteGuard } from '@/components/auth/route-guard';
import { LoadingSpinner } from '@/components/common/loading-spinner';
import { DebugInfo } from '@/components/common/debug-info';
import { ApiTest } from '@/components/common/api-test';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { data: profile, isLoading: profileLoading } = useProfile(!!user);

  // Check if user has dashboard access
  useEffect(() => {
    if (!userLoading && !profileLoading) {
      if (!user) {
        router.push('/login');
        return;
      }

      const userRole = profile?.role || 'technician';
      
      // If user doesn't have dashboard access, redirect to first available module
      if (!hasDashboardAccess(userRole)) {
        const firstModule = getFirstAvailableModule(userRole);
        router.push(firstModule);
        return;
      }
    }
  }, [user, profile, userLoading, profileLoading, router]);

  // Show loading state while checking authentication and permissions
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

  // If user doesn't have access, don't render anything (will redirect)
  if (profile && !hasDashboardAccess(profile.role)) {
    return null;
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="container mx-auto px-4 py-8">
        <DashboardMain />
        <DebugInfo />
        <ApiTest />
      </div>
    </RouteGuard>
  );
} 