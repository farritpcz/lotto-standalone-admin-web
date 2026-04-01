/**
 * Admin — รายการฝากเงิน (Deposit Requests)
 *
 * - ตาราง pending/approved/rejected deposits
 * - ปุ่มอนุมัติ/ปฏิเสธ (pending เท่านั้น)
 * - Filter by status
 *
 * API: GET /deposits, PUT /deposits/:id/approve, PUT /deposits/:id/reject
 */
'use client'

import { useEffect, useState } from 'react'
import { depositApi } from '@/lib/api'

/* Status badge config */
const statusMap: Record<string, { cls: string; label: string }> = {
  pending:  { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved: { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected: { cls: 'badge-error', label: 'ปฏิเสธ' },
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ปฏิเสธ' },
]

interface DepositRow {
  id: number; member_id: number; username: string
  amount: number; status: string; created_at: string
}

export default function DepositsPage() {
  const [rows, setRows] = useState<DepositRow[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  /* โหลดข้อมูล */
  const fetchData = () => {
    setLoading(true)
    depositApi.list({ status: filter || undefined, per_page: 50 })
      .then(res => setRows(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filter])

  /* อนุมัติ */
  const handleApprove = async (id: number) => {
    if (!confirm('ยืนยันอนุมัติฝากเงินรายการนี้?')) return
    setActionLoading(id)
    try {
      await depositApi.approve(id)
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  /* ปฏิเสธ */
  const handleReject = async (id: number) => {
    if (!confirm('ยืนยันปฏิเสธรายการนี้?')) return
    setActionLoading(id)
    try {
      await depositApi.reject(id)
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="page-container">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>รายการฝากเงิน</h1>
      </div>

      {/* ── Filter tabs ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {filterTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={filter === tab.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12 }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่มีรายการ</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>สมาชิก</th>
                <th>จำนวนเงิน</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const st = statusMap[row.status] || statusMap.pending
                return (
                  <tr key={row.id}>
                    <td className="mono secondary">#{row.id}</td>
                    <td>{row.username || `ID:${row.member_id}`}</td>
                    <td className="mono" style={{ color: '#00e5a0', fontWeight: 600 }}>
                      ฿{row.amount.toLocaleString()}
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="secondary" style={{ fontSize: 12 }}>
                      {new Date(row.created_at).toLocaleString('th-TH')}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {row.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleApprove(row.id)}
                            disabled={actionLoading === row.id}
                            className="btn btn-success"
                            style={{ fontSize: 12, height: 28 }}
                          >
                            ✓ อนุมัติ
                          </button>
                          <button
                            onClick={() => handleReject(row.id)}
                            disabled={actionLoading === row.id}
                            className="btn btn-danger"
                            style={{ fontSize: 12, height: 28 }}
                          >
                            ✕ ปฏิเสธ
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
