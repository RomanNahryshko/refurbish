'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function Footer() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
      setLoading(false)
      return
    }

    const getUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('id', user.id)
            .single()
          
          setUserRole(profile?.role || null)
        }
      } catch (error) {
        console.error('Error fetching user role:', error)
      } finally {
        setLoading(false)
      }
    }

    getUserRole()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      getUserRole()
    })

    return () => subscription.unsubscribe()
  }, [])

  const isAdmin = userRole === 'ops_manager'

  return (
    <footer className="border-t">
      <div className="container flex h-24 items-center">
        <div className="flex w-full items-center justify-between">
          <p className="text-sm text-muted-foreground">
            © 2025 ReMobile Refurbish. All rights reserved.
          </p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {isAdmin && (
              <Link href="/admin" className="hover:text-foreground transition-colors cursor-pointer">
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
} 