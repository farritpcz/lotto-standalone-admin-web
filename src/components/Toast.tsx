/**
 * Toast — Toast notification system (dark theme)
 *
 * ระบบแจ้งเตือนแบบ toast slide-in จากขวาบน
 * รองรับ 4 ประเภท: success, error, warning, info
 * ซ้อนหลาย toast ได้ + auto-dismiss 3 วินาที
 *
 * Usage:
 *   // ครอบ app ด้วย ToastProvider (ใส่ใน layout)
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
 *
 *   // ใช้ใน component
 *   const { toast } = useToast()
 *   toast.success('บันทึกสำเร็จ!')
 *   toast.error('เกิดข้อผิดพลาด')
 *   toast.warning('โปรดตรวจสอบ')
 *   toast.info('กำลังดำเนินการ...')
 */

'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { createPortal } from 'react-dom'
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react'

/* ─── Types ─── */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  exiting: boolean
}

interface ToastContextValue {
  toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
    info: (message: string) => void
  }
}

/* ─── Config สี + icon ตาม type ─── */

const toastConfig: Record<ToastType, {
  icon: React.ReactNode
  borderColor: string
  iconColor: string
}> = {
  success: {
    icon: <CheckCircle size={18} />,
    borderColor: '#00e5a0',
    iconColor: '#00e5a0',
  },
  error: {
    icon: <XCircle size={18} />,
    borderColor: '#ef4444',
    iconColor: '#ef4444',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    borderColor: '#f59e0b',
    iconColor: '#f59e0b',
  },
  info: {
    icon: <Info size={18} />,
    borderColor: '#3b82f6',
    iconColor: '#3b82f6',
  },
}

/* ─── Context ─── */

const ToastContext = createContext<ToastContextValue | null>(null)

/* ─── Hook: useToast ─── */

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast ต้องใช้ภายใน <ToastProvider>')
  }
  return ctx
}

/* ─── Single Toast Item ─── */

function ToastCard({ item, onClose }: { item: ToastItem; onClose: (id: string) => void }) {
  const cfg = toastConfig[item.type]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 16px',
        background: '#1a1a1a',
        border: `1px solid ${cfg.borderColor}33`,
        borderLeft: `3px solid ${cfg.borderColor}`,
        borderRadius: 8,
        color: '#ededed',
        fontSize: 13,
        fontWeight: 500,
        minWidth: 280,
        maxWidth: 400,
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        animation: item.exiting
          ? 'toastSlideOut 0.25s ease forwards'
          : 'toastSlideIn 0.25s ease forwards',
        pointerEvents: 'auto' as const,
      }}
    >
      {/* Icon */}
      <div style={{ color: cfg.iconColor, flexShrink: 0, display: 'flex' }}>
        {cfg.icon}
      </div>

      {/* Message */}
      <div style={{ flex: 1, lineHeight: 1.4 }}>{item.message}</div>

      {/* Close button */}
      <button
        onClick={() => onClose(item.id)}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  )
}

/* ─── ToastContainer (portal) ─── */

function ToastPortal({ toasts, onClose }: {
  toasts: ToastItem[]
  onClose: (id: string) => void
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map((item) => (
        <ToastCard key={item.id} item={item} onClose={onClose} />
      ))}
    </div>,
    document.body,
  )
}

/* ─── ToastProvider ─── */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map())

  /* ลบ toast พร้อม exit animation */
  const removeToast = useCallback((id: string) => {
    // เริ่ม exit animation
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    // ลบจริงหลัง animation จบ (250ms)
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 250)
  }, [])

  /* เพิ่ม toast ใหม่ */
  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const newToast: ToastItem = { id, type, message, exiting: false }

      setToasts((prev) => [...prev, newToast])

      // auto-dismiss หลัง 3 วินาที
      const timer = setTimeout(() => {
        removeToast(id)
        timersRef.current.delete(id)
      }, 3000)

      timersRef.current.set(id, timer)
    },
    [removeToast],
  )

  /* สร้าง toast object สำหรับ context */
  const toast = {
    success: (msg: string) => addToast('success', msg),
    error: (msg: string) => addToast('error', msg),
    warning: (msg: string) => addToast('warning', msg),
    info: (msg: string) => addToast('info', msg),
  }

  /* Cleanup timers on unmount */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
    }
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastPortal toasts={toasts} onClose={removeToast} />

      {/* CSS animations (inject once) */}
      <style jsx global>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(40px) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
        }
        @keyframes toastSlideOut {
          from {
            opacity: 1;
            transform: translateX(0) translateY(0);
          }
          to {
            opacity: 0;
            transform: translateX(40px) translateY(-8px);
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

/**
 * ToastContainer — สำหรับเพิ่มใน layout.tsx (alias ของ ToastProvider)
 *
 * ใช้ครอบ children ใน root layout เพื่อให้ทุกหน้าใช้ toast ได้
 */
export const ToastContainer = ToastProvider
