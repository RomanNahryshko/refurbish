'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.replace('/login')
          return
        }

        setUser(user)

        // Get user role
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setUserRole(profile?.role || null)
        } catch (error) {
          console.error('Error fetching user role:', error)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to ReMobile Refurbish
          </h1>
          <p className="mt-2 text-gray-600">
            Internal ERP System
          </p>
          {userRole && (
            <p className="mt-2 text-sm text-blue-600 font-medium">
              Role: {userRole.replace('_', ' ').toUpperCase()}
            </p>
          )}
        </div>

        {userRole === 'technician' && (
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📱 Devices
                </CardTitle>
                <CardDescription>
                  View and manage device repairs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/devices')}
                  className="w-full"
                >
                  Go to Devices
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔧 Repair Jobs
                </CardTitle>
                <CardDescription>
                  View and update your repair assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => router.push('/repair-jobs')}
                  className="w-full"
                >
                  Go to Repair Jobs
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {userRole && userRole !== 'technician' && (
          <div className="text-center">
            <Card>
              <CardHeader>
                <CardTitle>Welcome!</CardTitle>
                <CardDescription>
                  Use the navigation menu to access available features for your role.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}

        {!userRole && (
          <div className="text-center">
            <Card>
              <CardHeader>
                <CardTitle>Loading...</CardTitle>
                <CardDescription>
                  Getting your role information...
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
