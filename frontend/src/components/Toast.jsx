import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const ToastContext = createContext(null)

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' }
const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error:   'border-red-500/30 bg-red-500/10 text-red-400',
  info:    'border-sky-500/30 bg-sky-500/10 text-sky-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
}

function ToastItem({ id, type, message, onClose }) {
  useEffect(() => {
    const t = setTimeout(() => onClose(id), 4000)
    return () => clearTimeout(t)
  }, [id, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl min-w-64 max-w-sm ${STYLES[type]}`}
    >
      <span className="text-lg flex-shrink-0 font-bold">{ICONS[type]}</span>
      <span className="text-sm text-slate-200 flex-1">{message}</span>
      <button
        onClick={() => onClose(id)}
        className="text-slate-500 hover:text-white transition-colors flex-shrink-0 text-xs"
      >✕</button>
    </motion.div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p.slice(-4), { id, type, message }])
  }, [])

  const remove = useCallback((id) => {
    setToasts(p => p.filter(t => t.id !== id))
  }, [])

  const api = {
    success: (msg) => add('success', msg),
    error:   (msg) => add('error', msg),
    info:    (msg) => add('info', msg),
    warning: (msg) => add('warning', msg),
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem {...t} onClose={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
