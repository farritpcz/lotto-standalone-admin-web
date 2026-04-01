/**
 * Admin — รายการถอนเงิน (Withdraw Requests)
 *
 * - ตาราง pending/approved/rejected withdrawals
 * - แสดงข้อมูลบัญชีสมาชิก (bank_code, account_number, account_name)
 * - ปุ่มอนุมัติ/ปฏิเสธ
 *
 * API: GET /withdrawals, PUT /withdrawals/:id/approve, PUT /withdrawals/:id/reject
 */
'use client'

import { useEffect, useState } from 'react'
import { withdrawApi } from '@/lib/api'

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

interface WithdrawRow {
  id: number; member_id: number; username: string
  amount: number; bank_code: string; bank_account_number: string; bank_account_name: string
  status: string; created_at: string
}

export default function WithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawRow[]>([])
  const [filter, setFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const fetchData = () => {
    setLoading(true)
    withdrawApi.list({ status: filter || undefined, per_page: 50 })
      .then(res => setRows(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchData() }, [filter])

  const handleApprove = async (id: number) => {
    if (!confirm('ยืนยันอนุมัติถอนเงินรายการนี้? (หักเงินสมาชิก)')) return
    setActionLoading(id)
    try {
      await withdrawApi.approve(id)
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  const handleReject = async (id: number) => {
    if (!confirm('ยืนยันปฏิเสธรายการนี้?')) return
    setActionLoading(id)
    try {
      await withdrawApi.reject(id)
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>รายการถอนเงิน</h1>
      </div>

      {/* Filter */}
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

      {/* Table */}
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
                <th>ธนาคาร</th>
                <th>เลขบัญชี</th>
                <th>ชื่อบัญชี</th>
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
                    <td className="mono" style={{ color: '#ef4444', fontWeight: 600 }}>
                      ฿{row.amount.toLocaleString()}
                    </td>
                    <td className="secondary">{row.bank_code || '—'}</td>
                    <td className="mono">{row.bank_account_number || '—'}</td>
                    <td className="secondary">{row.bank_account_name || '—'}</td>
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
