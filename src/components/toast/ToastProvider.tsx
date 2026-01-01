"use client"
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type Toast = { id: string; text: string }
const Ctx = createContext<{ show: (text: string) => void } | null>(null)

export function useToast() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('ToastProvider missing')
  return ctx
}

export default function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const show = useCallback((text: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
  }, [])
  const value = useMemo(() => ({ show }), [show])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className="px-3 py-2 rounded bg-black/80 text-white shadow">{t.text}</div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
