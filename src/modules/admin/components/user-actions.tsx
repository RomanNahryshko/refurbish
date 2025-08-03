'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useUpdateUserStatus, useResetUserPassword } from '@/lib/hooks/use-users'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { MoreHorizontal, Edit, Shield, ShieldOff, Key, Eye } from 'lucide-react'

interface UserActionsProps {
  user: Record<string, unknown> // User type from API
  currentUserId?: string
  onUpdate: () => void
}

export function UserActions({ user, currentUserId, onUpdate }: UserActionsProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [actionType, setActionType] = useState<'enable' | 'disable' | 'password'>('enable')

  const updateStatusMutation = useUpdateUserStatus()
  const resetPasswordMutation = useResetUserPassword()

  const isCurrentUser = user.id === currentUserId
  const isActive = user.status === 'active' || !user.status

  const handleStatusChange = async () => {
    const newStatus = isActive ? 'disabled' : 'active'
    
    try {
      await updateStatusMutation.mutateAsync({
        userId: user.id,
        status: newStatus,
        performedBy: currentUserId || 'unknown-admin'
      })
      onUpdate()
      setShowStatusDialog(false)
    } catch {
      // Error handled by toast in hook
    }
  }

  const handlePasswordReset = async () => {
    try {
      await resetPasswordMutation.mutateAsync({
        userId: user.id,
        email: user.auth_user?.email || user.email,
        performedBy: currentUserId || 'unknown-admin'
      })
      onUpdate()
      setShowPasswordDialog(false)
    } catch {
      // Error handled by toast in hook
    }
  }

  const openStatusDialog = (action: 'enable' | 'disable') => {
    setActionType(action)
    setShowStatusDialog(true)
  }

  const openPasswordDialog = () => {
    setActionType('password')
    setShowPasswordDialog(true)
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {/* View/Edit Button */}
        <Link href={`/admin/users/${user.id}`}>
          <Button size="sm" variant="outline">
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </Link>

        {/* More Actions Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Edit */}
            <DropdownMenuItem asChild>
              <Link href={`/admin/users/${user.id}`} className="flex items-center">
                <Edit className="h-4 w-4 mr-2" />
                Edit User
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Reset Password */}
            <DropdownMenuItem onClick={openPasswordDialog}>
              <Key className="h-4 w-4 mr-2" />
              Reset Password
            </DropdownMenuItem>
            
            {!isCurrentUser && (
              <>
                <DropdownMenuSeparator />
                
                {/* Enable/Disable */}
                {isActive ? (
                  <DropdownMenuItem 
                    onClick={() => openStatusDialog('disable')}
                    className="text-red-600 focus:text-red-600"
                  >
                    <ShieldOff className="h-4 w-4 mr-2" />
                    Disable User
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => openStatusDialog('enable')}
                    className="text-green-600 focus:text-green-600"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    Enable User
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'enable' ? 'Enable' : 'Disable'} User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {actionType === 'enable' ? 'enable' : 'disable'} {' '}
              <strong>{user.full_name || user.auth_user?.email}</strong>?
              {actionType === 'disable' && (
                <span className="block mt-2 text-red-600">
                  This user will no longer be able to access the system.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className={actionType === 'disable' ? 'bg-red-600 hover:bg-red-700' : ''}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? 'Processing...' : 
                actionType === 'enable' ? 'Enable User' : 'Disable User'
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Confirmation Dialog */}
      <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new temporary password for{' '}
              <strong>{user.full_name || user.auth_user?.email}</strong>.
              <span className="block mt-2 text-amber-600">
                The user will be required to change their password on next login.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handlePasswordReset}
              disabled={resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}