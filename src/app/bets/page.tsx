/**
 * Admin — รายการเดิมพัน (Bets Management)
 *
 * ⭐ Redesign: stat cards + date filter + search debounce + cancel/void + log history
 *
 * Features:
 * - 4 stat cards: รอผล / ชนะ / ยอดแทง / ทั้งหมด
 * - Filter tabs: ทั้งหมด | รอผล | ชนะ | แพ้ | ยกเลิก
 * - Date filter: วันนี้ | เมื่อวาน | กำหนดเอง
 * - Search debounce 400ms (username / เลข)
 * - Detail modal (click row)
 * - Cancel modal (คืนเครดิต / ไม่คืน + เหตุผล)
 * - LogHistoryModal (timeline bet lifecycle)
 * - Toast feedback ทุก action
 *
 * API: betMgmtApi.list(), .cancel(), .getLogs()
 */
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { betMgmtApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import LogHistoryModal from '@/components/LogHistoryModal'
import {
  Ticket, Clock, Trophy, XCircle, Ban,
  Search, RefreshCw, Eye, FileText, History, Calendar,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────
// Bill row — group by batch_id (1 row = 1 บิล)
interface BillRow {
  batch_id: string; member_id: number; username: string
  lottery_round_id: number; bet_count: number; numbers: string
  total_amount: number; total_win: number
  pending_count: number; won_count: number; lost_count: number; cancelled_count: number
  created_at: string
}

// Individual bet (ใช้ใน bill detail modal)
interface BetRow {
  id: number; batch_id?: string; member_id: number; number: string; amount: number; rate: number
  status: string; win_amount: number; created_at: string
  settled_at?: string; cancelled_at?: string; cancel_reason?: string
  member?: { id?: number; username: string }
  bet_type?: { name: string; code: string }
  lottery_round?: { id: number; round_number: string; lottery_type?: { name: string } }
}

// ─── Bill status helper ─────────────────────────────────────────────
const getBillStatus = (b: BillRow) => {
  if (b.cancelled_count === b.bet_count) return 'cancelled'
  if (b.pending_count > 0) return 'pending'
  return b.total_win > b.total_amount ? 'won' : 'lost'
}

// ─── Status config ──────────────────────────────────────────────────
// สถานะแต่ละเลข (ใน bill detail)
const betStatusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอผล' },
  won:       { cls: 'badge-success', label: 'ถูก' },
  lost:      { cls: 'badge-error',   label: 'ไม่ถูก' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
}

// สถานะบิลรวม (ดูจากกำไร/ขาดทุน)
const billStatusMap: Record<string, { cls: string; label: string }> = {
  pending:   { cls: 'badge-warning', label: 'รอผล' },
  won:       { cls: 'badge-success', label: 'ลูกค้าชนะ' },
  lost:      { cls: 'badge-error',   label: 'ลูกค้าแพ้' },
  cancelled: { cls: 'badge-neutral', label: 'ยกเลิก' },
}

// ─── Filter tabs ────────────────────────────────────────────────────
const filterTabs = [
  { key: '',          label: 'ทั้งหมด', icon: FileText },
  { key: 'pending',   label: 'รอผล',    icon: Clock },
  { key: 'won',       label: 'ชนะ',     icon: Trophy },
  { key: 'lost',      label: 'แพ้',     icon: XCircle },
  { key: 'cancelled', label: 'ยกเลิก',  icon: Ban },
]

// ─── Helpers ────────────────────────────────────────────────────────
const fmtId = (id: number) => `BET${String(id).padStart(5, '0')}`
const fmtBillId = (batchId: string) => batchId ? `BILL-${batchId.slice(0, 8).toUpperCase()}` : '—'
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

// ─── Component ──────────────────────────────────────────────────────
export default function BetsPage() {
  // State
  const [rows, setRows] = useState<BillRow[]>([])
  const [filter, setFilter] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [billModal, setBillModal] = useState<{ bets: BetRow[]; totalAmount: number; totalWin: number; batchId: string } | null>(null)
  const [billLoading, setBillLoading] = useState(false)
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  const [cancelModal, setCancelModal] = useState<BetRow | null>(null) // legacy single bet cancel (kept for API)
  const [cancelBillModal, setCancelBillModal] = useState<{ bets: BetRow[]; totalAmount: number; totalWin: number; batchId: string } | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [logModal, setLogModal] = useState<number | null>(null)
  const [dateFilter, setDateFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const { toast } = useToast()
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // ⭐ Debounce search — 400ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setSearch(searchInput), 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [searchInput])

  // ── Date filter helpers ─────────────────────────────────────────────
  const fmtISODate = (d: Date) => d.toISOString().split('T')[0]
  const getDateRange = () => {
    if (dateFilter === 'today') { const d = fmtISODate(new Date()); return { date_from: d, date_to: d } }
    if (dateFilter === 'yesterday') { const y = new Date(); y.setDate(y.getDate() - 1); const d = fmtISODate(y); return { date_from: d, date_to: d } }
    if (dateFilter === 'custom') return { date_from: dateFrom || undefined, date_to: dateTo || undefined }
    return {}
  }
  const handleDateFilter = (key: string) => { setDateFilter(dateFilter === key ? '' : key) }

  // ── โหลดข้อมูล ────────────────────────────────────────────────────
  const fetchData = useCallback(() => {
    setLoading(true)
    const dr = getDateRange()
    betMgmtApi.list({ status: filter || undefined, q: search || undefined, page, per_page: PER_PAGE, ...dr })
      .then(res => { setRows(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => toast.error('โหลดข้อมูลไม่สำเร็จ'))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, page, dateFilter, dateFrom, dateTo, toast])

  useEffect(() => { setPage(1) }, [filter, search, dateFilter, dateFrom, dateTo])
  useEffect(() => { fetchData() }, [fetchData])

  // ── Stat cards ────────────────────────────────────────────────────
  const pendingCount = rows.filter(r => getBillStatus(r) === 'pending').length
  const wonCount = rows.filter(r => getBillStatus(r) === 'won').length
  const totalAmount = rows.reduce((sum, r) => sum + r.total_amount, 0)
  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Open Bill Detail ───────────────────────────────────────────────
  const openBillFromRow = async (row: BillRow) => {
    const batchId = row.batch_id
    if (!batchId) return
    setBillLoading(true)
    try {
      const res = await betMgmtApi.getBill(batchId)
      const d = res.data?.data
      setBillModal({
        bets: d?.bets || [],
        totalAmount: d?.total_amount || row.total_amount,
        totalWin: d?.total_win || row.total_win,
        batchId,
      })
    } catch {
      toast.error('โหลดรายละเอียดบิลไม่สำเร็จ')
    } finally { setBillLoading(false) }
  }

  // ── Cancel Bill ────────────────────────────────────────────────────
  const doCancelBill = async (bill: typeof cancelBillModal, refund: boolean) => {
    if (!bill) return
    setCancelBillModal(null); setActionLoading(-1)
    try {
      await betMgmtApi.cancelBill(bill.batchId, refund, cancelReason || undefined)
      toast.success(`ยกเลิกบิลสำเร็จ${refund ? ' — คืนเครดิตให้สมาชิก' : ' — ไม่คืนเครดิต'}`)
      setCancelReason('')
      fetchData()
    } catch (err) { toast.error(getErrMsg(err)) }
    finally { setActionLoading(null) }
  }

  // ── Cancel/Void Single ────────────────────────────────────────────
  const doCancel = async (row: BetRow, refund: boolean) => {
    setCancelModal(null); setActionLoading(row.id)
    try {
      await betMgmtApi.cancel(row.id, refund, cancelReason || undefined)
      toast.success(`${fmtId(row.id)} ยกเลิกแล้ว${refund ? ' — คืนเครดิตให้สมาชิก' : ' — ไม่คืนเครดิต'}`)
      setCancelReason('')
      fetchData()
    } catch (err) { toast.error(getErrMsg(err)) }
    finally { setActionLoading(null) }
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>รายการเดิมพัน</h1>
          <p className="label" style={{ marginTop: 4 }}>ทั้งหมด {total} รายการ</p>
        </div>
        <button onClick={fetchData} className="btn btn-ghost" style={{ gap: 6 }}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
        <StatCard icon={Clock} label="รอผล" value={String(pendingCount)} color="var(--status-warning)" />
        <StatCard icon={Trophy} label="ชนะ" value={String(wonCount)} color="var(--status-success)" />
        <StatCard icon={Ticket} label="ยอดแทง (หน้านี้)" value={fmtMoney(totalAmount)} color="var(--accent)" />
        <StatCard icon={FileText} label="ทั้งหมด" value={String(total)} color="var(--status-info)" />
      </div>

      {/* ── Filter Tabs + Search ────────────────────────────────────── */}
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
            placeholder="ค้นหา username / เลข..." className="input"
            style={{ width: 220, height: 32, paddingLeft: 32 }} />
        </div>
      </div>

      {/* ── Date Filter ─────────────────────────────────────────────── */}
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
                <th>หมายเลขบิล</th>
                <th>สมาชิก</th>
                <th style={{ textAlign: 'right' }}>ยอดแทง</th>
                <th style={{ textAlign: 'right' }}>รางวัล</th>
                <th style={{ textAlign: 'right' }}>กำไร/ขาดทุน</th>
                <th>สถานะ</th>
                <th>เวลา</th>
                <th style={{ textAlign: 'center' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const billSt = getBillStatus(row)
                const st = billStatusMap[billSt] || billStatusMap.pending
                const net = row.total_win - row.total_amount
                return (
                  <tr key={row.batch_id} onClick={() => openBillFromRow(row)} style={{ cursor: 'pointer' }}>
                    <td>
                      <div className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{fmtBillId(row.batch_id)}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{row.bet_count} เลข</div>
                    </td>
                    <td>
                      <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                        onClick={e => e.stopPropagation()}
                        style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                        {row.username || '—'}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(row.total_amount)}</td>
                    <td className="mono" style={{ textAlign: 'right', color: row.total_win > 0 ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                      {row.total_win > 0 ? `+${fmtMoney(row.total_win)}` : '—'}
                    </td>
                    <td className="mono" style={{
                      textAlign: 'right', fontWeight: 600,
                      color: billSt === 'pending' ? 'var(--text-tertiary)' : net > 0 ? 'var(--status-error)' : 'var(--status-success)',
                    }}>
                      {billSt === 'pending' ? '—' : net > 0 ? `-${fmtMoney(net)}` : `+${fmtMoney(-net)}`}
                    </td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td style={{ fontSize: 12 }}>
                      <div style={{ color: 'var(--text-secondary)' }}>{fmtDate(row.created_at)}</div>
                      <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{relTime(row.created_at)}</div>
                    </td>
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => openBillFromRow(row)} title="ดูรายละเอียดบิล"
                        className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0, minWidth: 0 }}>
                        <Eye size={14} color="var(--accent)" />
                      </button>
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

      {/* ══ Bill Detail Modal ════════════════════════════════════════════ */}
      {billModal && (() => {
        const first = billModal.bets[0]
        const username = first?.member?.username || '—'
        const roundInfo = first?.lottery_round ? `#${first.lottery_round.id}` : '—'
        const hasCancellable = billModal.bets.some(b => b.status !== 'cancelled')
        return (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
          }} onClick={() => setBillModal(null)}>
            <div className="card-surface" style={{ width: '100%', maxWidth: 540, padding: 0, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>

              {/* Header */}
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Ticket size={20} color="var(--accent)" />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>รายละเอียดบิล</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{billModal.bets.length} รายการ — {username} — รอบ {roundInfo}</div>
                    </div>
                  </div>
                  <button onClick={() => setBillModal(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
                </div>
              </div>

              {/* Bet list */}
              <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px' }}>
                <table className="admin-table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>เลข</th>
                      <th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>จำนวน</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th>สถานะ</th>
                      <th style={{ textAlign: 'right' }}>รางวัล</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billModal.bets.map(b => {
                      const st = betStatusMap[b.status] || betStatusMap.pending
                      return (
                        <tr key={b.id}>
                          <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{b.number}</td>
                          <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.bet_type?.name || '—'}</td>
                          <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(b.amount)}</td>
                          <td className="mono secondary" style={{ textAlign: 'right' }}>x{b.rate}</td>
                          <td><span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span></td>
                          <td className="mono" style={{ textAlign: 'right', color: b.win_amount > 0 ? 'var(--status-success)' : 'var(--text-tertiary)', fontSize: 12 }}>
                            {b.win_amount > 0 ? `+${fmtMoney(b.win_amount)}` : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary + Actions */}
              <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12, fontSize: 13 }}>
                  <div>
                    <span style={{ color: 'var(--text-secondary)' }}>ยอดแทง: </span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtMoney(billModal.totalAmount)}</span>
                  </div>
                  {billModal.totalWin > 0 && (
                    <div>
                      <span style={{ color: 'var(--text-secondary)' }}>รางวัล: </span>
                      <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>+{fmtMoney(billModal.totalWin)}</span>
                    </div>
                  )}
                  {(() => {
                    const net = billModal.totalWin - billModal.totalAmount
                    const hasPending = billModal.bets.some(b => b.status === 'pending')
                    if (hasPending) return null
                    return (
                      <div>
                        <span style={{ color: 'var(--text-secondary)' }}>{net > 0 ? 'เจ้ามือเสีย: ' : 'เจ้ามือได้: '}</span>
                        <span style={{ fontWeight: 700, color: net > 0 ? 'var(--status-error)' : 'var(--status-success)' }}>
                          {fmtMoney(Math.abs(net))}
                        </span>
                      </div>
                    )
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {hasCancellable && (
                    <button onClick={() => {
                      const activeBets = billModal.bets.filter(b => b.status !== 'cancelled')
                      const activeAmount = activeBets.reduce((s, b) => s + b.amount, 0)
                      setBillModal(null); setCancelReason('')
                      setCancelBillModal({ bets: activeBets, totalAmount: activeAmount, totalWin: billModal.totalWin, batchId: billModal.batchId })
                    }}
                      className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                      <Ban size={14} /> ยกเลิกทั้งบิล
                    </button>
                  )}
                  <button onClick={() => setBillModal(null)} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ══ Cancel Bill Modal ════════════════════════════════════════════ */}
      {cancelBillModal && (
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
              <Ban size={28} color="var(--status-error)" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-error)', marginBottom: 4 }}>
              ยกเลิกทั้งบิล
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
              {fmtBillId(cancelBillModal.batchId)} — {cancelBillModal.bets.length} เลข
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)', marginBottom: 16 }}>
              ยอดแทงรวม {fmtMoney(cancelBillModal.totalAmount)}
            </div>

            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              placeholder="เหตุผล (ถ้ามี)..." className="input"
              style={{ width: '100%', minHeight: 60, marginBottom: 16, resize: 'vertical' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => doCancelBill(cancelBillModal, true)} disabled={actionLoading !== null}
                className="btn btn-success" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <Trophy size={16} /> ยกเลิก + คืนเครดิต ({fmtMoney(cancelBillModal.totalAmount)})
              </button>
              <button onClick={() => doCancelBill(cancelBillModal, false)} disabled={actionLoading !== null}
                className="btn btn-danger" style={{ width: '100%', height: 42, gap: 8, justifyContent: 'center' }}>
                <XCircle size={16} /> ยกเลิก + ไม่คืนเครดิต
              </button>
            </div>
            <button onClick={() => setCancelBillModal(null)} className="btn btn-ghost" style={{ width: '100%', marginTop: 8 }}>ปิด</button>
          </div>
        </div>
      )}

      {/* ConfirmDialog */}
      {confirmDlg && <ConfirmDialog {...confirmDlg} />}

      {/* Log History Modal */}
      {logModal && (
        <LogHistoryModal
          title="ประวัติรายการเดิมพัน"
          requestId={logModal}
          fetchLogs={betMgmtApi.getLogs}
          onClose={() => setLogModal(null)}
        />
      )}
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
        <Icon size={16} />
        <span className="label">{label}</span>
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}>{value}</div>
    </div>
  )
}

// ── Detail Field Component ───────────────────────────────────────────
function DetailField({ label, value, color, bold, children }: {
  label: string; value?: string; color?: string; bold?: boolean; children?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span className="label" style={{ fontSize: 12 }}>{label}</span>
      {children || (
        <span style={{ fontSize: 13, fontWeight: bold ? 700 : 400, color: color || 'var(--text-primary)' }}>
          {value}
        </span>
      )}
    </div>
  )
}
