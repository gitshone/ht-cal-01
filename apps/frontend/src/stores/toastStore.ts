import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

export interface ToastInput {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastState {
  // State
  toasts: Toast[];

  // Actions
  addToast: (toast: ToastInput) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  removeToast: (id: string) => {
    set(state => ({
      toasts: state.toasts.filter(toast => toast.id !== id),
    }));
  },

  addToast: (toast: ToastInput) => {
    const id = Math.random().toString(36).substr(2, 9);
    const { removeToast } = get();

    const newToast: Toast = {
      id,
      ...toast,
      onClose: removeToast,
    };

    set(state => {
      // Limit to maximum 5 toasts to prevent memory issues
      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift(); // Remove oldest toast
      }
      return { toasts: updatedToasts };
    });

    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  },

  clearAllToasts: () => {
    set({ toasts: [] });
  },

  showSuccess: (title: string, message: string, duration?: number) => {
    const { addToast } = get();
    addToast({ type: 'success', title, message, duration });
  },

  showError: (title: string, message: string, duration?: number) => {
    const { addToast } = get();
    addToast({ type: 'error', title, message, duration });
  },

  showInfo: (title: string, message: string, duration?: number) => {
    const { addToast } = get();
    addToast({ type: 'info', title, message, duration });
  },

  showWarning: (title: string, message: string, duration?: number) => {
    const { addToast } = get();
    addToast({ type: 'warning', title, message, duration });
  },
}));
