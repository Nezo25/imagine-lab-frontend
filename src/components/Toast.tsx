import React, { useState, useEffect } from 'react';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  icon?: string;
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: string;
}

let toastListener: ((toast: ToastItem) => void) | null = null;

export const toast = {
  show: (opts: ToastOptions) => {
    if (toastListener) {
      toastListener({
        id: Math.random().toString(36).substring(2, 9),
        duration: 4000,
        type: 'info',
        ...opts,
      });
    }
  },
  success: (message: string, title?: string) => {
    toast.show({ message, title: title || 'Sucesso!', type: 'success', icon: '✨' });
  },
  error: (message: string, title?: string) => {
    toast.show({ message, title: title || 'Atenção', type: 'error', icon: '⚠️' });
  },
  info: (message: string, title?: string) => {
    toast.show({ message, title, type: 'info', icon: '💡' });
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    toastListener = (item: ToastItem) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id));
      }, item.duration || 4000);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 md:px-0">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl shadow-2xl backdrop-blur-xl border animate-in slide-in-from-bottom-3 duration-300"
          style={{
            background:
              t.type === 'success'
                ? 'rgba(15, 23, 42, 0.95)'
                : t.type === 'error'
                ? 'rgba(69, 10, 10, 0.95)'
                : 'rgba(15, 23, 42, 0.95)',
            borderColor:
              t.type === 'success'
                ? 'rgba(76, 168, 184, 0.4)'
                : t.type === 'error'
                ? 'rgba(239, 68, 68, 0.4)'
                : 'rgba(94, 72, 140, 0.4)',
          }}
        >
          <div className="text-xl shrink-0 mt-0.5">
            {t.icon || (t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️')}
          </div>
          <div className="flex-1 min-w-0">
            {t.title && <div className="text-xs font-bold text-white mb-0.5">{t.title}</div>}
            <div className="text-xs text-slate-300 leading-relaxed">{t.message}</div>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-slate-400 hover:text-white text-xs p-1"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
