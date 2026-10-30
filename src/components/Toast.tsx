import { useState, useEffect } from 'react';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  icon?: string;
  duration?: number;
}

type ToastListener = (toast: ToastItem) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  show: (item: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const fullItem: ToastItem = { id, duration: 3500, type: 'success', ...item };
    listeners.forEach(fn => fn(fullItem));
  },
  success: (title: string, message?: string, icon = '✅') => {
    toast.show({ title, message, type: 'success', icon });
  },
  saved: (itemText: string, icon = '💾') => {
    toast.show({
      title: `${itemText} salvo com sucesso!`,
      message: 'As alterações foram salvas e sincronizadas.',
      type: 'success',
      icon
    });
  },
  info: (title: string, message?: string, icon = 'ℹ️') => {
    toast.show({ title, message, type: 'info', icon });
  },
  error: (title: string, message?: string, icon = '❌') => {
    toast.show({ title, message, type: 'error', icon });
  },
  warning: (title: string, message?: string, icon = '⚠️') => {
    toast.show({ title, message, type: 'warning', icon });
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const handleToast = (newToast: ToastItem) => {
      setToasts(prev => [newToast, ...prev]);

      if (newToast.duration) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== newToast.id));
        }, newToast.duration);
      }
    };

    listeners.add(handleToast);
    return () => {
      listeners.delete(handleToast);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 md:px-0">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto relative flex items-start gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md transition-all duration-300 transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-3"
          style={{
            background: 'rgba(17, 24, 39, 0.95)',
            border: '1px solid rgba(249, 115, 22, 0.4)',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px 0 rgba(249, 115, 22, 0.15)',
          }}
        >
          <div className="text-xl flex-shrink-0 mt-0.5 select-none">{t.icon || '💾'}</div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-sm font-bold leading-tight" style={{ color: '#F9FAFB' }}>
              {t.title}
            </h4>
            {t.message && (
              <p className="text-xs mt-1 leading-relaxed" style={{ color: '#9CA3AF' }}>
                {t.message}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(t.id)}
            className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
