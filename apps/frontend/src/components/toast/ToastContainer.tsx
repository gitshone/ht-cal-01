import React, { useEffect } from 'react';
import Toast from './Toast';
import { Toast as ToastType } from '../../store/slices/toastSlice';
import { useAppDispatch } from '../../hooks/redux';
import { removeToast } from '../../store/slices/toastSlice';

interface ToastContainerProps {
  toasts: ToastType[];
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    toasts.forEach(toast => {
      if (toast.duration && toast.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeToast(toast.id));
        }, toast.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={(id: string) => dispatch(removeToast(id))}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
