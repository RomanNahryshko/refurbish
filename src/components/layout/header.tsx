'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Batch Intake', href: '/batch-intake' },
  { name: 'Phone Tracking', href: '/phone-tracking' },
  { name: 'Repair Jobs', href: '/repair-jobs' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Shipping', href: '/shipping' },
]

export function Header() {
  const pathname = usePathname()
  const [user, setUser] = useState<{
    id: string;
    email: string;
    full_name?: string;
    role?: string;
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch {
      // Force redirect even if there's an error
      window.location.href = '/login'
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const supabase = createClient()

    const getUser = async (authUser: { id: string; email: string } | null) => {
      if (authUser) {
        // Get user profile for full name and role with timeout fallback
        try {
          const profilePromise = supabase
            .from('user_profiles')
            .select('full_name, role')
            .eq('id', authUser.id)
            .single()

          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Profile fetch timeout')), 3000)
          )

          const result = await Promise.race([profilePromise, timeoutPromise])
          const { data: profile, error } = result as { data: { full_name?: string; role?: string } | null; error: any }
          
          if (error) {
            // If profile fetch fails, still show user with email
            setUser({
              ...authUser,
              full_name: authUser.email?.split('@')[0] || 'User',
              role: 'unknown'
            })
          } else {
            setUser({
              ...authUser,
              full_name: profile?.full_name,
              role: profile?.role
            })
          }
        } catch {
          // Fallback to just showing user email
          setUser({
            ...authUser,
            full_name: authUser.email?.split('@')[0] || 'User',
            role: 'unknown'
          })
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    // Get initial user
    const getInitialUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      await getUser(authUser)
    }

    getInitialUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: string, session: { user?: { id: string; email: string } } | null) => {
        await getUser(session?.user || null)
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted])

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link href="/dashboard" className="mr-6 flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary-600 flex items-center justify-center text-white font-bold">
              R
            </div>
            <span className="hidden font-bold sm:inline-block">
              ReMobile Refurbish
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex flex-1 items-center space-x-6 text-sm font-medium">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors hover:text-foreground/80 ${
                pathname === item.href ? 'text-foreground' : 'text-foreground/60'
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-4">
          {/* Mobile Navigation */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <nav className="flex flex-col space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors hover:text-foreground/80 ${
                      pathname === item.href ? 'text-foreground' : 'text-foreground/60'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>
                    {mounted && user?.full_name 
                      ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
                      : 'U'
                    }
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                {!mounted || loading ? (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Loading...</p>
                    <p className="text-xs leading-none text-muted-foreground">...</p>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.full_name || 'Unknown User'}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email || 'No email'}
                    </p>
                    {user?.role && (
                      <p className="text-xs leading-none text-blue-600 font-medium">
                        {user.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </p>
                    )}
                  </div>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 