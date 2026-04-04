/**
 * Admin — รายงาน (Summary + Profit/Loss + Member Credit)
 *
 * 2 tabs:
 *  Tab 1: สรุปภาพรวม (Summary) — stat cards + date range
 *  Tab 2: รายงานเครดิตสมาชิก — ค้นหาด้วย username/phone → แสดงประวัติ credit
 *
 * ⭐ เชื่อม API จริง:
 *  - GET /api/v1/reports/summary
 *  - GET /api/v1/reports/member-credit
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { reportApi, memberCreditApi } from '@/lib/api'
import Loading from '@/components/Loading'
import { useToast } from '@/components/Toast'
import { BarChart3, Search, User } from 'lucide-react'

// ─── ฟอร์แมตเงิน ────────────────────────────────────────────────────
const fmtMoney = (n: number) =>
  `฿${Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

// ─── ประเภท Transaction → ภาษาไทย + สี ──────────────────────────────
const txTypes: Record<string, { label: string; color: string }> = {
  deposit:      { label: 'ฝากเงิน', color: 'var(--status-success)' },
  withdraw:     { label: 'ถอนเงิน', color: 'var(--status-error)' },
  bet:          { label: 'แทง', color: '#a855f7' },
  win:          { label: 'ชนะ', color: '#f5a623' },
  commission:   { label: 'ค่าคอม', color: '#22d3ee' },
  admin_credit: { label: 'เติมเครดิต', color: '#3b82f6' },
  admin_debit:  { label: 'หักเครดิต', color: '#ef4444' },
}

export default function ReportsPage() {
  const [tab, setTab] = useState<'summary' | 'credit'>('summary')

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>รายงาน</h1>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-elevated)', borderRadius: 8, padding: 3, width: 'fit-content' }}>
        <button
          className={`btn ${tab === 'summary' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: 6, fontSize: 13 }}
          onClick={() => setTab('summary')}
        >
          <BarChart3 size={15} /> สรุปภาพรวม
        </button>
        <button
          className={`btn ${tab === 'credit' ? 'btn-primary' : 'btn-ghost'}`}
          style={{ gap: 6, fontSize: 13 }}
          onClick={() => setTab('credit')}
        >
          <User size={15} /> เครดิตสมาชิก
        </button>
      </div>

      {tab === 'summary' && <SummaryTab />}
      {tab === 'credit' && <MemberCreditTab />}
    </div>
  )
}

// =============================================================================
// Tab 1: สรุปภาพรวม — stat cards + date range
// =============================================================================
function SummaryTab() {
  const [summary, setSummary] = useState({ total_bets: 0, total_amount: 0, total_win: 0, profit: 0 })
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    reportApi.summary({ from: dateFrom, to: dateTo })
      .then(res => setSummary(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [dateFrom, dateTo])

  return (
    <>
      {/* Date range */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'flex-end' }}>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>จาก</div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="input" style={{ width: 160 }} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>ถึง</div>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="input" style={{ width: 160 }} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
        <div className="stat-card">
          <div className="label" style={{ marginBottom: 8 }}>จำนวน BETS</div>
          <div className="metric" style={{ color: '#3b82f6' }}>
            {loading ? '—' : summary.total_bets.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="label" style={{ marginBottom: 8 }}>ยอดแทงรวม</div>
          <div className="metric" style={{ color: '#a855f7' }}>
            {loading ? '—' : `฿${summary.total_amount.toLocaleString()}`}
          </div>
        </div>
        <div className="stat-card">
          <div className="label" style={{ marginBottom: 8 }}>จ่ายรางวัล</div>
          <div className="metric" style={{ color: '#ef4444' }}>
            {loading ? '—' : `฿${summary.total_win.toLocaleString()}`}
          </div>
        </div>
        <div className="stat-card" style={{
          borderColor: summary.profit >= 0 ? 'rgba(0,229,160,0.2)' : 'rgba(239,68,68,0.2)',
        }}>
          <div className="label" style={{ marginBottom: 8 }}>กำไร</div>
          <div className="metric" style={{ color: summary.profit >= 0 ? '#00e5a0' : '#ef4444' }}>
            {loading ? '—' : `${summary.profit >= 0 ? '+' : ''}฿${summary.profit.toLocaleString()}`}
          </div>
        </div>
      </div>
    </>
  )
}

