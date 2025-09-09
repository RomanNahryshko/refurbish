'use client'

import { usePathname } from 'next/navigation'
import { Header } from './header'
import { Footer } from './footer'

interface ConditionalLayoutProps {
  children: React.ReactNode
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname()
  
  // Auth pages that should NOT have header/footer
  const authPaths = ['/login', '/signup', '/change-password']
  const isAuthPage = authPaths.some(path => pathname.startsWith(path))
  
  if (isAuthPage) {
    // Auth pages: no header/footer, full screen
    return (
      <div className="h-screen w-screen overflow-hidden">
        {children}
      </div>
    )
  }
  
  // Regular pages: include header/footer
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}