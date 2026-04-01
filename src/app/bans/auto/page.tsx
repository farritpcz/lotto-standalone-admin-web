/**
 * Admin — ระบบอั้นเลขอัตโนมัติ (Auto-Ban Settings)
 *
 * Agent ตั้งค่าล่วงหน้า:
 * - จำกัดยอดรวมต่อเลข (เช่น 3ตัวบน เลข 123 ถ้ายอดรวมเกิน 50,000 → อั้นอัตโนมัติ)
 * - จำกัดยอดรวมต่อ bet type (เช่น 3ตัวบน ทุกเลขรวมเกิน 500,000 → ลดเรท)
 * - ตั้ง threshold สำหรับแต่ละประเภทหวย
 *
 * เมื่อถึง threshold:
 * - full_ban: ปิดรับเลขนั้นเลย
 * - reduce_rate: ลดเรทจ่าย (เช่น จาก x900 → x500)
 * - max_amount: จำกัดยอดสูงสุดต่อคน
 *
 * ⭐ ตอนนี้เป็น UI config — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'

/* ── Types ─────────────────────────────────────────────────────────────── */
interface AutoBanRule {
  id: number
  lottery_type: string      // ประเภทหวย
  bet_type: string          // ประเภทแทง
  threshold_amount: number  // ยอดรวมที่ trigger
  action: 'full_ban' | 'reduce_rate' | 'max_amount'
  reduce_rate_to?: number   // ลดเรทเหลือเท่าไร
  max_per_person?: number   // จำกัดต่อคน
  status: 'active' | 'inactive'
}

/* ── Mock rules ────────────────────────────────────────────────────────── */
const mockRules: AutoBanRule[] = [
  { id: 1, lottery_type: 'หวยไทย', bet_type: '3 ตัวบน', threshold_amount: 50000, action: 'reduce_rate', reduce_rate_to: 500, status: 'active' },
  { id: 2, lottery_type: 'หวยไทย', bet_type: '2 ตัวบน', threshold_amount: 100000, action: 'full_ban', status: 'active' },
  { id: 3, lottery_type: 'หวยไทย', bet_type: '3 ตัวโต๊ด', threshold_amount: 30000, action: 'max_amount', max_per_person: 100, status: 'active' },
  { id: 4, lottery_type: 'หวยลาว', bet_type: '3 ตัวบน', threshold_amount: 20000, action: 'full_ban', status: 'inactive' },
]

const actionBadge: Record<string, { cls: string; label: string }> = {
  full_ban:    { cls: 'badge-error', label: 'อั้นเต็ม' },
  reduce_rate: { cls: 'badge-warning', label: 'ลดเรท' },
  max_amount:  { cls: 'badge-info', label: 'จำกัดยอด' },
}

const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AutoBanPage() {
  const [rules] = useState(mockRules)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    lottery_type: 'หวยไทย', bet_type: '3 ตัวบน',
    threshold_amount: '', action: 'full_ban' as string,
    reduce_rate_to: '', max_per_person: '',
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ระบบอั้นเลขอัตโนมัติ</h1>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">+ เพิ่มกฎ</button>
      </div>

      {/* คำอธิบาย */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          <strong style={{ color: 'var(--text-primary)' }}>ระบบอั้นอัตโนมัติ</strong> จะตรวจสอบยอดรวมของแต่ละเลขในแต่ละรอบ<br />
          เมื่อยอดรวมถึง threshold ที่ตั้งไว้ ระบบจะ:<br />
          • <span style={{ color: '#ef4444' }}>อั้นเต็ม</span> — ปิดรับเลขนั้นเลย<br />
          • <span style={{ color: '#f5a623' }}>ลดเรท</span> — ลดอัตราจ่าย (เช่น x900 → x500)<br />
          • <span style={{ color: '#3b82f6' }}>จำกัดยอด</span> — จำกัดยอดสูงสุดต่อคนต่อเลข
        </div>
      </div>

      {/* Table */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>ประเภทหวย</th>
              <th>ประเภทแทง</th>
              <th style={{ textAlign: 'right' }}>Threshold</th>
              <th>Action</th>
              <th>รายละเอียด</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rules.map(r => {
              const ab = actionBadge[r.action] || actionBadge.full_ban
              return (
                <tr key={r.id}>
                  <td className="mono secondary">#{r.id}</td>
                  <td>{r.lottery_type}</td>
                  <td className="secondary">{r.bet_type}</td>
                  <td className="mono" style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 600 }}>{fmtMoney(r.threshold_amount)}</td>
                  <td><span className={`badge ${ab.cls}`}>{ab.label}</span></td>
                  <td className="secondary" style={{ fontSize: 12 }}>
                    {r.action === 'reduce_rate' && `ลดเรทเหลือ x${r.reduce_rate_to}`}
                    {r.action === 'max_amount' && `สูงสุด ${fmtMoney(r.max_per_person || 0)}/คน`}
                    {r.action === 'full_ban' && '—'}
                  </td>
                  <td>
                    <span className={`badge ${r.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {r.status === 'active' ? 'เปิดใช้' : 'ปิด'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, height: 26, color: 'var(--status-error)' }}>ลบ</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Rule Modal ─────────────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 480, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>เพิ่มกฎอั้นอัตโนมัติ</div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ประเภทหวย</div>
                  <select value={form.lottery_type} onChange={e => setForm({ ...form, lottery_type: e.target.value })} className="input">
                    <option>หวยไทย</option><option>หวยลาว</option><option>หวยหุ้นไทย</option><option>หวยยี่กี</option>
                  </select>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ประเภทแทง</div>
                  <select value={form.bet_type} onChange={e => setForm({ ...form, bet_type: e.target.value })} className="input">
                    <option>3 ตัวบน</option><option>3 ตัวโต๊ด</option><option>2 ตัวบน</option><option>2 ตัวล่าง</option><option>วิ่งบน</option><option>วิ่งล่าง</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="label" style={{ marginBottom: 4 }}>ยอดรวม Threshold (฿)</div>
                <input type="number" value={form.threshold_amount} onChange={e => setForm({ ...form, threshold_amount: e.target.value })}
                  className="input" placeholder="50000" />
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>เมื่อยอดรวมทุกคนต่อเลขเกินค่านี้ → trigger action</div>
              </div>

              <div>
                <div className="label" style={{ marginBottom: 4 }}>Action เมื่อถึง Threshold</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['full_ban', 'reduce_rate', 'max_amount'].map(a => (
                    <button key={a} onClick={() => setForm({ ...form, action: a })}
                      className={form.action === a ? 'btn btn-primary' : 'btn btn-secondary'}
                      style={{ flex: 1, fontSize: 12 }}>
                      {actionBadge[a].label}
                    </button>
                  ))}
                </div>
              </div>

              {form.action === 'reduce_rate' && (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>ลดเรทเหลือ (x)</div>
                  <input type="number" value={form.reduce_rate_to} onChange={e => setForm({ ...form, reduce_rate_to: e.target.value })}
                    className="input" placeholder="500" />
                </div>
              )}

              {form.action === 'max_amount' && (
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>จำกัดยอดสูงสุดต่อคน (฿)</div>
                  <input type="number" value={form.max_per_person} onChange={e => setForm({ ...form, max_per_person: e.target.value })}
                    className="input" placeholder="100" />
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
              <button onClick={() => setShowModal(false)} className="btn btn-primary" style={{ flex: 1 }}>บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        💡 ระบบอั้นอัตโนมัติจะเชื่อม API + job ตรวจสอบยอดจริงเมื่อพร้อม — ตอนนี้เป็น UI config
      </div>
    </div>
  )
}