// =============================================================================
// Tab 2: รายงานเครดิตสมาชิก — ค้นหา + สรุปยอด + ตาราง transactions
// =============================================================================
function MemberCreditTab() {
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState(new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0])
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const { toast } = useToast()

  // ⭐ ข้อมูลจาก API
  const [member, setMember] = useState<{ id: number; username: string; phone: string; balance: number; status: string } | null>(null)
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [transactions, setTransactions] = useState<{
    items: { id: number; type: string; amount: number; balance_before: number; balance_after: number; note: string; created_at: string }[]
    total: number
  }>({ items: [], total: 0 })

  // ─── ค้นหาเครดิตสมาชิก ────────────────────────────────────────────
  const doSearch = useCallback(() => {
    if (!search.trim()) { toast.error('กรุณากรอก username หรือเบอร์โทร'); return }
    setLoading(true)
    memberCreditApi.report({ q: search, from: dateFrom, to: dateTo, page, per_page: 50 })
      .then(res => {
        const d = res.data.data
        if (!d || !d.member) {
          toast.error('ไม่พบสมาชิก')
          setMember(null)
          return
        }
        setMember(d.member)
        setSummary(d.summary || {})
        setTransactions(d.transactions || { items: [], total: 0 })
      })
      .catch((err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ค้นหาไม่สำเร็จ'
        toast.error(msg)
        setMember(null)
      })
      .finally(() => setLoading(false))
  }, [search, dateFrom, dateTo, page, toast])

  // ─── เปลี่ยนหน้า → ค้นหาใหม่ ─────────────────────────────────────
  useEffect(() => {
    if (member) doSearch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.ceil(transactions.total / 50)

  return (
    <>
      {/* Search bar + date range */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div className="label" style={{ marginBottom: 6 }}>ค้นหา (Username / เบอร์โทร)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" placeholder="เช่น 0614797423" value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              style={{ flex: 1 }} />
            <button onClick={doSearch} className="btn btn-primary" style={{ gap: 6 }} disabled={loading}>
              <Search size={15} /> ค้นหา
            </button>
          </div>
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>จาก</div>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input" style={{ width: 150 }} />
        </div>
        <div>
          <div className="label" style={{ marginBottom: 6 }}>ถึง</div>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input" style={{ width: 150 }} />
        </div>
      </div>

      {loading && <Loading inline text="กำลังค้นหา..." />}

      {/* ── ข้อมูลสมาชิก + สรุป ──────────────────────────────────────── */}
      {member && !loading && (
        <>
          {/* Member info bar */}
          <div className="card-surface" style={{ padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={20} color="var(--accent)" />
            </div>
            <div>
              <div style={{ fontWeight: 600 }}>{member.username}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{member.phone || '—'} | ID #{member.id}</div>
            </div>
            <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`} style={{ marginLeft: 'auto' }}>
              {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
            </span>
            <div style={{ marginLeft: 8 }}>
              <div className="label">ยอดคงเหลือ</div>
              <div className="metric" style={{ fontSize: 20, color: 'var(--accent)' }}>{fmtMoney(member.balance)}</div>
            </div>
          </div>

          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            <StatMini label="ฝากรวม" value={summary.total_deposit || 0} color="var(--status-success)" />
            <StatMini label="ถอนรวม" value={summary.total_withdraw || 0} color="var(--status-error)" />
            <StatMini label="แทงรวม" value={summary.total_bet || 0} color="#a855f7" />
            <StatMini label="ชนะรวม" value={summary.total_win || 0} color="#f5a623" />
            <StatMini label="เติมเครดิต" value={summary.total_credit || 0} color="#3b82f6" />
            <StatMini label="หักเครดิต" value={summary.total_debit || 0} color="#ef4444" />
          </div>

          {/* Transaction table */}
          <div className="card-surface" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
              <span className="label">ประวัติรายการ ({transactions.total} รายการ)</span>
            </div>

            {transactions.items.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่พบรายการ</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>เวลา</th>
                    <th>ประเภท</th>
                    <th style={{ textAlign: 'right' }}>จำนวน</th>
                    <th style={{ textAlign: 'right' }}>ก่อน</th>
                    <th style={{ textAlign: 'right' }}>หลัง</th>
                    <th>หมายเหตุ</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.items.map(tx => {
                    const t = txTypes[tx.type] || { label: tx.type, color: 'var(--text-secondary)' }
                    return (
                      <tr key={tx.id}>
                        <td className="secondary" style={{ fontSize: 12 }}>
                          {new Date(tx.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td><span style={{ color: t.color, fontWeight: 500, fontSize: 13 }}>{t.label}</span></td>
                        <td className="mono" style={{
                          textAlign: 'right', fontWeight: 600,
                          color: tx.amount >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                        }}>
                          {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
                        </td>
                        <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(tx.balance_before)}</td>
                        <td className="mono secondary" style={{ textAlign: 'right' }}>{fmtMoney(tx.balance_after)}</td>
                        <td className="secondary" style={{ fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.note || '—'}
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 16px', borderTop: '1px solid var(--border)',
              }}>
                <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                  ก่อนหน้า
                </button>
                <span className="label" style={{ padding: '0 8px' }}>หน้า {page} / {totalPages}</span>
                <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                  ถัดไป
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!member && !loading && (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          กรอก Username หรือเบอร์โทร แล้วกด "ค้นหา" เพื่อดูรายงานเครดิต
        </div>
      )}
    </>
  )
}

// ─── Helper: Mini stat card ───────────────────────────────────────────
function StatMini({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="stat-card" style={{ padding: '12px 16px' }}>
      <div className="label" style={{ marginBottom: 6 }}>{label}</div>
      <div className="mono" style={{ fontSize: 16, fontWeight: 700, color }}>{fmtMoney(value)}</div>
    </div>
  )
}
