/**
 * ConfirmDialog — Reusable confirm modal (Linear/Vercel style)
 *
 * ใช้แทน browser confirm() ทั้งระบบ
 *
 * Usage:
 *   const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
 *
 *   // เปิด dialog
 *   setDialog({
 *     title: 'ปิดรับแทง',
 *     message: 'ยืนยันปิดรับแทงรอบ #5?',
 *     type: 'danger',
 *     confirmLabel: 'ยืนยัน',
 *     onConfirm: () => { doSomething(); setDialog(null) },
 *     onCancel: () => setDialog(null),
 *   })
 *
 *   // render
 *   {dialog && <ConfirmDialog {...dialog} />}
 */

'use client'

export interface ConfirmDialogProps {
  /** หัวข้อ dialog */
  title: string
  /** ข้อความรายละเอียด (รองรับ \n สำหรับขึ้นบรรทัดใหม่) */
  message: string
  /** สี/ประเภท: warning (สีเหลือง), danger (สีแดง), info (สีเขียว) */
  type?: 'warning' | 'danger' | 'info'
  /** ข้อความปุ่มยืนยัน (default: "ยืนยัน") */
  confirmLabel?: string
  /** ข้อความปุ่มยกเลิก (default: "ยกเลิก") */
  cancelLabel?: string
  /** callback เมื่อกดยืนยัน */
  onConfirm: () => void
  /** callback เมื่อกดยกเลิก */
  onCancel: () => void
}

/* Icon + สี ตาม type */
const typeConfig = {
  warning: { icon: '🔔', color: '#f5a623', btnClass: 'btn btn-primary' },
  danger:  { icon: '⚠️', color: '#ef4444', btnClass: 'btn btn-danger' },
  info:    { icon: '✅', color: '#00e5a0', btnClass: 'btn btn-success' },
}

export default function ConfirmDialog({
  title, message, type = 'warning',
  confirmLabel = 'ยืนยัน', cancelLabel = 'ยกเลิก',
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  const cfg = typeConfig[type]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: 12, padding: '28px 24px', maxWidth: 380, width: '100%',
        textAlign: 'center',
        animation: 'fadeSlideUp 0.2s ease',
      }}>
        {/* Icon */}
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {cfg.icon}
        </div>

        {/* Title */}
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: cfg.color }}>
          {title}
        </div>

        {/* Message */}
        <div style={{
          fontSize: 13, color: 'var(--text-secondary)',
          marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line',
        }}>
          {message}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1, height: 38 }}>
            {cancelLabel}
          </button>
          <button onClick={onConfirm} className={cfg.btnClass} style={{ flex: 1, height: 38, fontWeight: 600 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
