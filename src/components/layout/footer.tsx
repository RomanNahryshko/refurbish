'use client'

import Link from 'next/link'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUser } from '@/lib/hooks/use-user'

export function Footer() {
  const { user } = useUser()
  const { data: profile } = useProfile(!!user)

  const isAdmin = profile?.role === 'admin'

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