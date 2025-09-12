'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSupabaseClient } from '@/lib/stores/supabase-store'
import { useProfile } from '@/lib/hooks/use-profile'
import { useUser } from '@/lib/hooks/use-user'

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
import { Navigation } from './navigation'

export function Header() {
  const { user } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile(!!user)
  const supabase = useSupabaseClient()

  // Logo always links to homepage (central navigation hub)
  const getLogoLink = () => {
    return '/homepage'
  }

  const handleLogout = async () => {
    if (supabase) {
      try {
        // Sign out from Supabase
        await supabase.auth.signOut()
        
        // Simple redirect to login page
        window.location.href = '/login'
      } catch (error) {
        console.error('Logout failed:', error)
        // Force redirect even if logout fails
        window.location.href = '/login'
      }
    }
  }

  const userFullName = profile?.full_name || user?.user_metadata?.full_name || 'Unknown User'
  const userEmail = user?.email || 'No email'
  const userRole = profile?.role
  const userInitials = userFullName.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={getLogoLink()}>
              <Image
                src="/logo_remobile.svg"
                alt="ReMobile Logo"
                width={96}
                height={96}
                className="h-24 w-24"
              />
            </Link>
          </div>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center">
            <Navigation userProfile={profile || null} />
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Mobile Menu Button */}
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
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[250px] sm:w-[300px]">
                <div className="flex flex-col space-y-4 mt-4">
                  <Link href={getLogoLink()} className="flex justify-center mb-6">
                    <Image
                      src="/logo_remobile.svg"
                      alt="ReMobile Logo"
                      width={96}
                      height={96}
                      className="h-24 w-24"
                    />
                  </Link>
                  <div className="flex flex-col">
                    <Navigation userProfile={profile || null} />
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {/* User Menu - Only show when authenticated */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary-100 text-primary-700">
                        {profileLoading ? '...' : userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      {profileLoading ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="text-sm text-muted-foreground">Loading profile...</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm font-medium leading-none">
                            {userFullName}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {userEmail}
                          </p>
                          {userRole && (
                            <p className="text-xs leading-none text-blue-600 font-medium pt-1">
                              {userRole.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {(userRole === 'admin' || userRole === 'general_manager') && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        Admin Settings
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
