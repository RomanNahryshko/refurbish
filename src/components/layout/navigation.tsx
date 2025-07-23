'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'

interface NavigationItem {
  title: string
  href: string
  description?: string
  allowedRoles: string[]
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    description: 'Overview of operations',
    allowedRoles: ['data_entry', 'qc_controller', 'technician', 'ops_manager'],
  },
  {
    title: 'Batch Intake',
    href: '/dashboard/batch-intake',
    description: 'Register new phone batches',
    allowedRoles: ['data_entry', 'ops_manager'],
  },
  {
    title: 'Phone Tracking',
    href: '/dashboard/phone-tracking',
    description: 'Track phones by IMEI',
    allowedRoles: ['data_entry', 'qc_controller', 'technician', 'ops_manager'],
  },
  {
    title: 'Repair Jobs',
    href: '/dashboard/repair-jobs',
    description: 'Manage repair assignments',
    allowedRoles: ['technician', 'ops_manager'],
  },
  {
    title: 'Inventory',
    href: '/dashboard/inventory',
    description: 'Spare parts management',
    allowedRoles: ['technician', 'ops_manager'],
  },
  {
    title: 'Shipping',
    href: '/dashboard/shipping',
    description: 'Prepare shipping manifests',
    allowedRoles: ['data_entry', 'ops_manager'],
  },
  {
    title: 'Admin',
    href: '/dashboard/admin',
    description: 'System administration',
    allowedRoles: ['ops_manager'],
  },
]

interface NavigationProps {
  userRole?: string
}

export function Navigation({ userRole = 'ops_manager' }: NavigationProps) {
  const pathname = usePathname()
  
  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter(item =>
    item.allowedRoles.includes(userRole)
  )

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {allowedItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <Link href={item.href} legacyBehavior passHref>
              <NavigationMenuLink
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.href && 'bg-accent text-accent-foreground'
                )}
              >
                {item.title}
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  )
}

// List item component for dropdown menus
const ListItem = ({
  className,
  title,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'a'> & { title: string }) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
}
ListItem.displayName = 'ListItem' 