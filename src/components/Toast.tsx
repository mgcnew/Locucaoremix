import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, Info, LoaderCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'loading';

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

interface ToastOptions {
  description?: string;
  action?: ToastItem['action'];
  /** ms; 0 mantém até ser fechado/atualizado */
  duration?: number;
}

interface ToastApi {
  show: (type: ToastType, title: string, opts?: ToastOptions) => number;
  update: (id: number, type: ToastType, title: string, opts?: ToastOptions) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast fora do ToastProvider');
  return ctx;
};

const DEFAULT_DURATION: Record<ToastType, number> = {
  success: 4000,
  info: 5000,
  error: 7000,
  loading: 0,
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 className="w-5 h-5 text-success" />,
  error: <CircleAlert className="w-5 h-5 text-danger" />,
  info: <Info className="w-5 h-5 text-accent" />,
  loading: <LoaderCircle className="w-5 h-5 text-accent animate-spin" />,
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const schedule = useCallback(
    (id: number, type: ToastType, duration?: number) => {
      clearTimeout(timers.current.get(id));
      const ms = duration ?? DEFAULT_DURATION[type];
      if (ms > 0) timers.current.set(id, setTimeout(() => dismiss(id), ms));
    },
    [dismiss]
  );

  const show = useCallback<ToastApi['show']>(
    (type, title, opts = {}) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-3), { id, type, title, description: opts.description, action: opts.action }]);
      schedule(id, type, opts.duration);
      return id;
    },
    [schedule]
  );

  const update = useCallback<ToastApi['update']>(
    (id, type, title, opts = {}) => {
      setToasts((list) => {
        if (!list.some((t) => t.id === id)) {
          return [...list.slice(-3), { id, type, title, description: opts.description, action: opts.action }];
        }
        return list.map((t) => (t.id === id ? { id, type, title, description: opts.description, action: opts.action } : t));
      });
      schedule(id, type, opts.duration);
    },
    [schedule]
  );

  return (
    <ToastContext.Provider value={{ show, update, dismiss }}>
      {children}
      <div
        className="fixed z-[60] inset-x-0 top-3 px-3 flex flex-col items-center gap-2 pointer-events-none max-sm:[&>*:not(:last-child)]:hidden sm:inset-x-auto sm:top-5 sm:right-6 sm:items-end sm:px-0"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto w-full max-w-sm flex items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3 shadow-float animate-toast-in"
          >
            <span className="mt-0.5 shrink-0" aria-hidden="true">
              {ICONS[t.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-fg">{t.title}</p>
              {t.description && <p className="text-sm text-muted mt-0.5 leading-snug">{t.description}</p>}
              {t.action && (
                <button
                  type="button"
                  onClick={() => {
                    t.action!.onClick();
                    dismiss(t.id);
                  }}
                  className="mt-2 text-sm font-semibold text-accent-fg hover:underline"
                >
                  {t.action.label}
                </button>
              )}
            </div>
            {t.type !== 'loading' && (
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fechar aviso"
                className="-mr-1.5 -mt-1 grid place-items-center w-8 h-8 rounded-md text-muted hover:text-fg hover:bg-sunken"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
