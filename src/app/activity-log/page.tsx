/**
 * Admin — Activity Log (บันทึกการใช้งาน)
 *
 * แสดง log การกระทำของ admin ทั้งหมด:
 * - login, logout
 * - approve/reject deposits, withdrawals
 * - submit results, change round status
 * - member status changes, balance adjustments
 *
 * ⭐ ตอนนี้ใช้ mock data — เมื่อ API พร้อมแล้วจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'

/* ── Mock log data ────────────────────────────────────────────────────── */
const mockLogs = [
  { id: 1, admin: 'admin', action: 'login', detail: 'เข้าสู่ระบบ', ip: '127.0.0.1', created_at: '2026-04-02T10:00:00' },
  { id: 2, admin: 'admin', action: 'deposit_approve', detail: 'อนุมัติฝาก DPS00001 ฿500.00 → browseruser1', ip: '127.0.0.1', created_at: '2026-04-02T10:05:00' },
  { id: 3, admin: 'admin', action: 'result_submit', detail: 'กรอกผลรอบ #5 (999/99/56) จ่าย ฿114,600', ip: '127.0.0.1', created_at: '2026-04-02T10:10:00' },
  { id: 4, admin: 'admin', action: 'member_status', detail: 'ระงับสมาชิก thaiuser1 (ID:15)', ip: '127.0.0.1', created_at: '2026-04-02T10:15:00' },
  { id: 5, admin: 'admin', action: 'withdraw_approve', detail: 'อนุมัติถอน WDR00001 ฿300.00 → testuser1 (โอนมือ)', ip: '127.0.0.1', created_at: '2026-04-02T10:20:00' },
  { id: 6, admin: 'admin', action: 'balance_adjust', detail: 'เติมเครดิต ฿1,000 → user0017 (โปรสมัครใหม่)', ip: '127.0.0.1', created_at: '2026-04-02T10:25:00' },
  { id: 7, admin: 'admin', action: 'round_status', detail: 'ปิดรับแทงรอบ #6 (หวยไทย)', ip: '127.0.0.1', created_at: '2026-04-02T10:30:00' },
  { id: 8, admin: 'admin', action: 'ban_create', detail: 'เพิ่มเลขอั้น 999 (3ตัวบน, อั้นเต็ม)', ip: '127.0.0.1', created_at: '2026-04-02T10:35:00' },
]

/* Action → badge config */
const actionBadge: Record<string, { cls: string; label: string }> = {
  login:            { cls: 'badge-info', label: 'เข้าสู่ระบบ' },
  logout:           { cls: 'badge-neutral', label: 'ออกจากระบบ' },
  deposit_approve:  { cls: 'badge-success', label: 'อนุมัติฝาก' },
  deposit_reject:   { cls: 'badge-error', label: 'ปฏิเสธฝาก' },
  withdraw_approve: { cls: 'badge-success', label: 'อนุมัติถอน' },
  withdraw_reject:  { cls: 'badge-error', label: 'ปฏิเสธถอน' },
  result_submit:    { cls: 'badge-warning', label: 'กรอกผล' },
  member_status:    { cls: 'badge-warning', label: 'เปลี่ยนสถานะ' },
  balance_adjust:   { cls: 'badge-info', label: 'ปรับเครดิต' },
  round_status:     { cls: 'badge-warning', label: 'เปลี่ยนรอบ' },
  ban_create:       { cls: 'badge-error', label: 'เพิ่มเลขอั้น' },
  ban_delete:       { cls: 'badge-neutral', label: 'ลบเลขอั้น' },
  setting_update:   { cls: 'badge-info', label: 'แก้ตั้งค่า' },
}

const fmtDate = (s: string) => {
  try { const d = new Date(s); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
  catch { return s }
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  const filtered = mockLogs.filter(log => {
    if (search && !log.detail.toLowerCase().includes(search.toLowerCase()) && !log.admin.includes(search)) return false
    if (actionFilter && log.action !== actionFilter) return false
    return true
  })

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Activity Log</h1>
        <span className="label">{filtered.length} รายการ</span>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="input" style={{ width: 180, height: 32 }}>
          <option value="">ทุก action</option>
          {Object.entries(actionBadge).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <div style={{ flex: 1 }} />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา..." className="input" style={{ width: 200, height: 32 }} />
      </div>

      {/* Table */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>เวลา</th>
              <th>Admin</th>
              <th>Action</th>
              <th>รายละเอียด</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(log => {
              const ab = actionBadge[log.action] || { cls: 'badge-neutral', label: log.action }
              return (
                <tr key={log.id}>
                  <td className="mono secondary" style={{ fontSize: 12 }}>{fmtDate(log.created_at)}</td>
                  <td style={{ fontWeight: 500 }}>{log.admin}</td>
                  <td><span className={`badge ${ab.cls}`}>{ab.label}</span></td>
                  <td style={{ fontSize: 13 }}>{log.detail}</td>
                  <td className="mono secondary" style={{ fontSize: 12 }}>{log.ip}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        💡 Activity log จะบันทึกอัตโนมัติเมื่อเชื่อม API จริง — ตอนนี้แสดง mock data
      </div>
    </div>
  )
}
