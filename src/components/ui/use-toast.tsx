import { toast as sonnerToast } from 'sonner';
import { useCallback } from 'react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  variant?: ToastVariant;
  duration?: number;
}

/**
 * Custom hook for showing toast notifications
 * Uses Sonner (shadcn toast component)
 */
export const useToast = () => {
  const toast = useCallback(({ title, message, variant = 'info', duration = 3000 }: ToastOptions) => {
    const toastFn = {
      success: sonnerToast.success,
      error: sonnerToast.error,
      warning: sonnerToast.warning,
      info: sonnerToast.info,
    }[variant];

    toastFn(title || message, {
      description: title ? message : undefined,
      duration,
    });
  }, []);

  return { toast };
};
