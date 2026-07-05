import React, { createContext, useContext, useState, useCallback } from 'react'
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  exiting?: boolean
}

interface ToastContextValue {
  toast: (type: ToastType, title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <IconCheck size={16} />,
  error:   <IconX size={16} />,
  warning: <IconAlertTriangle size={16} />,
  info:    <IconInfoCircle size={16} />,
}

const iconBg: Record<ToastType, string> = {
  success: 'bg-[var(--buy-bg)] text-[var(--buy)]',
  error:   'bg-[var(--sell-bg)] text-[var(--sell)]',
  warning: 'bg-[var(--warn-bg)] text-[var(--warn)]',
  info:    'bg-[var(--accent-tint)] text-[var(--text-accent)]',
}

const AUTO_DISMISS: Record<ToastType, number> = {
  success: 3000,
  error:   5000,
  warning: 4000,
  info:    3000,
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 220)
  }, [])

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => dismiss(id), AUTO_DISMISS[type])
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className={[
              'flex items-start gap-3 min-w-72 max-w-sm p-3 rounded-[var(--radius-lg)]',
              'bg-[var(--surface-1)] border border-[var(--border-strong)] shadow-[var(--shadow-pop)]',
              'pointer-events-auto',
              t.exiting ? 'toast-exit' : 'toast-enter',
            ].join(' ')}
          >
            <span className={`flex-shrink-0 w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center ${iconBg[t.type]}`}>
              {icons[t.type]}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{t.title}</p>
              {t.message && <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-snug">{t.message}</p>}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="flex-shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <IconX size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
