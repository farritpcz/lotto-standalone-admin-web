/**
 * Admin — ระบบโปรโมชั่น (Promotions)
 *
 * - CRUD โปรโมชั่น
 * - เงื่อนไข: min deposit, max bonus, turnover
 * - ระยะเวลา: start/end date
 * - สถานะ: active/inactive/expired
 *
 * ⭐ ตอนนี้ใช้ mock data — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'

/* ── Mock promotions ──────────────────────────────────────────────────── */
const mockPromos = [
  { id: 1, name: 'สมัครใหม่รับโบนัส 100%', type: 'first_deposit', bonus_pct: 100, max_bonus: 1000, min_deposit: 100, turnover: 5, status: 'active', start_date: '2026-04-01', end_date: '2026-04-30' },
  { id: 2, name: 'ฝากเงินรับ 50%', type: 'deposit', bonus_pct: 50, max_bonus: 500, min_deposit: 200, turnover: 3, status: 'active', start_date: '2026-04-01', end_date: '2026-04-15' },
  { id: 3, name: 'คืนยอดเสีย 10%', type: 'cashback', bonus_pct: 10, max_bonus: 5000, min_deposit: 0, turnover: 1, status: 'inactive', start_date: '2026-03-01', end_date: '2026-03-31' },
]

const statusBadge: Record<string, { cls: string; label: string }> = {
  active:   { cls: 'badge-success', label: 'เปิดใช้' },
  inactive: { cls: 'badge-neutral', label: 'ปิดใช้' },
  expired:  { cls: 'badge-error', label: 'หมดอายุ' },
}

const typeBadge: Record<string, string> = {
  first_deposit: 'สมัครใหม่',
  deposit: 'ฝากเงิน',
  cashback: 'คืนยอดเสีย',
  free_credit: 'เครดิตฟรี',
}

const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function PromotionsPage() {
  const [promos] = useState(mockPromos)
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ระบบโปรโมชั่น</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ เพิ่มโปรโมชั่น</button>
      </div>

      <div className="card-surface" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อโปรโมชั่น</th>
              <th>ประเภท</th>
              <th style={{ textAlign: 'right' }}>โบนัส</th>
              <th style={{ textAlign: 'right' }}>Max</th>
              <th style={{ textAlign: 'right' }}>Min ฝาก</th>
              <th style={{ textAlign: 'center' }}>Turnover</th>
              <th>ระยะเวลา</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {promos.map(p => {
              const st = statusBadge[p.status] || statusBadge.inactive
              return (
                <tr key={p.id}>
                  <td className="mono secondary">#{p.id}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td><span className="badge badge-info">{typeBadge[p.type] || p.type}</span></td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{p.bonus_pct}%</td>
                  <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(p.max_bonus)}</td>
                  <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(p.min_deposit)}</td>
                  <td className="mono secondary" style={{ textAlign: 'center' }}>x{p.turnover}</td>
                  <td className="secondary" style={{ fontSize: 12 }}>{p.start_date} ~ {p.end_date}</td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, height: 26 }}>แก้ไข</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Modal (placeholder) ───────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>เพิ่มโปรโมชั่น</div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>ชื่อโปรโมชั่น</div>
                <input className="input" placeholder="เช่น สมัครใหม่รับโบนัส 100%" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ประเภท</div>
                  <select className="input">
                    <option value="first_deposit">สมัครใหม่</option>
                    <option value="deposit">ฝากเงิน</option>
                    <option value="cashback">คืนยอดเสีย</option>
                    <option value="free_credit">เครดิตฟรี</option>
                  </select>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>% โบนัส</div>
                  <input type="number" className="input" placeholder="100" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Max โบนัส (฿)</div>
                  <input type="number" className="input" placeholder="1000" />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Min ฝาก (฿)</div>
                  <input type="number" className="input" placeholder="100" />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Turnover (x)</div>
                  <input type="number" className="input" placeholder="5" />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>วันเริ่ม</div>
                  <input type="date" className="input" />
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>วันสิ้นสุด</div>
                  <input type="date" className="input" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
              <button onClick={() => { setShowModal(false) }} className="btn btn-primary" style={{ flex: 1 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        💡 ระบบโปรโมชั่นจะเชื่อม API จริงเมื่อพร้อม — ตอนนี้แสดง mock data
      </div>
    </div>
  )
}
