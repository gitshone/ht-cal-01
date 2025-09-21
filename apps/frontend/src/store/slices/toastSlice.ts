import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface ToastInput {
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

export interface ToastState {
  toasts: Toast[];
}

const initialState: ToastState = {
  toasts: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    addToast: (state, action: PayloadAction<ToastInput>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        duration: 5000,
        ...action.payload,
      };

      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift();
      }
      state.toasts = updatedToasts;
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    clearAllToasts: state => {
      state.toasts = [];
    },
    showSuccess: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        duration?: number;
      }>
    ) => {
      const { title, message, duration = 5000 } = action.payload;
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        type: 'success',
        title,
        message,
        duration,
      };

      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift();
      }
      state.toasts = updatedToasts;
    },
    showError: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        duration?: number;
      }>
    ) => {
      const { title, message, duration = 7000 } = action.payload;
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        type: 'error',
        title,
        message,
        duration,
      };

      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift();
      }
      state.toasts = updatedToasts;
    },
    showInfo: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        duration?: number;
      }>
    ) => {
      const { title, message, duration = 5000 } = action.payload;
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        type: 'info',
        title,
        message,
        duration,
      };

      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift();
      }
      state.toasts = updatedToasts;
    },
    showWarning: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        duration?: number;
      }>
    ) => {
      const { title, message, duration = 6000 } = action.payload;
      const id = Math.random().toString(36).substr(2, 9);
      const newToast: Toast = {
        id,
        type: 'warning',
        title,
        message,
        duration,
      };

      const updatedToasts = [...state.toasts, newToast];
      if (updatedToasts.length > 5) {
        updatedToasts.shift();
      }
      state.toasts = updatedToasts;
    },
  },
});

export const {
  addToast,
  removeToast,
  clearAllToasts,
  showSuccess,
  showError,
  showInfo,
  showWarning,
} = toastSlice.actions;

export default toastSlice.reducer;
