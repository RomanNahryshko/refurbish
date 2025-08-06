'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export function Footer() {
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) {
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
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Copyright text with proper spacing */}
          <div className="flex items-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ReMobile Refurbish. All rights reserved.
            </p>
          </div>
          
          {/* Right side navigation */}
          <nav className="flex items-center space-x-6">
            {isAdmin && (
              <Link 
                href="/admin" 
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}
          </nav>
        </div>
      </div>
    </footer>
  )
}