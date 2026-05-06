'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'levelup'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return {
      show: () => {
        // noop fallback
      },
    }
  }
  return ctx
}

const COLORS: Record<ToastType, { bg: string; border: string; text: string }> = {
  success: { bg: '#E8F5E9', border: '#2E7D32', text: '#1B5E20' },
  error: { bg: '#FFEBEE', border: '#C62828', text: '#B71C1C' },
  warning: { bg: '#FFF3E0', border: '#FF8F00', text: '#E65100' },
  info: { bg: '#FFF8F0', border: '#FF6B00', text: '#E65100' },
  levelup: { bg: '#FFF3E0', border: '#FFB300', text: '#E65100' },
}

const ICONS: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
  levelup: '★',
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2, 9)
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 items-center pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => {
            const c = COLORS[t.type]
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 30, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                style={{
                  background: c.bg,
                  borderColor: c.border,
                  color: c.text,
                }}
                className="px-5 py-3 rounded-xl border-2 font-semibold shadow-lg pointer-events-auto flex items-center gap-2 max-w-md"
              >
                <span className="text-lg">{ICONS[t.type]}</span>
                <span>{t.message}</span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToastEffect(message: string, type: ToastType, when: boolean) {
  const { show } = useToast()
  useEffect(() => {
    if (when) show(message, type)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [when])
}
