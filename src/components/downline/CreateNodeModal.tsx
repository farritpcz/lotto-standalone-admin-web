// Component: CreateNodeModal — modal to create a new downline node (web)
// Parent: src/app/downline/page.tsx

'use client'

import { type AgentNode } from '@/lib/api'
import { CreateForm, ThemeOption } from './types'

interface Props {
  parentNode: AgentNode | null
  mySharePercent: number
  form: CreateForm
  themes: ThemeOption[]
  setForm: (f: CreateForm) => void
  onClose: () => void
  onSubmit: () => void
}

export default function CreateNodeModal({
  parentNode, mySharePercent, form, themes, setForm, onClose, onSubmit,
}: Props) {
  const maxPercent = parentNode ? parentNode.share_percent : mySharePercent

  // สร้าง options จาก maxPct-0.5 ลงไปจนถึง 0.5
  const shareOptions: number[] = []
  for (let p = maxPercent - 0.5; p >= 0.5; p -= 0.5) {
    shareOptions.push(Math.round(p * 100) / 100)
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
          {parentNode ? `สร้างเว็บภายใต้ "${parentNode.name}"` : 'สร้างเว็บใหม่'}
        </h2>

        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 16, fontSize: 12,
          background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.15)',
          color: 'var(--text-secondary)',
        }}>
          {parentNode
            ? <>สร้างภายใต้: <strong>{parentNode.name}</strong> ({parentNode.share_percent}%)</>
            : <>Share % ของคุณ: <strong style={{ color: 'var(--accent)', fontSize: 14 }}>{mySharePercent}%</strong></>
          }
          <span style={{ marginLeft: 8 }}>— ต้องตั้ง % น้อยกว่า <strong>{maxPercent}%</strong></span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="label">ชื่อ *</label>
            <input className="input" placeholder="ชื่อจริงหรือชื่อเล่น"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Username *</label>
              <input className="input" placeholder="สำหรับ login"
                value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Password *</label>
              <input className="input" type="password" placeholder="รหัสผ่าน"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Share % *</label>
            <select className="input" value={form.share_percent}
              onChange={e => setForm({ ...form, share_percent: parseFloat(e.target.value) || 0 })}>
              {shareOptions.map(p => (
                <option key={p} value={p}>{p}%</option>
              ))}
            </select>
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

          {/* ข้อมูลเว็บไซต์ */}
          <div style={{
            marginTop: 8, padding: 16, borderRadius: 8,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
              ข้อมูลเว็บไซต์ (ไม่บังคับ)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <label className="label">รหัสเว็บ</label>
                  <input className="input" placeholder="เช่น jrd88"
                    value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">ชื่อเว็บ</label>
                  <input className="input" placeholder="เช่น เจริญดี88"
                    value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">โดเมน</label>
                <input className="input" placeholder="เช่น jrd88.com (เปลี่ยน Nameserver มาทีหลัง)"
                  value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  หลังสร้างเสร็จ → เปลี่ยน Nameserver ของโดเมนตามที่แสดง → เว็บพร้อมใช้งาน
                </div>
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
                  สามารถเปลี่ยนธีมได้ภายหลังในหน้าตั้งค่าเว็บ
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={onSubmit}>สร้าง</button>
        </div>
      </div>
    </div>
  )
}
