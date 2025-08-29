import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { SupabaseWarning } from '@/components/common/supabase-warning';
import { hasDashboardAccess, getFirstAvailableModule } from '@/lib/config/route-permissions';
import DashboardMain from '@/components/dashboard/dashboard-main';



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
      <DashboardMain />
    </div>
  )
} 