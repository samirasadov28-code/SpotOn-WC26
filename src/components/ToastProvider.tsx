'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

export type ToastType = 'success' | 'info' | 'warning' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextValue {
  push: (toast: Omit<Toast, 'id'>) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const borderColors: Record<ToastType, string> = {
  success: 'border-l-green-500',
  info: 'border-l-blue-500',
  warning: 'border-l-yellow-500',
  error: 'border-l-red-400',
}

const bgColors: Record<ToastType, string> = {
  success: 'bg-white',
  info: 'bg-white',
  warning: 'bg-white',
  error: 'bg-white',
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl shadow-lg border-l-4 px-4 py-3 min-w-[280px] max-w-sm ${borderColors[toast.type]} ${bgColors[toast.type]}`}
      role="alert"
    >
      <p className="text-sm text-gray-800 flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="text-gray-400 hover:text-gray-600 text-xs mt-0.5 flex-shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) { clearTimeout(timer); timers.current.delete(id) }
  }, [])

  const push = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const duration = toast.duration ?? 4000
    setToasts(prev => [...prev, { ...toast, id }])
    const timer = setTimeout(() => remove(id), duration)
    timers.current.set(id, timer)
  }, [remove])

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div
        className="fixed bottom-20 md:bottom-4 right-4 z-50 flex flex-col gap-2 items-end"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onRemove={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
