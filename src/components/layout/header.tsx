'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Batch Intake', href: '/batch-intake' },
  { name: 'Devices', href: '/devices' },
  { name: 'Repair Jobs', href: '/repair-jobs' },
  { name: 'Quality Control', href: '/qc' },
  { name: 'Inventory', href: '/inventory' },
  { name: 'Shipping', href: '/shipping' },
]

export function Header() {
  const pathname = usePathname()
  const { data: user } = useUser()
  const { data: profile, isLoading: profileLoading } = useProfile(!!user)

  const handleLogout = async () => {
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
      // Clear caches when logging out
      window.location.href = '/login'
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
            <Link href="/dashboard">
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
          <nav className="hidden md:flex items-center space-x-6">
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
                  <Link href="/dashboard" className="flex justify-center mb-6">
                    <Image
                      src="/logo_remobile.svg"
                      alt="ReMobile Logo"
                      width={96}
                      height={96}
                      className="h-24 w-24"
                    />
                  </Link>
                  <nav className="flex flex-col space-y-3">
                    {navigation.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`text-sm font-medium transition-colors hover:text-foreground/80 px-2 py-1 rounded-md hover:bg-accent ${
                          pathname === item.href 
                            ? 'text-foreground bg-accent' 
                            : 'text-foreground/60'
                        }`}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </nav>
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
                  <DropdownMenuItem asChild>
                    <Link href="/change-password" className="cursor-pointer">
                      Change Password
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    Settings
                  </DropdownMenuItem>
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