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
import { type UserProfile, type PermissionString, type TableName, type PermissionAction } from '@/lib/types/business-types'
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
    showIf: (perms) => perms.isAdmin || perms.isGeneralManager || perms.isOpsManager
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
    showIf: (perms) => perms.canViewDevices
  },
  {
    title: 'Repair Jobs',
    href: '/repair-jobs',
    description: 'Manage repair assignments',
    //super admin + general manager + ops manager + technician
    showIf: (perms) => perms.canViewRepairJobs && !perms.isQC
  },
  {
    title: 'Quality Control',
    href: '/qc',
    description: 'Final QC and grading',
    //super admin + general manager + ops manager
    showIf: (perms) => perms.canViewQC
  },
  {
    title: 'Inventory',
    href: '/inventory',
    description: 'Spare parts management',
    //super admin + general manager + ops manager
    showIf: (perms) => perms.canViewInventory && !perms.isTechnician
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
        const [table, action] = perm.split(':') as [TableName, PermissionAction]
        return permissions.hasPermission(table, action)
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