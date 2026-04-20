// Component: EditNodeModal — modal to edit a downline node
// Parent: src/app/downline/page.tsx

'use client'

import { type AgentNode } from '@/lib/api'
import { Eye, EyeOff } from 'lucide-react'
import { EditForm, ThemeOption } from './types'

interface Props {
  node: AgentNode
  mySharePercent: number
  form: EditForm
  themes: ThemeOption[]
  setForm: (f: EditForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function EditNodeModal({
  node, mySharePercent, form, themes, setForm, onClose, onSubmit,
}: Props) {
  // สร้าง options ห่าง 0.5% จาก mySharePercent-0.5 ลงไป
  const shareOptions: number[] = []
  for (let p = mySharePercent - 0.5; p >= 0.5; p -= 0.5) {
    shareOptions.push(Math.round(p * 100) / 100)
  }

  const nodeAsRecord = node as unknown as Record<string, unknown>

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card-surface" style={{ width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto', animation: 'fadeSlideUp 0.2s ease' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>ตั้งค่า: {node.name}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">ชื่อ</label>
            <input className="input" value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Username</label>
              <input className="input" value={node.username} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">รหัสเว็บ</label>
              <input className="input" value={(nodeAsRecord.code as string) || '—'} disabled
                style={{ opacity: 0.5, cursor: 'not-allowed' }} />
            </div>
          </div>

          <div>
            <label className="label">
              Share % <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(ของคุณ: {mySharePercent}%)</span>
            </label>
            <select className="input" value={form.share_percent}
              onChange={e => setForm({ ...form, share_percent: parseFloat(e.target.value) || 0 })}>
              {shareOptions.map(p => (
                <option key={p} value={p}>{p}%</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">
              เปลี่ยนรหัสผ่าน <span style={{ fontWeight: 400, color: 'var(--text-tertiary)' }}>(ไม่กรอก = ไม่เปลี่ยน)</span>
            </label>
            <input className="input" type="password" placeholder="รหัสผ่านใหม่"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label">เบอร์โทร</label>
              <input className="input" placeholder="0812345678"
                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">LINE ID</label>
              <input className="input" placeholder="line_id"
                value={form.line_id} onChange={e => setForm({ ...form, line_id: e.target.value })} />
            </div>
          </div>

          <div>
            <label className="label">หมายเหตุ</label>
            <input className="input" placeholder="(optional)"
              value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
          </div>

          <div style={{
            marginTop: 4, padding: 16, borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
              ข้อมูลเว็บไซต์
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label className="label">ชื่อเว็บ</label>
                <input className="input" placeholder="เช่น เจริญดี88"
                  value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
              </div>
              <div>
                <label className="label">โดเมน</label>
                <input className="input" placeholder="เช่น jrd88.com"
                  value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
              </div>
              <div>
                <label className="label">ธีมเว็บไซต์</label>
                <select className="input" value={form.theme}
                  onChange={e => setForm({ ...form, theme: e.target.value })}>
                  {themes.map(t => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  เปลี่ยนธีมจะ reset สีทั้งหมดของเว็บเป็นค่าเริ่มต้นของธีมนั้น
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="label">สถานะ</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className={`btn ${form.status === 'active' ? 'btn-success' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, status: 'active' })}
                style={{ flex: 1 }}
              >
                <Eye size={14} /> เปิดใช้งาน
              </button>
              <button
                className={`btn ${form.status === 'suspended' ? 'btn-danger' : 'btn-secondary'}`}
                onClick={() => setForm({ ...form, status: 'suspended' })}
                style={{ flex: 1 }}
              >
                <EyeOff size={14} /> ระงับ
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={onSubmit}>บันทึก</button>
        </div>
      </div>
    </div>
  )
}
