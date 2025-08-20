'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { cn } from '@/lib/utils'
import { type UserProfile, type PermissionString } from '@/lib/types/business-types'
import { useUIPermissions } from '@/lib/hooks/use-permissions'

interface NavigationItem {
  title: string
  href: string
  description?: string
  allowedRoles?: string[]
  requiredPermissions?: PermissionString[]
  // Function to check if item should be shown based on permissions
  showIf?: (permissions: ReturnType<typeof useUIPermissions>) => boolean
}

const navigationItems: NavigationItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    description: 'Overview of operations',
    showIf: (perms) => perms.isQC || perms.isOpsManager || perms.isGeneralManager // УБРАНО для technician
  },
  {
    title: 'Batch Intake',
    href: '/batch-intake',
    description: 'Register new phone batches',
    showIf: (perms) => perms.canCreateBatches
  },
  {
    title: 'Devices',
    href: '/devices',
    description: 'Track phones by IMEI',
    showIf: (perms) => perms.canViewDevices && !perms.isQC // СКРЫТО для qc_controller
  },
  {
    title: 'Repair Jobs',
    href: '/repair-jobs',
    description: 'Manage repair assignments',
    showIf: (perms) => perms.canViewRepairJobs && !perms.isQC // СКРЫТО для qc_controller
  },
  {
    title: 'Quality Control',
    href: '/qc',
    description: 'Final QC and grading',
    showIf: (perms) => perms.canViewQC && !perms.isOpsManager // СКРЫТО для ops_manager
  },
  {
    title: 'Inventory',
    href: '/inventory',
    description: 'Spare parts management',
    showIf: (perms) => perms.canViewInventory && !perms.isOpsManager // СКРЫТО для ops_manager
  },
  {
    title: 'Suppliers',
    href: '/suppliers',
    description: 'Supplier management',
    showIf: (perms) => perms.hasPermission('suppliers', 'read') && !perms.isOpsManager // СКРЫТО для ops_manager
  },
  {
    title: 'Admin',
    href: '/admin',
    description: 'System administration',
    showIf: (perms) => perms.canManageUsers || perms.isAdmin
  },
]

interface NavigationProps {
  userProfile?: UserProfile | null
}

export function Navigation({ userProfile }: NavigationProps) {
  const pathname = usePathname()
  const permissions = useUIPermissions(userProfile)
  
  // Filter navigation items based on permissions
  const allowedItems = navigationItems.filter(item => {
    // If custom showIf function is provided, use it
    if (item.showIf) {
      return item.showIf(permissions)
    }
    
    // If required permissions are specified, check them
    if (item.requiredPermissions) {
      return item.requiredPermissions.every(perm => {
        const [table, action] = perm.split(':') as [string, 'create' | 'read' | 'update' | 'delete']
        return permissions.hasPermission(table as any, action)
      })
    }
    
    // If legacy allowedRoles is used, fall back to role check
    if (item.allowedRoles && userProfile) {
      return item.allowedRoles.includes(userProfile.role)
    }
    
    // Default: show if user is authenticated
    return !!userProfile
  })

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {allowedItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className={cn(
                  navigationMenuTriggerStyle(),
                  pathname === item.href && 'bg-accent text-accent-foreground'
                )}
              >
                {item.title}
              </Link>
            </NavigationMenuLink>
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