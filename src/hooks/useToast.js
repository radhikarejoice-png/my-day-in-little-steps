import { useState, useCallback } from 'react';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, message, type = 'success', icon = '✨', duration = 4000 }) => {
      const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      const newToast = { id, title, message, type, icon, duration };

      setToasts((prev) => [newToast, ...prev].slice(0, 5));

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  return { toasts, addToast, removeToast };
}
