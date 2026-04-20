/**
 * Admin — รายการถอนเงิน (Withdraw Requests)
 *
 * ⭐ Redesign: stat cards + search debounce + toast + bug fixes
 *
 * Features:
 * - 4 stat cards, filter tabs + date filter + search (debounce 400ms)
 * - ตาราง: ID, สมาชิก, จำนวน, ธนาคาร, เลขบัญชี, สถานะ, วันที่, จัดการ
 * - Detail modal / Approve modal (auto vs manual) / Reject modal (refund choice)
 *
 * Split 2026-04-21: config → _config.ts; modals → WithdrawDetailModal/ApproveModal/RejectModal.tsx
 * API: withdrawApi.list(), .approve(id, mode), .reject(id, refund, reason)
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { withdrawApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import BankIcon from '@/components/BankIcon'
import LogHistoryModal from '@/components/LogHistoryModal'
import StatCard from '@/components/admin/StatCard'
import {
  ArrowUpFromLine, Clock, CheckCircle, XCircle,
  Search, RefreshCw, FileText, History, Calendar,
} from 'lucide-react'
import {
  statusMap, filterTabs, fmtId, fmtMoney, fmtDate, relTime, getErrMsg, PER_PAGE,
  type WithdrawRow,
} from './_config'
import WithdrawDetailModal from './WithdrawDetailModal'
import ApproveModal from './ApproveModal'
import RejectModal from './RejectModal'

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
  const [logModal, setLogModal] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // ⭐ Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // ── Date filter helpers ─────────────────────────────────────────────
  const fmtISODate = (d: Date) => d.toISOString().split('T')[0]
  const getDateRange = () => {
    if (dateFilter === 'today') {
      const d = fmtISODate(new Date())
      return { date_from: d, date_to: d }
    }
    if (dateFilter === 'yesterday') {
      const y = new Date(); y.setDate(y.getDate() - 1)
      const d = fmtISODate(y)
      return { date_from: d, date_to: d }
    }
    if (dateFilter === 'custom') {
      return { date_from: dateFrom || undefined, date_to: dateTo || undefined }
    }
    return {}
  }

  const handleDateFilter = (key: string) => {
    if (key === dateFilter) { setDateFilter(''); return }
    setDateFilter(key)
  }

  // ── โหลดข้อมูล ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true)
    const dr = getDateRange()
    withdrawApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE, ...dr })
      .then(res => { setRows(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, page, dateFilter, dateFrom, dateTo, toast])

  useEffect(() => { setPage(1) }, [filter, search, dateFilter, dateFrom, dateTo])
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

  // ⭐ ปฏิเสธ — ส่ง refund flag + reason
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

      {/* ── Filter Tabs + Date Filter + Search ─────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
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

      {/* ── Date Filter ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'today', label: 'วันนี้' },
          { key: 'yesterday', label: 'เมื่อวาน' },
          { key: 'custom', label: 'กำหนดเอง' },
        ].map(d => (
          <button key={d.key} onClick={() => handleDateFilter(d.key)}
            className={dateFilter === d.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12, gap: 4 }}>
            <Calendar size={13} /> {d.label}
          </button>
        ))}
        {dateFilter === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="input" style={{ height: 32, fontSize: 12, width: 150 }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>ถึง</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="input" style={{ height: 32, fontSize: 12, width: 150 }} />
          </>
        )}
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
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center' }}>
                        {row.status === 'pending' && (
                          <>
                            <button onClick={() => setApproveModal(row)} disabled={actionLoading === row.id}
                              className="btn btn-success" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                              <CheckCircle size={13} /> อนุมัติ
                            </button>
                            <button onClick={() => { setRejectReason(''); setRejectModal(row) }} disabled={actionLoading === row.id}
                              className="btn btn-danger" style={{ fontSize: 11, height: 28, padding: '0 10px', gap: 4 }}>
                              <XCircle size={13} /> ปฏิเสธ
                            </button>
                          </>
                        )}
                        <button onClick={() => setLogModal(row.id)} title="ประวัติรายการ"
                          className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0, minWidth: 0 }}>
                          <History size={14} color="var(--text-tertiary)" />
                        </button>
                      </div>
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

      {/* Modals */}
      {selectedRow && (
        <WithdrawDetailModal
          row={selectedRow}
          onClose={() => setSelectedRow(null)}
          onApprove={(r) => setApproveModal(r)}
          onReject={(r) => { setRejectReason(''); setRejectModal(r) }}
          onCopyAccount={copyAccount}
        />
      )}
      {approveModal && (
        <ApproveModal
          row={approveModal}
          onConfirm={(mode) => doApprove(approveModal, mode)}
          onClose={() => setApproveModal(null)}
        />
      )}
      {rejectModal && (
        <RejectModal
          row={rejectModal}
          reason={rejectReason}
          onReasonChange={setRejectReason}
          onConfirm={(refund) => doReject(rejectModal, refund)}
          onClose={() => setRejectModal(null)}
        />
      )}

      {/* Log History Modal */}
      {logModal && (
        <LogHistoryModal
          title="ประวัติรายการถอนเงิน"
          requestId={logModal}
          fetchLogs={withdrawApi.getLogs}
          onClose={() => setLogModal(null)}
        />
      )}
    </div>
  )
}
