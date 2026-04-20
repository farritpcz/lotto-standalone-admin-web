/**
 * LevelFormModal — create/edit modal สำหรับระดับสมาชิก
 * Controlled form: parent ส่ง form state + onChange + onSave + onClose
 */
export interface LevelFormState {
  name: string
  color: string
  icon: string
  sort_order: number
  min_deposit_30d: number
  description: string
}

export const emptyForm: LevelFormState = {
  name: '', color: '#FFD700', icon: '', sort_order: 0,
  min_deposit_30d: 0, description: '',
}

const fmtMoney = (n: number) =>
  `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`

interface Props {
  mode: 'create' | 'edit'
  form: LevelFormState
  saving: boolean
  onChange: (patch: Partial<LevelFormState>) => void
  onSave: () => void
  onClose: () => void
}

export default function LevelFormModal({ mode, form, saving, onChange, onSave, onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
      onClick={onClose}
    >
      <div
        className="card-surface"
        style={{ padding: 24, maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
            {mode === 'create' ? 'เพิ่มระดับสมาชิก' : `แก้ไข "${form.name}"`}
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
        </div>

        {/* Live Preview Badge */}
        <div style={{
          padding: 12, marginBottom: 16,
          background: 'var(--bg-secondary, var(--border))',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: form.color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: '#000', fontSize: 20,
            boxShadow: `0 4px 14px ${form.color}66`,
          }}>
            {(form.name[0] || '?').toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: form.color }}>
              {form.name || 'ชื่อระดับ'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              ฝากสะสม 30 วัน ≥ {fmtMoney(form.min_deposit_30d)}
            </div>
          </div>
          <span className="label" style={{ fontSize: 10 }}>PREVIEW</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name + Color */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>ชื่อระดับ *</div>
              <input className="input" placeholder="Gold" value={form.name}
                onChange={e => onChange({ name: e.target.value })} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 4 }}>สี</div>
              <input type="color" className="input" value={form.color}
                onChange={e => onChange({ color: e.target.value })}
                style={{ padding: 2, height: 36 }} />
            </div>
          </div>

          {/* Icon (optional — Lucide name) */}
          <div>
            <div className="label" style={{ marginBottom: 4 }}>ไอคอน (Lucide icon name — optional)</div>
            <input className="input" placeholder="crown / gem / medal / shield"
              value={form.icon}
              onChange={e => onChange({ icon: e.target.value })} />
          </div>

          {/* ⭐ เกณฑ์เดียว: min_deposit_30d */}
          <div>
            <div className="label" style={{ marginBottom: 4 }}>ยอดฝากขั้นต่ำ (บาท) — สะสม 30 วันล่าสุด</div>
            <input type="number" className="input" placeholder="100000"
              value={form.min_deposit_30d || ''}
              onChange={e => onChange({ min_deposit_30d: Number(e.target.value) })} />
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
              สมาชิกจะเลื่อนเข้าระดับนี้เมื่อยอดฝากรวม 30 วันล่าสุด ≥ ค่านี้
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="label" style={{ marginBottom: 4 }}>คำอธิบาย (optional)</div>
            <textarea className="input" rows={2}
              placeholder="ระดับพิเศษสำหรับสมาชิก VIP..."
              value={form.description}
              onChange={e => onChange({ description: e.target.value })}
              style={{ height: 'auto', padding: '8px 12px' }} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }} disabled={saving}>
            ยกเลิก
          </button>
          <button onClick={onSave} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    </div>
  )
}
