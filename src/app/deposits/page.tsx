/**
 * Admin — รายการฝากเงิน (Deposit Requests)
 *
 * ⭐ Redesign: stat cards + search debounce + toast + bug fixes
 *
 * Features:
 * - 4 stat cards: รอดำเนินการ / อนุมัติวันนี้ / ยอดฝากวันนี้ / ทั้งหมด
 * - Filter tabs + search (debounce 400ms)
 * - ตาราง: ID, สมาชิก, จำนวน, สลิป, สถานะ, วันที่, จัดการ
 * - Detail modal (สลิป + ข้อมูล + action buttons)
 * - Toast feedback สำหรับทุก action
 *
 * Bug Fixes:
 * - ✅ Cancel เรียก depositApi.cancel() แทน reject()
 * - ✅ alert() → toast.error() + toast.success()
 * - ✅ search debounce 400ms
 * - ✅ hardcode colors → design tokens
 *
 * API: depositApi.list(), .approve(), .reject(), .cancel()
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { depositApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import {
  ArrowDownToLine, Clock, CheckCircle, XCircle,
  Search, RefreshCw, Eye, FileText, ImageIcon,
} from 'lucide-react'

// ─── Status config ───────────────────────────────────────────────────
const statusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved:  { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected:  { cls: 'badge-error', label: 'ปฏิเสธ' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
  unmatched: { cls: 'badge-warning', label: 'ไม่ตรงยอด' },
  expired:   { cls: 'badge-neutral', label: 'หมดอายุ' },
}

// ─── Filter tabs (ใช้กรอง status) ────────────────────────────────────
const filterTabs = [
  { key: '', label: 'ทั้งหมด', icon: FileText },
  { key: 'pending', label: 'รอดำเนินการ', icon: Clock },
  { key: 'approved', label: 'อนุมัติแล้ว', icon: CheckCircle },
  { key: 'rejected', label: 'ปฏิเสธ', icon: XCircle },
  { key: 'unmatched', label: 'ไม่ตรงยอด', icon: ArrowDownToLine },
]

// ─── Types ───────────────────────────────────────────────────────────
interface DepositRow {
  id: number; member_id: number; username: string
  amount: number; status: string; created_at: string
  approved_at?: string; note?: string; reject_reason?: string
  slip_url?: string | null; auto_matched?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────
const fmtId = (id: number) => `DPS${String(id).padStart(5, '0')}`
const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (s: string) => {
  try {
    return new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
  } catch { return s }
}
// ⭐ relative time เช่น "2 นาทีที่แล้ว"
const relTime = (s: string) => {
  try {
    const diff = Date.now() - new Date(s).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'เมื่อกี้'
    if (mins < 60) return `${mins} นาทีที่แล้ว`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs} ชม.ที่แล้ว`
    return `${Math.floor(hrs / 24)} วันที่แล้ว`
  } catch { return '' }
}
// ⭐ ดึง error message จาก API response
const getErrMsg = (err: unknown) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด'

const PER_PAGE = 20

// ─── Component ───────────────────────────────────────────────────────
export default function DepositsPage() {
  // State
  const [rows, setRows] = useState<DepositRow[]>([])
  const [filter, setFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')  // ⭐ controlled input
  const [search, setSearch] = useState('')              // ⭐ debounced value ที่ใช้ query API
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRow, setSelectedRow] = useState<DepositRow | null>(null)
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  const { toast } = useToast()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // ⭐ Debounce search — 400ms หลังหยุดพิมพ์
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // ── โหลดข้อมูล ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true)
    depositApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE })
      .then(res => {
        setRows(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [filter, search, page, toast])

  useEffect(() => { setPage(1) }, [filter, search])
  useEffect(() => { fetchData() }, [fetchData])

  // ── Stat cards (คำนวณจาก rows ปัจจุบัน) ───────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const pendingCount = rows.filter(r => r.status === 'pending').length
  const approvedToday = rows.filter(r => r.status === 'approved' && r.approved_at?.startsWith(today)).length
  const amountToday = rows.filter(r => r.status === 'approved' && r.approved_at?.startsWith(today))
    .reduce((sum, r) => sum + r.amount, 0)

  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Actions ────────────────────────────────────────────────────────

  // ⭐ อนุมัติฝาก — เพิ่มเครดิต + โบนัสฝากครั้งแรก (ถ้ามี)
  const handleApprove = (row: DepositRow) => {
    setConfirmDlg({
      title: 'อนุมัติฝากเงิน',
      message: `ยืนยันอนุมัติ ${fmtId(row.id)}?\n${fmtMoney(row.amount)} → เพิ่มเครดิตให้ ${row.username}`,
      type: 'info',
      confirmLabel: 'อนุมัติ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try {
          await depositApi.approve(row.id)
          toast.success(`อนุมัติ ${fmtId(row.id)} สำเร็จ — เพิ่ม ${fmtMoney(row.amount)} ให้ ${row.username}`)
          fetchData()
        } catch (err) { toast.error(getErrMsg(err)) }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  // ⭐ ปฏิเสธฝาก — ไม่เพิ่มเงิน
  const handleReject = (row: DepositRow) => {
    setConfirmDlg({
      title: 'ปฏิเสธรายการฝาก',
      message: `ยืนยันปฏิเสธ ${fmtId(row.id)}?\n${fmtMoney(row.amount)} ของ ${row.username} จะไม่ถูกเพิ่ม`,
      type: 'danger',
      confirmLabel: 'ปฏิเสธ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try {
          await depositApi.reject(row.id)
          toast.success(`ปฏิเสธ ${fmtId(row.id)} แล้ว`)
          fetchData()
        } catch (err) { toast.error(getErrMsg(err)) }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  // ⭐ ยกเลิกฝากที่อนุมัติแล้ว — หักเครดิตคืน (ใช้ cancel endpoint)
  const handleCancel = (row: DepositRow) => {
    setConfirmDlg({
      title: 'ยกเลิกรายการที่อนุมัติแล้ว',
      message: `ยืนยันยกเลิก ${fmtId(row.id)}?\nจะหัก ${fmtMoney(row.amount)} คืนจาก ${row.username}`,
      type: 'danger',
      confirmLabel: 'ยกเลิกรายการ',
      onConfirm: async () => {
        setConfirmDlg(null); setActionLoading(row.id)
        try {
          await depositApi.cancel(row.id, 'ยกเลิกโดยแอดมิน')
          toast.success(`ยกเลิก ${fmtId(row.id)} แล้ว — หัก ${fmtMoney(row.amount)} จาก ${row.username}`)
          fetchData()
        } catch (err) { toast.error(getErrMsg(err)) }
        finally { setActionLoading(null) }
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>รายการฝากเงิน</h1>
          <p className="label" style={{ marginTop: 4 }}>ทั้งหมด {total} รายการ</p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard icon={Clock} label="รอดำเนินการ" value={String(pendingCount)} color="var(--status-warning)" />
        <StatCard icon={CheckCircle} label="อนุมัติวันนี้" value={String(approvedToday)} color="var(--status-success)" />
        <StatCard icon={ArrowDownToLine} label="ยอดฝากวันนี้" value={fmtMoney(amountToday)} color="var(--accent)" />
        <StatCard icon={FileText} label="ทั้งหมด (หน้านี้)" value={String(total)} color="var(--status-info)" />
      </div>

      {/* ── Filter Tabs + Search ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filterTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={filter === tab.key ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12, gap: 4 }}>
              <Icon size={13} /> {tab.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        {/* ⭐ Search input พร้อม icon + debounce */}
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="ค้นหา username..." className="input"
            style={{ width: 220, height: 32, paddingLeft: 32 }} />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลด..." />
        ) : rows.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontSize: 14 }}>ไม่พบรายการ{filter ? ` (${filterTabs.find(t => t.key === filter)?.label})` : ''}</div>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>สมาชิก</th>
                <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                <th style={{ textAlign: 'center' }}>สลิป</th>
                <th>สถานะ</th>
                <th>วันที่</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const st = statusMap[row.status] || statusMap.pending
                return (
                  <tr key={row.id} onClick={() => setSelectedRow(row)} style={{ cursor: 'pointer' }}>
                    <td className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>
                      {fmtId(row.id)}
                    </td>
                    <td>
                      <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {row.username || `ID:${row.member_id}`}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                      {fmtMoney(row.amount)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {row.slip_url ? (
                        <a href={row.slip_url} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                          style={{ display: 'inline-block', width: 36, height: 36, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                          <img src={row.slip_url} alt="slip" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </a>
                      ) : (
                        <ImageIcon size={16} style={{ color: 'var(--text-tertiary)', opacity: 0.4 }} />
                      )}
                    </td>
                    <td>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {row.auto_matched && <span className="badge badge-info" style={{ marginLeft: 4, fontSize: 10 }}>AUTO</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{fmtDate(row.created_at)}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{relTime(row.created_at)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {row.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => handleApprove(row)} disabled={actionLoading === row.id}
                            className="btn btn-success" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                            <CheckCircle size={13} /> อนุมัติ
                          </button>
                          <button onClick={() => handleReject(row)} disabled={actionLoading === row.id}
                            className="btn btn-danger" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                            <XCircle size={13} /> ปฏิเสธ
                          </button>
                        </div>
                      )}
                      {row.status === 'approved' && (
                        <button onClick={() => handleCancel(row)} disabled={actionLoading === row.id}
                          className="btn btn-ghost" style={{ fontSize: 11, height: 28, color: 'var(--status-error)', gap: 4 }}>
                          <XCircle size={13} /> ยกเลิก
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            padding: '12px 16px', borderTop: '1px solid var(--border)',
          }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="btn btn-secondary" style={{ fontSize: 12 }}>ก่อนหน้า</button>
            <span className="label" style={{ padding: '0 8px' }}>หน้า {page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
              className="btn btn-secondary" style={{ fontSize: 12 }}>ถัดไป</button>
          </div>
        )}
      </div>

      {/* ══ Detail Modal ═══════════════════════════════════════════════ */}
      {selectedRow && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setSelectedRow(null)}>
          <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24 }}
            onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Eye size={20} color="var(--accent)" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>{fmtId(selectedRow.id)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการฝากเงิน</div>
                </div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            {/* สลิปโอนเงิน */}
            {selectedRow.slip_url && (
              <div style={{ marginBottom: 16, textAlign: 'center' }}>
                <a href={selectedRow.slip_url} target="_blank" rel="noopener">
                  <img src={selectedRow.slip_url} alt="slip"
                    style={{ maxWidth: '100%', maxHeight: 280, borderRadius: 8, border: '1px solid var(--border)' }} />
                </a>
              </div>
            )}

            {/* รายละเอียด */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <DetailField label="สมาชิก" value={selectedRow.username || `ID:${selectedRow.member_id}`} />
              <DetailField label="จำนวนเงิน" value={fmtMoney(selectedRow.amount)} color="var(--accent)" bold />
              <DetailField label="สถานะ">
                <span className={`badge ${(statusMap[selectedRow.status] || statusMap.pending).cls}`}>
                  {(statusMap[selectedRow.status] || statusMap.pending).label}
                </span>
                {selectedRow.auto_matched && <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>AUTO MATCHED</span>}
              </DetailField>
              <DetailField label="วันที่แจ้ง" value={`${fmtDate(selectedRow.created_at)} (${relTime(selectedRow.created_at)})`} />
              {selectedRow.approved_at && <DetailField label="วันที่ดำเนินการ" value={fmtDate(selectedRow.approved_at)} />}
              {selectedRow.reject_reason && <DetailField label="เหตุผล" value={selectedRow.reject_reason} color="var(--status-error)" />}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {selectedRow.status === 'pending' && (
                <>
                  <button onClick={() => { const r = selectedRow; setSelectedRow(null); handleApprove(r) }}
                    className="btn btn-success" style={{ flex: 1, height: 36, gap: 4 }}>
                    <CheckCircle size={15} /> อนุมัติ
                  </button>
                  <button onClick={() => { const r = selectedRow; setSelectedRow(null); handleReject(r) }}
                    className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                    <XCircle size={15} /> ปฏิเสธ
                  </button>
                </>
              )}
              {selectedRow.status === 'approved' && (
                <button onClick={() => { const r = selectedRow; setSelectedRow(null); handleCancel(r) }}
                  className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                  <XCircle size={15} /> ยกเลิกรายการ
                </button>
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

// ── Stat Card Component ──────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number }>; label: string; value: string; color: string
}) {
  return (
    <div className="stat-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={15} />
        <span className="label">{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}

// ── Detail Field Component ───────────────────────────────────────────
function DetailField({ label, value, color, bold, children }: {
  label: string; value?: string; color?: string; bold?: boolean; children?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span className="label">{label}</span>
      {children || (
        <span style={{ fontWeight: bold ? 700 : 400, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {value}
        </span>
      )}
    </div>
  )
}
