// Page: /bets (admin) — orchestrator for bets management (stat cards + filters + table + modals)
// Parent: src/app (route entry)
//
// Features:
// - 4 stat cards: รอผล / ชนะ / ยอดแทง / ทั้งหมด
// - Filter tabs + date filter + search debounce 400ms
// - Bill detail modal (drill down to individual bets)
// - Cancel bill modal (คืนเครดิต / ไม่คืน + เหตุผล)
// - Log history modal (timeline)
'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { betMgmtApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import LogHistoryModal from '@/components/LogHistoryModal'
import {
  Ticket, Clock, Trophy, XCircle, Ban,
  RefreshCw, FileText,
} from 'lucide-react'
import BetsFilters from '@/components/bets-all/BetsFilters'
import BetsTable from '@/components/bets-all/BetsTable'
import BillDetailModal from '@/components/bets-all/BillDetailModal'
import {
  type BillRow, type BetRow, type BillModalData,
  getBillStatus, fmtBillId, fmtMoney, fmtId, getErrMsg,
} from '@/components/bets-all/types'

const PER_PAGE = 20

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
  const [billModal, setBillModal] = useState<BillModalData | null>(null)
  const [, setBillLoading] = useState(false)
  const [confirmDlg] = useState<ConfirmDialogProps | null>(null)
  const [, setCancelModal] = useState<BetRow | null>(null) // legacy single bet cancel (kept for API)
  const [cancelBillModal, setCancelBillModal] = useState<BillModalData | null>(null)
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
  const doCancelBill = async (bill: BillModalData | null, refund: boolean) => {
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

  // ── Cancel/Void Single (kept for potential re-use) ────────────────
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

      {/* ── Filters + Date ──────────────────────────────────────────── */}
      <BetsFilters
        filter={filter} setFilter={setFilter}
        searchInput={searchInput} setSearchInput={setSearchInput}
        dateFilter={dateFilter} handleDateFilter={handleDateFilter}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
      />

      {/* ── Table ───────────────────────────────────────────────────── */}
      <BetsTable
        rows={rows} loading={loading} filter={filter}
        page={page} totalPages={totalPages} onPageChange={setPage}
        onOpenBill={openBillFromRow}
      />

      {/* ══ Bill Detail Modal ════════════════════════════════════════════ */}
      {billModal && (
        <BillDetailModal
          bill={billModal}
          onClose={() => setBillModal(null)}
          onRequestCancel={(activeBets, activeAmount) => {
            setBillModal(null); setCancelReason('')
            setCancelBillModal({ bets: activeBets, totalAmount: activeAmount, totalWin: billModal.totalWin, batchId: billModal.batchId })
          }}
        />
      )}

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
