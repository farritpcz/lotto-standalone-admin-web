/**
 * Admin — รายการถอนเงิน (Withdraw Requests)
 *
 * Features:
 * - ID แสดงเป็น WDR00001 format
 * - Search input ค้นหา username
 * - คลิกรายการดูรายละเอียด (modal) + ข้อมูลบัญชีสมาชิก
 * - อนุมัติ: เลือก auto/manual transfer
 * - ปฏิเสธ: เลือก คืน/ไม่คืนเครดิต
 * - ใช้ ConfirmDialog
 * - ยอดเงิน format .00
 */
'use client'

import { useEffect, useState } from 'react'
import { withdrawApi } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

/* ── Status config ────────────────────────────────────────────────────── */
const statusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved:  { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected:  { cls: 'badge-error', label: 'ปฏิเสธ' },
}

const filterTabs = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ปฏิเสธ' },
]

/* ── Types ─────────────────────────────────────────────────────────────── */
interface WithdrawRow {
  id: number; member_id: number; username: string
  amount: number; bank_code: string; bank_account_number: string; bank_account_name: string
  status: string; created_at: string; approved_at?: string
}

/* Helpers */
const fmtId = (id: number) => `WDR${String(id).padStart(5, '0')}`
const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (s: string) => {
  try { const d = new Date(s); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}` }
  catch { return s }
}

const PER_PAGE = 20

/* ── Component ─────────────────────────────────────────────────────────── */
export default function WithdrawalsPage() {
  const [rows, setRows] = useState<WithdrawRow[]>([])
  const [filter, setFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRow, setSelectedRow] = useState<WithdrawRow | null>(null)
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  // สำหรับ approve modal — เลือก auto/manual
  const [approveModal, setApproveModal] = useState<WithdrawRow | null>(null)
  // สำหรับ reject modal — เลือก คืน/ไม่คืน
  const [rejectModal, setRejectModal] = useState<WithdrawRow | null>(null)

  const fetchData = () => {
    setLoading(true)
    withdrawApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE })
      .then(res => { setRows(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { setPage(1) }, [filter, search])
  useEffect(() => { fetchData() }, [filter, search, page])

  /* ── Approve — เลือก auto/manual ─────────────────────────────────────── */
  const doApprove = async (row: WithdrawRow, mode: 'auto' | 'manual') => {
    setApproveModal(null); setActionLoading(row.id)
    try {
      await withdrawApi.approve(row.id) // TODO: ส่ง mode ไป API
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  /* ── Reject — เลือก คืน/ไม่คืน ────────────────────────────────────────── */
  const doReject = async (row: WithdrawRow, refund: boolean) => {
    setRejectModal(null); setActionLoading(row.id)
    try {
      await withdrawApi.reject(row.id) // TODO: ส่ง refund flag ไป API
      fetchData()
    } catch { alert('เกิดข้อผิดพลาด') }
    finally { setActionLoading(null) }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>รายการถอนเงิน</h1>
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
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ค้นหา username..." className="input" style={{ width: 200, height: 32 }} />
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
                <th>ธนาคาร</th>
                <th>เลขบัญชี</th>
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
                    <td className="mono" style={{ color: '#f5a623', fontWeight: 600, fontSize: 12 }}>{fmtId(row.id)}</td>
                    <td>
                      <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {row.username || `ID:${row.member_id}`}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>{fmtMoney(row.amount)}</td>
                    <td className="secondary" style={{ fontSize: 12 }}>{row.bank_code || '—'}</td>
                    <td className="mono secondary" style={{ fontSize: 12 }}>{row.bank_account_number || '—'}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="secondary" style={{ fontSize: 12 }}>{fmtDate(row.created_at)}</td>
                    <td style={{ textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                      {row.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setApproveModal(row)} disabled={actionLoading === row.id}
                            className="btn btn-success" style={{ fontSize: 11, height: 26, padding: '0 8px' }}>✓ อนุมัติ</button>
                          <button onClick={() => setRejectModal(row)} disabled={actionLoading === row.id}
                            className="btn btn-danger" style={{ fontSize: 11, height: 26, padding: '0 8px' }}>✕ ปฏิเสธ</button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

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
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 500, padding: 24 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f5a623' }}>{fmtId(selectedRow.id)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการถอนเงิน</div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="btn btn-ghost">✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'สมาชิก', value: selectedRow.username },
                { label: 'จำนวนเงิน', value: fmtMoney(selectedRow.amount), color: '#ef4444', bold: true },
                { label: 'สถานะ', value: (statusMap[selectedRow.status] || statusMap.pending).label },
                { label: 'วันที่แจ้ง', value: fmtDate(selectedRow.created_at) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="label">{r.label}</span>
                  <span style={{ fontWeight: (r as { bold?: boolean }).bold ? 700 : 400, color: (r as { color?: string }).color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* ข้อมูลบัญชีธนาคาร */}
            <div style={{ marginTop: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>บัญชีปลายทาง</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{selectedRow.bank_code || '—'}</div>
              <div className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)', marginTop: 2 }}>{selectedRow.bank_account_number || '—'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedRow.bank_account_name || '—'}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {selectedRow.status === 'pending' && (
                <>
                  <button onClick={() => { setSelectedRow(null); setApproveModal(selectedRow) }}
                    className="btn btn-success" style={{ flex: 1, height: 36 }}>✓ อนุมัติ</button>
                  <button onClick={() => { setSelectedRow(null); setRejectModal(selectedRow) }}
                    className="btn btn-danger" style={{ flex: 1, height: 36 }}>✕ ปฏิเสธ</button>
                </>
              )}
              <button onClick={() => setSelectedRow(null)} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ Approve Modal — เลือก auto/manual ═══════════════════════════ */}
      {approveModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>💸</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-success)', marginBottom: 8 }}>อนุมัติถอนเงิน</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{fmtId(approveModal.id)} — {fmtMoney(approveModal.amount)}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>→ {approveModal.bank_code} {approveModal.bank_account_number}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={() => doApprove(approveModal, 'auto')} className="btn btn-primary" style={{ width: '100%', height: 40 }}>
                🤖 โอนด้วยระบบอัตโนมัติ
              </button>
              <button onClick={() => doApprove(approveModal, 'manual')} className="btn btn-secondary" style={{ width: '100%', height: 40 }}>
                ✋ โอนด้วยมือ (แอดมินโอนเอง)
              </button>
            </div>
            <button onClick={() => setApproveModal(null)} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ═══ Reject Modal — เลือก คืน/ไม่คืน ═════════════════════════════ */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 400, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-error)', marginBottom: 8 }}>ปฏิเสธรายการถอน</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>{fmtId(rejectModal.id)} — {fmtMoney(rejectModal.amount)}</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={() => doReject(rejectModal, true)} className="btn btn-secondary" style={{ width: '100%', height: 40 }}>
                ↩ ปฏิเสธ + คืนเครดิตให้สมาชิก
              </button>
              <button onClick={() => doReject(rejectModal, false)} className="btn btn-danger" style={{ width: '100%', height: 40 }}>
                ✕ ปฏิเสธ + ไม่คืนเครดิต
              </button>
            </div>
            <button onClick={() => setRejectModal(null)} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ConfirmDialog */}
      {confirmDlg && <ConfirmDialog {...confirmDlg} />}
    </div>
  )
}
