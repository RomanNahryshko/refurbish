'use client'

import { useState, useCallback } from 'react'

interface ConfirmationOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}

export function useConfirmation() {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions>({
    title: '',
    description: '',
  })
  const [resolvePromise, setResolvePromise] = useState<{
    resolve: (value: boolean) => void
  } | null>(null)

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolvePromise({ resolve })
      setIsOpen(true)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolvePromise?.resolve(true)
    setIsOpen(false)
    setResolvePromise(null)
  }, [resolvePromise])

  const handleCancel = useCallback(() => {
    resolvePromise?.resolve(false)
    setIsOpen(false)
    setResolvePromise(null)
  }, [resolvePromise])

  return {
    confirm,
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
      ...options,
    },
  }
}

// Usage example:
// const { confirm, dialogProps } = useConfirmation()
// 
// const handleDelete = async () => {
//   const confirmed = await confirm({
//     title: 'Delete Item',
//     description: 'Are you sure you want to delete this item?',
//     confirmText: 'Delete',
//     variant: 'destructive',
//   })
//   
//   if (confirmed) {
//     // Perform delete action
//   }
// } 