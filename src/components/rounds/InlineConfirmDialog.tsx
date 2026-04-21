// Inline confirm dialog — centered modal w/ danger/warning theme
// Parent: src/app/rounds/page.tsx
// NOTE: ไฟล์ rounds ยังใช้ dialog custom inline แทน components/ConfirmDialog.tsx
//       เพื่อรักษา look & feel เดิม (emoji + สี custom)

'use client'

export interface InlineDialog {
  title: string
  message: string
  type: 'warning' | 'danger'
  confirmLabel?: string
  onConfirm: () => void
}

export default function InlineConfirmDialog({ dialog, onCancel }: { dialog: InlineDialog; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>{dialog.type === 'danger' ? '⚠️' : '🔔'}</div>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: dialog.type === 'danger' ? '#ef4444' : '#f5a623' }}>
          {dialog.title}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
          {dialog.message}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ flex: 1, height: 38 }}>ยกเลิก</button>
          <button onClick={dialog.onConfirm} className={dialog.type === 'danger' ? 'btn btn-danger' : 'btn btn-primary'} style={{ flex: 1, height: 38, fontWeight: 600 }}>
            {dialog.confirmLabel || 'ยืนยัน'}
          </button>
        </div>
      </div>
    </div>
  )
}
