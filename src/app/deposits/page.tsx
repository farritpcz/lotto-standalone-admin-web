/**
 * Admin — รายการฝากเงิน (Deposit Requests)
 *
 * Features:
 * - ID แสดงเป็น DPS00001 format
 * - Search input ค้นหา username
 * - คลิกรายการดูรายละเอียด (modal)
 * - อนุมัติ / ปฏิเสธ / ยกเลิกรายการที่สำเร็จแล้ว
 * - ใช้ ConfirmDialog แทน browser confirm
 * - username คลิก → new tab หน้าสมาชิก
 * - ยอดเงินแสดง format .00
 */
'use client'

import { useEffect, useState } from 'react'
import { depositApi } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

/* ── Status config ────────────────────────────────────────────────────── */
const statusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved:  { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected:  { cls: 'badge-error', label: 'ปฏิเสธ' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ปฏิเสธ' },
]

/* ── Types ─────────────────────────────────────────────────────────────── */
interface DepositRow {
  id: number; member_id: number; username: string
  amount: number; status: string; created_at: string
  approved_at?: string; note?: string
}

/* Format ID เป็น DPS00001 */
const fmtId = (id: number) => `DPS${String(id).padStart(5, '0')}`

/* Format เงิน .00 */
const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* Format datetime */
const fmtDate = (s: string) => {
  try {
    const d = new Date(s)
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
  } catch { return s }
}

const PER_PAGE = 20

/* ── Component ─────────────────────────────────────────────────────────── */
export default function DepositsPage() {
  const [rows, setRows] = useState<DepositRow[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRow, setSelectedRow] = useState<DepositRow | null>(null)
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)

  /* โหลดข้อมูล */
  const fetchData = () => {
    setLoading(true)
    depositApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE })
      .then(res => {
        setRows(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [filter, search])
  useEffect(() => { fetchData() }, [filter, search, page])

  /* ── Actions ─────────────────────────────────────────────────────────── */
  const handleApprove = (row: DepositRow) => {
    setConfirmDlg({
      title: 'อนุมัติฝากเงิน',
      message: `ยืนยันอนุมัติรายการ ${fmtId(row.id)}?\nจำนวน ${fmtMoney(row.amount)} → เพิ่มเครดิตให้ ${row.username}`,
      type: 'info',
      confirmLabel: '✓ อนุมัติ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try { await depositApi.approve(row.id); fetchData() }
        catch { alert('เกิดข้อผิดพลาด') }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  const handleReject = (row: DepositRow) => {
    setConfirmDlg({
      title: 'ปฏิเสธรายการฝาก',
      message: `ยืนยันปฏิเสธรายการ ${fmtId(row.id)}?\nจำนวน ${fmtMoney(row.amount)} ของ ${row.username}`,
      type: 'danger',
      confirmLabel: '✕ ปฏิเสธ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try { await depositApi.reject(row.id); fetchData() }
        catch { alert('เกิดข้อผิดพลาด') }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  const handleCancel = (row: DepositRow) => {
    setConfirmDlg({
      title: 'ยกเลิกรายการที่อนุมัติแล้ว',
      message: `ยืนยันยกเลิก ${fmtId(row.id)}?\nจะหักเครดิต ${fmtMoney(row.amount)} คืนจาก ${row.username}`,
      type: 'danger',
      confirmLabel: 'ยกเลิกรายการ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try { await depositApi.reject(row.id); fetchData() } // TODO: dedicated cancel endpoint
        catch { alert('เกิดข้อผิดพลาด') }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  /* ── Render ──────────────────────────────────────────────────────────── */
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>รายการฝากเงิน</h1>
        <span className="label">{total} รายการ</span>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filterTabs.map(tab => (
          <button key={tab.key} onClick={() => setFilter(tab.key)}
            className={filter === tab.key ? 'btn btn-primary' : 'btn btn-ghost'} style={{ fontSize: 12 }}>
            {tab.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input
          type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา username..." className="input" style={{ width: 200, height: 32 }}
        />
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
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const st = statusMap[row.status] || statusMap.pending
                return (
                  <tr key={row.id} onClick={() => setSelectedRow(row)} style={{ cursor: 'pointer' }}>
                    {/* ID — DPS format */}
                    <td className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{fmtId(row.id)}</td>
                    {/* Username — คลิก new tab */}
                    <td>
                      <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {row.username || `ID:${row.member_id}`}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: '#00e5a0', fontWeight: 600 }}>{fmtMoney(row.amount)}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="secondary" style={{ fontSize: 12 }}>{fmtDate(row.created_at)}</td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {row.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleApprove(row)} disabled={actionLoading === row.id}
                            className="btn btn-success" style={{ fontSize: 11, height: 26, padding: '0 8px' }}>✓ อนุมัติ</button>
                          <button onClick={() => handleReject(row)} disabled={actionLoading === row.id}
                            className="btn btn-danger" style={{ fontSize: 11, height: 26, padding: '0 8px' }}>✕ ปฏิเสธ</button>
                        </div>
                      )}
                      {row.status === 'approved' && (
                        <button onClick={() => handleCancel(row)} disabled={actionLoading === row.id}
                          className="btn btn-ghost" style={{ fontSize: 11, height: 26, color: 'var(--status-error)' }}>ยกเลิก</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {total > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, paddingBottom: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary">← ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page} / {Math.ceil(total / PER_PAGE)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={rows.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>

      {/* ═══ Detail Modal ═══════════════════════════════════════════════════ */}
      {selectedRow && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => setSelectedRow(null)}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 480, padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmtId(selectedRow.id)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการฝากเงิน</div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="btn btn-ghost">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'สมาชิก', value: selectedRow.username || `ID:${selectedRow.member_id}` },
                { label: 'จำนวนเงิน', value: fmtMoney(selectedRow.amount), color: '#00e5a0', bold: true },
                { label: 'สถานะ', value: (statusMap[selectedRow.status] || statusMap.pending).label },
                { label: 'วันที่แจ้ง', value: fmtDate(selectedRow.created_at) },
                ...(selectedRow.approved_at ? [{ label: 'วันที่ดำเนินการ', value: fmtDate(selectedRow.approved_at) }] : []),
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="label">{row.label}</span>
                  <span style={{ fontWeight: (row as { bold?: boolean }).bold ? 700 : 400, color: (row as { color?: string }).color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Action buttons ใน modal */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {selectedRow.status === 'pending' && (
                <>
                  <button onClick={() => { setSelectedRow(null); handleApprove(selectedRow) }}
                    className="btn btn-success" style={{ flex: 1, height: 36 }}>✓ อนุมัติ</button>
                  <button onClick={() => { setSelectedRow(null); handleReject(selectedRow) }}
                    className="btn btn-danger" style={{ flex: 1, height: 36 }}>✕ ปฏิเสธ</button>
                </>
              )}
              {selectedRow.status === 'approved' && (
                <button onClick={() => { setSelectedRow(null); handleCancel(selectedRow) }}
                  className="btn btn-danger" style={{ flex: 1, height: 36 }}>ยกเลิกรายการ</button>
              )}
              <button onClick={() => setSelectedRow(null)} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog */}
      {confirmDlg && <ConfirmDialog {...confirmDlg} />}
    </div>
  )
}
