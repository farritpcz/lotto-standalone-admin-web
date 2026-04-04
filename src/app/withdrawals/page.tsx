/**
 * Admin — รายการถอนเงิน (Withdraw Requests)
 *
 * ⭐ Redesign: stat cards + search debounce + toast + bug fixes
 *
 * Features:
 * - 4 stat cards: รอดำเนินการ / อนุมัติวันนี้ / ยอดถอนวันนี้ / ทั้งหมด
 * - Filter tabs + search (debounce 400ms)
 * - ตาราง: ID, สมาชิก, จำนวน, ธนาคาร, เลขบัญชี, สถานะ, วันที่, จัดการ
 * - Approve modal: เลือก auto/manual transfer
 * - Reject modal: เลือก คืน/ไม่คืน + textarea เหตุผล
 * - Detail modal + copy เลขบัญชี
 * - Toast feedback ทุก action
 *
 * Bug Fixes:
 * - ✅ approve ใช้ withdrawApi.approve(id, mode) แทน raw api.put()
 * - ✅ reject ส่ง refund flag + reason
 * - ✅ ลบ unused confirmDlg state
 * - ✅ alert() → toast
 * - ✅ hardcode colors → design tokens
 * - ✅ search debounce 400ms
 *
 * API: withdrawApi.list(), .approve(id, mode), .reject(id, refund, reason)
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { withdrawApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import BankIcon from '@/components/BankIcon'
import {
  ArrowUpFromLine, Clock, CheckCircle, XCircle,
  Search, RefreshCw, Eye, FileText, Copy, Zap, Hand,
} from 'lucide-react'

// ─── Status config ───────────────────────────────────────────────────
const statusMap: Record<string, { cls: string; label: string }> = {
  pending:  { cls: 'badge-warning', label: 'รอดำเนินการ' },
  approved: { cls: 'badge-success', label: 'อนุมัติแล้ว' },
  rejected: { cls: 'badge-error', label: 'ปฏิเสธ' },
  review:   { cls: 'badge-info', label: 'กำลังตรวจสอบ' },
}

// ─── Filter tabs ─────────────────────────────────────────────────────
const filterTabs = [
  { key: '', label: 'ทั้งหมด', icon: FileText },
  { key: 'pending', label: 'รอดำเนินการ', icon: Clock },
  { key: 'approved', label: 'อนุมัติแล้ว', icon: CheckCircle },
  { key: 'rejected', label: 'ปฏิเสธ', icon: XCircle },
]

// ─── Types ───────────────────────────────────────────────────────────
interface WithdrawRow {
  id: number; member_id: number; username: string
  amount: number; bank_code: string; bank_account_number: string; bank_account_name: string
  status: string; created_at: string; approved_at?: string; reject_reason?: string
  transfer_mode?: string
}

// ─── Helpers ─────────────────────────────────────────────────────────
const fmtId = (id: number) => `WDR${String(id).padStart(5, '0')}`
const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtDate = (s: string) => {
  try { return new Date(s).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) }
  catch { return s }
}
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
const getErrMsg = (err: unknown) =>
  (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'เกิดข้อผิดพลาด'

const PER_PAGE = 20

// ─── Component ───────────────────────────────────────────────────────
export default function WithdrawalsPage() {
  // State
  const [rows, setRows] = useState<WithdrawRow[]>([])
  const [filter, setFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [selectedRow, setSelectedRow] = useState<WithdrawRow | null>(null)
  const { toast } = useToast()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Approve/Reject modals
  const [approveModal, setApproveModal] = useState<WithdrawRow | null>(null)
  const [rejectModal, setRejectModal] = useState<WithdrawRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  // ⭐ Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // ── โหลดข้อมูล ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true)
    withdrawApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE })
      .then(res => { setRows(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  }, [filter, search, page, toast])

  useEffect(() => { setPage(1) }, [filter, search])
  useEffect(() => { fetchData() }, [fetchData])

  // ── Stats ──────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0]
  const pendingCount = rows.filter(r => r.status === 'pending').length
  const approvedToday = rows.filter(r => r.status === 'approved' && r.approved_at?.startsWith(today)).length
  const amountToday = rows.filter(r => r.status === 'approved' && r.approved_at?.startsWith(today))
    .reduce((sum, r) => sum + r.amount, 0)
  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Actions ────────────────────────────────────────────────────────

  // ⭐ อนุมัติ — เลือก auto/manual (ใช้ withdrawApi.approve ที่แก้แล้ว)
  const doApprove = async (row: WithdrawRow, mode: 'auto' | 'manual') => {
    setApproveModal(null); setActionLoading(row.id)
    try {
      await withdrawApi.approve(row.id, mode)
      toast.success(`อนุมัติ ${fmtId(row.id)} สำเร็จ (${mode === 'auto' ? 'โอนอัตโนมัติ' : 'โอนด้วยมือ'})`)
      fetchData()
    } catch (err) { toast.error(getErrMsg(err)) }
    finally { setActionLoading(null) }
  }

  // ⭐ ปฏิเสธ — ส่ง refund flag + reason (แก้ bug ที่ไม่ส่ง refund)
  const doReject = async (row: WithdrawRow, refund: boolean) => {
    setRejectModal(null); setActionLoading(row.id)
    try {
      await withdrawApi.reject(row.id, refund, rejectReason || undefined)
      toast.success(`ปฏิเสธ ${fmtId(row.id)} แล้ว${refund ? ' — คืนเครดิตให้สมาชิก' : ' — ไม่คืนเครดิต'}`)
      setRejectReason('')
      fetchData()
    } catch (err) { toast.error(getErrMsg(err)) }
    finally { setActionLoading(null) }
  }

  // ⭐ Copy เลขบัญชี
  const copyAccount = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('คัดลอกเลขบัญชีแล้ว'))
  }

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>รายการถอนเงิน</h1>
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
        <StatCard icon={ArrowUpFromLine} label="ยอดถอนวันนี้" value={fmtMoney(amountToday)} color="var(--status-error)" />
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
                <th>ธนาคาร</th>
                <th>เลขบัญชี</th>
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
                    <td className="mono" style={{ color: 'var(--status-warning)', fontWeight: 600, fontSize: 12 }}>
                      {fmtId(row.id)}
                    </td>
                    <td>
                      <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {row.username || `ID:${row.member_id}`}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--status-error)', fontWeight: 700, fontSize: 14 }}>
                      {fmtMoney(row.amount)}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        {row.bank_code && <BankIcon code={row.bank_code} size={20} />}
                        <span style={{ color: 'var(--text-secondary)' }}>{row.bank_code || '—'}</span>
                      </span>
                    </td>
                    <td className="mono secondary" style={{ fontSize: 12 }}>{row.bank_account_number || '—'}</td>
                    <td>
                      <span className={`badge ${st.cls}`}>{st.label}</span>
                      {row.transfer_mode === 'auto' && <span className="badge badge-info" style={{ marginLeft: 4, fontSize: 10 }}>AUTO</span>}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{fmtDate(row.created_at)}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{relTime(row.created_at)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      {row.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button onClick={() => setApproveModal(row)} disabled={actionLoading === row.id}
                            className="btn btn-success" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                            <CheckCircle size={13} /> อนุมัติ
                          </button>
                          <button onClick={() => { setRejectReason(''); setRejectModal(row) }} disabled={actionLoading === row.id}
                            className="btn btn-danger" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                            <XCircle size={13} /> ปฏิเสธ
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
          <div className="card-surface" style={{ width: '100%', maxWidth: 500, padding: 24 }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'var(--status-warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Eye size={20} color="var(--status-warning)" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-warning)' }}>{fmtId(selectedRow.id)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>รายละเอียดรายการถอนเงิน</div>
                </div>
              </div>
              <button onClick={() => setSelectedRow(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            {/* ข้อมูลทั่วไป */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <DetailField label="สมาชิก" value={selectedRow.username || `ID:${selectedRow.member_id}`} />
              <DetailField label="จำนวนเงิน" value={fmtMoney(selectedRow.amount)} color="var(--status-error)" bold />
              <DetailField label="สถานะ">
                <span className={`badge ${(statusMap[selectedRow.status] || statusMap.pending).cls}`}>
                  {(statusMap[selectedRow.status] || statusMap.pending).label}
                </span>
                {selectedRow.transfer_mode && (
                  <span className="badge badge-info" style={{ marginLeft: 6, fontSize: 10 }}>
                    {selectedRow.transfer_mode === 'auto' ? 'AUTO' : 'MANUAL'}
                  </span>
                )}
              </DetailField>
              <DetailField label="วันที่แจ้ง" value={`${fmtDate(selectedRow.created_at)} (${relTime(selectedRow.created_at)})`} />
              {selectedRow.approved_at && <DetailField label="วันที่ดำเนินการ" value={fmtDate(selectedRow.approved_at)} />}
              {selectedRow.reject_reason && <DetailField label="เหตุผล" value={selectedRow.reject_reason} color="var(--status-error)" />}
            </div>

            {/* บัญชีปลายทาง */}
            <div style={{ marginTop: 16, background: 'var(--bg-elevated)', borderRadius: 8, padding: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>บัญชีปลายทาง</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                {selectedRow.bank_code && <BankIcon code={selectedRow.bank_code} size={24} />}
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{selectedRow.bank_code || '—'}</span>
              </div>
              {/* เลขบัญชี + ปุ่ม copy */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: 'var(--accent)' }}>
                  {selectedRow.bank_account_number || '—'}
                </span>
                {selectedRow.bank_account_number && (
                  <button onClick={() => copyAccount(selectedRow.bank_account_number)}
                    className="btn btn-ghost" style={{ padding: '2px 6px', height: 24 }} title="คัดลอก">
                    <Copy size={13} />
                  </button>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{selectedRow.bank_account_name || '—'}</div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              {selectedRow.status === 'pending' && (
                <>
                  <button onClick={() => { const r = selectedRow; setSelectedRow(null); setApproveModal(r) }}
                    className="btn btn-success" style={{ flex: 1, height: 36, gap: 4 }}>
                    <CheckCircle size={15} /> อนุมัติ
                  </button>
                  <button onClick={() => { const r = selectedRow; setSelectedRow(null); setRejectReason(''); setRejectModal(r) }}
                    className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                    <XCircle size={15} /> ปฏิเสธ
                  </button>
                </>
              )}
              <button onClick={() => setSelectedRow(null)} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Approve Modal — เลือก auto/manual ═════════════════════════ */}
      {approveModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card-surface" style={{ padding: 24, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: 'var(--status-success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle size={28} color="var(--status-success)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-success)', marginBottom: 4 }}>อนุมัติถอนเงิน</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {fmtId(approveModal.id)} — <span style={{ fontWeight: 600, color: 'var(--status-error)' }}>{fmtMoney(approveModal.amount)}</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              {approveModal.bank_code && <BankIcon code={approveModal.bank_code} size={18} />}
              {approveModal.bank_code} {approveModal.bank_account_number}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={() => doApprove(approveModal, 'auto')}
                className="btn btn-primary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <Zap size={16} /> โอนด้วยระบบอัตโนมัติ
              </button>
              <button onClick={() => doApprove(approveModal, 'manual')}
                className="btn btn-secondary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <Hand size={16} /> โอนด้วยมือ (แอดมินโอนเอง)
              </button>
            </div>
            <button onClick={() => setApproveModal(null)} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
          </div>
        </div>
      )}

      {/* ══ Reject Modal — เลือก คืน/ไม่คืน + เหตุผล ═════════════════ */}
      {rejectModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }}>
          <div className="card-surface" style={{ padding: 24, maxWidth: 420, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
              background: 'var(--status-error-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <XCircle size={28} color="var(--status-error)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-error)', marginBottom: 4 }}>ปฏิเสธรายการถอน</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              {fmtId(rejectModal.id)} — {fmtMoney(rejectModal.amount)}
            </div>

            {/* ⭐ เหตุผลการปฏิเสธ (ใหม่) */}
            <div style={{ textAlign: 'left', marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 4 }}>เหตุผล (ไม่บังคับ)</div>
              <textarea className="input" rows={2} placeholder="เช่น ข้อมูลบัญชีไม่ถูกต้อง..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                style={{ height: 'auto', padding: '8px 12px', resize: 'none' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <button onClick={() => doReject(rejectModal, true)}
                className="btn btn-secondary" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <ArrowUpFromLine size={16} style={{ transform: 'rotate(180deg)' }} /> ปฏิเสธ + คืนเครดิตให้สมาชิก
              </button>
              <button onClick={() => doReject(rejectModal, false)}
                className="btn btn-danger" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <XCircle size={16} /> ปฏิเสธ + ไม่คืนเครดิต (ทุจริต)
              </button>
            </div>
            <button onClick={() => setRejectModal(null)} className="btn btn-ghost" style={{ width: '100%' }}>ยกเลิก</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Stat Card ─────────────────────────────────────────────────────────
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

// ── Detail Field ──────────────────────────────────────────────────────
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
