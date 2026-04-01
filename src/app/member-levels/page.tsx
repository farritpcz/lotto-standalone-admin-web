/**
 * Admin — ระบบ Level สมาชิก
 *
 * - CRUD levels (ชื่อ, สี, เงื่อนไข)
 * - กำหนดผลประโยชน์ต่อ level: ค่าคอม %, โบนัส, cashback %
 * - แสดงจำนวนสมาชิกในแต่ละ level
 *
 * ⭐ ตอนนี้ใช้ mock data — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'

const mockLevels = [
  { id: 1, name: 'Bronze', color: '#CD7F32', min_deposit: 0, commission_rate: 0.3, cashback_rate: 0, bonus_pct: 0, member_count: 150 },
  { id: 2, name: 'Silver', color: '#C0C0C0', min_deposit: 5000, commission_rate: 0.5, cashback_rate: 2, bonus_pct: 10, member_count: 35 },
  { id: 3, name: 'Gold', color: '#FFD700', min_deposit: 20000, commission_rate: 0.8, cashback_rate: 5, bonus_pct: 20, member_count: 12 },
  { id: 4, name: 'Platinum', color: '#E5E4E2', min_deposit: 100000, commission_rate: 1.0, cashback_rate: 8, bonus_pct: 30, member_count: 3 },
]

const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function MemberLevelsPage() {
  const [levels] = useState(mockLevels)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ระบบ Level สมาชิก</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ เพิ่ม Level</button>
      </div>

      {/* Level Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12, marginBottom: 24 }}>
        {levels.map(lv => (
          <div key={lv.id} className="card-surface" style={{ padding: 20 }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: lv.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#000', fontSize: 16 }}>
                {lv.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: lv.color }}>{lv.name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ยอดฝากขั้นต่ำ {fmtMoney(lv.min_deposit)}</div>
              </div>
            </div>

            {/* Benefits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>ค่าคอม Affiliate</span>
                <span className="mono" style={{ color: 'var(--accent)', fontWeight: 600 }}>{lv.commission_rate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>Cashback</span>
                <span className="mono" style={{ color: '#f5a623', fontWeight: 600 }}>{lv.cashback_rate}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>โบนัสฝาก</span>
                <span className="mono" style={{ color: '#a855f7', fontWeight: 600 }}>{lv.bonus_pct}%</span>
              </div>
            </div>

            {/* Member count */}
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>สมาชิก</span>
              <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>{lv.member_count} คน</span>
            </div>

            {/* Edit button */}
            <button className="btn btn-ghost" style={{ width: '100%', marginTop: 12, fontSize: 12 }}>แก้ไข</button>
          </div>
        ))}
      </div>

      {/* ── Add Modal ──────────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 450, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>เพิ่ม Level</div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <div><div className="label" style={{ marginBottom: 4 }}>ชื่อ Level</div><input className="input" placeholder="Gold" /></div>
                <div><div className="label" style={{ marginBottom: 4 }}>สี</div><input type="color" className="input" defaultValue="#FFD700" style={{ padding: 2, height: 36 }} /></div>
              </div>
              <div><div className="label" style={{ marginBottom: 4 }}>ยอดฝากขั้นต่ำ (฿)</div><input type="number" className="input" placeholder="20000" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><div className="label" style={{ marginBottom: 4 }}>ค่าคอม %</div><input type="number" className="input" placeholder="0.8" step="0.1" /></div>
                <div><div className="label" style={{ marginBottom: 4 }}>Cashback %</div><input type="number" className="input" placeholder="5" /></div>
                <div><div className="label" style={{ marginBottom: 4 }}>โบนัส %</div><input type="number" className="input" placeholder="20" /></div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
              <button onClick={() => setShowModal(false)} className="btn btn-primary" style={{ flex: 1 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        💡 ระบบ Level จะเชื่อม API จริงเมื่อพร้อม — ตอนนี้แสดง mock data
      </div>
    </div>
  )
}
