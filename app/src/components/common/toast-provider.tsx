'use client'

import { Toaster } from '@/components/ui/sonner'

export function ToastProvider() {
  return (
    <Toaster 
      position="top-right"
      expand={false}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: 'group',
          title: 'text-sm font-semibold',
          description: 'text-sm',
          actionButton: 'bg-primary',
          cancelButton: 'bg-muted',
        },
      }}
    />
  )
} 