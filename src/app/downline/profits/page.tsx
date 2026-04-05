/**
 * หน้ารายงานกำไรสายงาน (Downline Profit Report)
 *
 * แสดง:
 * - สรุปกำไรรวมแยกตาม node (summary table)
 * - Grand total
 * - รายการ transactions (detail, paginated)
 * - Filter: วันที่, node
 *
 * API: admin-api (#5) GET /downline/profits
 * ดู: handler/downline_handler.go → GetDownlineProfits()
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { downlineApi, type AgentNode, type ProfitSummaryRow, type AgentProfitTx } from '@/lib/api'
import Loading from '@/components/Loading'
import { TrendingUp, TrendingDown, Filter, RefreshCw, ArrowUpRight } from 'lucide-react'

// =============================================================================
// Role labels + colors (เหมือนหน้า downline/page.tsx)
// =============================================================================
const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:          { label: 'Admin',        color: '#f59e0b' },
  share_holder:   { label: 'Share Holder', color: '#8b5cf6' },
  senior:         { label: 'Senior',       color: '#3b82f6' },
  master:         { label: 'Master',       color: '#10b981' },
  agent:          { label: 'Agent',        color: '#06b6d4' },
  agent_downline: { label: 'Downline',     color: '#6b7280' },
}

const PER_PAGE = 20

export default function DownlineProfitsPage() {
  // ─── State ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [summaries, setSummaries] = useState<ProfitSummaryRow[]>([])
  const [grandTotal, setGrandTotal] = useState(0)
  const [transactions, setTransactions] = useState<AgentProfitTx[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  // Filters — default วันนี้
  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)
  const [filterNodeId, setFilterNodeId] = useState<number | undefined>()

  // Node list สำหรับ dropdown filter
  const [allNodes, setAllNodes] = useState<AgentNode[]>([])

  // ─── Load (ดึงจาก API จริง) ─────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { page, per_page: PER_PAGE }
      if (dateFrom) params.date_from = dateFrom
      if (dateTo) params.date_to = dateTo
      if (filterNodeId) params.node_id = filterNodeId

      const res = await downlineApi.getProfits(params)
      const data = res.data.data || {}
      setSummaries(data.summary || [])
      setGrandTotal(data.grand_total || 0)
      setTransactions(data.transactions?.items || [])
      setTotal(data.transactions?.total || 0)
    } catch {
      setSummaries([])
      setGrandTotal(0)
      setTransactions([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [page, dateFrom, dateTo, filterNodeId])

  // โหลด node list สำหรับ filter dropdown
  useEffect(() => {
    downlineApi.listNodes({ per_page: 100 })
      .then(res => setAllNodes(res.data.data?.items || []))
      .catch(() => setAllNodes([]))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const totalPages = Math.ceil(total / PER_PAGE)

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>
            กำไรสายงาน
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            รายงานกำไร/ขาดทุนแยกตาม node — คำนวณจากส่วนต่าง % ที่ถือ
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 16 }}>
        {/* Date presets — ปุ่มกดเลือกช่วงวัน */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(() => {
            const d = new Date()
            const fmt = (dt: Date) => dt.toISOString().split('T')[0]
            // วันนี้
            const todayStr = fmt(d)
            // เมื่อวาน
            const yesterday = new Date(d); yesterday.setDate(d.getDate() - 1)
            const yesterdayStr = fmt(yesterday)
            // เดือนนี้ (ต้นเดือน — วันนี้)
            const monthStart = fmt(new Date(d.getFullYear(), d.getMonth(), 1))
            // ต้นเดือน — กลางเดือน (1-15)
            const mid = fmt(new Date(d.getFullYear(), d.getMonth(), 15))
            // กลางเดือน — ท้ายเดือน (16-สิ้นเดือน)
            const day16 = fmt(new Date(d.getFullYear(), d.getMonth(), 16))
            const monthEnd = fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0))
            // เดือนที่แล้ว
            const prevMonthStart = fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1))
            const prevMonthEnd = fmt(new Date(d.getFullYear(), d.getMonth(), 0))

            const presets: { label: string; from: string; to: string }[] = [
              { label: 'วันนี้', from: todayStr, to: todayStr },
              { label: 'เมื่อวาน', from: yesterdayStr, to: yesterdayStr },
              { label: 'เดือนนี้', from: monthStart, to: todayStr },
              { label: 'ต้นเดือน (1-15)', from: monthStart, to: mid },
              { label: 'ท้ายเดือน (16+)', from: day16, to: monthEnd },
              { label: 'เดือนที่แล้ว', from: prevMonthStart, to: prevMonthEnd },
            ]

            return presets.map(p => (
              <button key={p.label}
                className={`btn ${dateFrom === p.from && dateTo === p.to ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
                onClick={() => { setDateFrom(p.from); setDateTo(p.to); setPage(1) }}>
                {p.label}
              </button>
            ))
          })()}
        </div>

        {/* Date inputs + node filter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="label">จาก</label>
            <input className="input" type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPage(1) }} />
          </div>
          <div>
            <label className="label">ถึง</label>
            <input className="input" type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPage(1) }} />
          </div>
          <div>
            <label className="label">Node</label>
            <select className="input" value={filterNodeId || ''}
              onChange={e => { setFilterNodeId(e.target.value ? Number(e.target.value) : undefined); setPage(1) }}>
              <option value="">-- ทุก node --</option>
              {allNodes.map(n => (
                <option key={n.id} value={n.id}>
                  {n.name} ({ROLE_CONFIG[n.role]?.label || n.role} — {n.share_percent}%)
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => {
            setDateFrom(today); setDateTo(today); setFilterNodeId(undefined); setPage(1)
          }}>
            <Filter size={14} /> ล้าง
          </button>
        </div>
      </div>

      {loading ? (
        <Loading inline text="กำลังโหลดรายงาน..." />
      ) : (
        <>
          {/* ── Grand Total + ส่งขึ้นหัว ─────────────────────────────────── */}
          {(() => {
            // คำนวณ "ส่งขึ้นหัว" = กำไรรวม - กำไรเฉพาะ admin (node id=1)
            // admin เป็นเจ้าของ 100% → ส่วนต่าง % ที่ admin ได้ = กำไรของ admin
            // ส่งขึ้นหัว = ยอดที่ต้องส่งให้คนข้างบน (สำหรับ admin = 0 เพราะไม่มีหัว)
            // สูตร: ส่งขึ้นหัว = grandTotal - กำไรของเรา (admin node)
            const adminProfit = summaries.find(s => s.node_role === 'admin')?.total_profit || 0
            // ส่งขึ้นหัว = 0 สำหรับ admin (ไม่มีหัวสาย)
            // สำหรับ node อื่น → ส่งขึ้นหัว = grandTotal - (กำไรของ nodes ตั้งแต่ตัวเองลงไป)
            const sendUpAmount = grandTotal - adminProfit // ← จำนวนที่ admin ไม่ได้ = nodes อื่นได้

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                {/* กำไรรวมสุทธิ */}
                <div className="card-surface" style={{
                  padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: grandTotal >= 0 ? 'rgba(0,229,160,0.15)' : 'rgba(239,68,68,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {grandTotal >= 0
                      ? <TrendingUp size={24} color="var(--status-success)" />
                      : <TrendingDown size={24} color="var(--status-error)" />}
                  </div>
                  <div>
                    <div className="label">กำไรรวมสุทธิ</div>
                    <div className="metric" style={{
                      fontSize: 28,
                      color: grandTotal >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                    }}>
                      {grandTotal >= 0 ? '+' : ''}{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
                    </div>
                  </div>
                </div>

                {/* ส่งขึ้นหัว — ยอดที่ต้องส่งให้สายบน */}
                <div className="card-surface" style={{
                  padding: 20, display: 'flex', alignItems: 'center', gap: 16,
                }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: 10,
                    background: 'rgba(245,158,11,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ArrowUpRight size={24} color="#f59e0b" />
                  </div>
                  <div>
                    <div className="label">ส่งขึ้นหัว (ยอดเราต้องส่ง)</div>
                    <div className="metric" style={{ fontSize: 28, color: '#f59e0b' }}>
                      {sendUpAmount >= 0 ? '' : '-'}{Math.abs(sendUpAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} ฿
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      กำไรรวม {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })} − เราได้ {adminProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })} = ส่งขึ้น {Math.abs(sendUpAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* ── Summary Table (กำไรแยก node) ──────────────────────────────── */}
          {summaries.length > 0 && (
            <div className="card-surface" style={{ overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <span className="label">สรุปกำไรแยกตาม Node</span>
              </div>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Node</th>
                    <th>ยศ</th>
                    <th style={{ textAlign: 'right' }}>Share %</th>
                    <th style={{ textAlign: 'right' }}>จำนวน Bets</th>
                    <th style={{ textAlign: 'right' }}>กำไร</th>
                  </tr>
                </thead>
                <tbody>
                  {summaries.map(s => (
                    <tr key={s.agent_node_id}>
                      <td style={{ fontWeight: 500 }}>{s.node_name}</td>
                      <td>
                        <span style={{
                          padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600,
                          color: ROLE_CONFIG[s.node_role]?.color || '#6b7280',
                        }}>
                          {ROLE_CONFIG[s.node_role]?.label || s.node_role}
                        </span>
                      </td>
                      <td className="mono" style={{ textAlign: 'right' }}>{s.share_percent}%</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{s.total_bets.toLocaleString()}</td>
                      <td className="mono" style={{
                        textAlign: 'right', fontWeight: 600,
                        color: s.total_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                      }}>
                        {s.total_profit >= 0 ? '+' : ''}{s.total_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Detail Transactions ───────────────────────────────────────── */}
          <div className="card-surface" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
              <span className="label">รายการกำไร/ขาดทุน ({total} รายการ)</span>
            </div>

            {transactions.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>
                ไม่มีข้อมูล
              </div>
            ) : (
              <>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Node</th>
                      <th style={{ textAlign: 'right' }}>ยอดแทง</th>
                      <th style={{ textAlign: 'right' }}>ผลลัพธ์</th>
                      <th style={{ textAlign: 'right' }}>My %</th>
                      <th style={{ textAlign: 'right' }}>Child %</th>
                      <th style={{ textAlign: 'right' }}>Diff %</th>
                      <th style={{ textAlign: 'right' }}>กำไร</th>
                      <th style={{ textAlign: 'right' }}>วันที่</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight: 500 }}>
                          {tx.agent_node?.name || `#${tx.agent_node_id}`}
                        </td>
                        <td className="mono" style={{ textAlign: 'right' }}>
                          {tx.bet_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="mono" style={{
                          textAlign: 'right',
                          color: tx.net_result >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                        }}>
                          {tx.net_result >= 0 ? '+' : ''}{tx.net_result.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="mono" style={{ textAlign: 'right' }}>{tx.my_percent}%</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{tx.child_percent}%</td>
                        <td className="mono" style={{ textAlign: 'right' }}>{tx.diff_percent}%</td>
                        <td className="mono" style={{
                          textAlign: 'right', fontWeight: 600,
                          color: tx.profit_amount >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                        }}>
                          {tx.profit_amount >= 0 ? '+' : ''}{tx.profit_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="secondary" style={{ textAlign: 'right', fontSize: 12 }}>
                          {new Date(tx.created_at).toLocaleDateString('th-TH', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex', justifyContent: 'center', gap: 8,
                    padding: '12px 16px', borderTop: '1px solid var(--border)',
                  }}>
                    <button className="btn btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                      ก่อนหน้า
                    </button>
                    <span className="label" style={{ padding: '0 8px', display: 'flex', alignItems: 'center' }}>
                      หน้า {page} / {totalPages}
                    </span>
                    <button className="btn btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>
                      ถัดไป
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
