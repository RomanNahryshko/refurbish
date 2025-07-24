import { toast as sonnerToast } from 'sonner'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastOptions {
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

export function useToast() {
  const toast = {
    success: (options: ToastOptions) => {
      sonnerToast.success(options.title, {
        description: options.description,
        duration: options.duration,
        action: options.action,
      })
    },
    error: (options: ToastOptions) => {
      sonnerToast.error(options.title, {
        description: options.description,
        duration: options.duration,
        action: options.action,
      })
    },
    warning: (options: ToastOptions) => {
      sonnerToast.warning(options.title, {
        description: options.description,
        duration: options.duration,
        action: options.action,
      })
    },
    info: (options: ToastOptions) => {
      sonnerToast.info(options.title, {
        description: options.description,
        duration: options.duration,
        action: options.action,
      })
    },
    loading: (title: string) => sonnerToast.loading(title),
    dismiss: (toastId?: string | number) => sonnerToast.dismiss(toastId),
    promise: <T,>(
      promise: Promise<T>,
      options: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => sonnerToast.promise(promise, options),
  }

  return toast
}

// Convenience function for quick toasts
export const toast = {
  success: (title: string, description?: string) => 
    sonnerToast.success(title, { description }),
  error: (title: string, description?: string) => 
    sonnerToast.error(title, { description }),
  warning: (title: string, description?: string) => 
    sonnerToast.warning(title, { description }),
  info: (title: string, description?: string) => 
    sonnerToast.info(title, { description }),
} 