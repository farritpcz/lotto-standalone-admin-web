/**
 * หน้ารายงานเคลียสายงาน — ดูง่าย ตอบคำถาม "เดือนนี้เคลียกับใครเท่าไร"
 *
 * 3 ส่วน:
 *  1. เว็บตัวเอง → ยอดสุทธิลูกค้าตรง + เคลียกับหัว
 *  2. ใต้สาย → แต่ละลูกสาย ยอดสุทธิ + เคลีย
 *  3. สรุปรวม → เราเก็บได้ + เคลียกับหัวรวมทั้ง tree
 *
 * API: GET /downline/report?date_from=&date_to=
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { downlineApi } from '@/lib/api'
import Loading from '@/components/Loading'
import {
  RefreshCw, Filter, Users, User, ArrowUp, ArrowDown,
  ChevronDown, Wallet,
} from 'lucide-react'

// =============================================================================
// Types
// =============================================================================
interface ReportData {
  my_node: { id: number; name: string; username: string; role: string; share_percent: number }
  parent: { name: string; share_percent: number; diff_percent: number }
  is_root: boolean
  direct: { net_result: number; my_profit: number; bets: number; member_count: number }
  children: ChildRow[]
  summary: {
    direct_profit: number; downline_profit: number; total_profit: number
    total_tree_net: number; parent_settlement: number
  }
}

interface ChildRow {
  node_id: number; name: string; username: string; role: string
  share_percent: number; diff_percent: number
  tree_net: number; settlement: number; bets: number; member_count: number
}

// =============================================================================
// Helpers
// =============================================================================
const ROLE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  admin:          { label: 'Admin',        color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  share_holder:   { label: 'Share Holder', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  senior:         { label: 'Senior',       color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  master:         { label: 'Master',       color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  agent:          { label: 'Agent',        color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  agent_downline: { label: 'Downline',     color: '#6b7280', bg: 'rgba(107,114,128,0.15)' },
}

// ฟอร์แมตเงิน พร้อมเครื่องหมาย
const fmtMoney = (n: number) =>
  `${n >= 0 ? '+' : ''}${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtAbs = (n: number) =>
  Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// ป้ายเคลีย: แสดงทิศทาง + สี
function SettlementBadge({ amount, upLabel, downLabel }: { amount: number; upLabel: string; downLabel: string }) {
  if (amount === 0) return <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>— ไม่มียอดเคลีย</span>
  const isUp = amount > 0
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 14, fontWeight: 700,
      color: isUp ? '#f59e0b' : '#3b82f6',
    }}>
      {isUp ? <ArrowUp size={15} /> : <ArrowDown size={15} />}
      <span>{isUp ? upLabel : downLabel}</span>
      <span className="mono">{fmtAbs(amount)} ฿</span>
    </span>
  )
}

// ที่มาของยอดจ่ายขึ้นหัว — คลิกเปิด/ปิด
function ParentBreakdown({ data }: { data: ReportData }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 10 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontSize: 11, color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <ChevronDown size={12} style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform 0.15s' }} />
        ดูที่มาของยอด
      </button>
      {open && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text-tertiary)' }}>
          <div>ยอดสุทธิทั้ง tree: <span className="mono" style={{ color: 'var(--text-secondary)' }}>{fmtMoney(data.summary.total_tree_net)}</span></div>
          <div style={{ marginTop: 2 }}>
            = เว็บตัวเอง (<span className="mono">{fmtMoney(data.direct.net_result)}</span>)
            {data.children.map(c => (
              <span key={c.node_id}> + {c.name} (<span className="mono">{fmtMoney(c.tree_net)}</span>)</span>
            ))}
          </div>
          <div style={{ marginTop: 2 }}>
            คิด {100 - data.my_node.share_percent}% ของ <span className="mono">{fmtMoney(data.summary.total_tree_net)}</span> = <span className="mono" style={{ color: 'var(--text-secondary)' }}>{fmtAbs(data.summary.parent_settlement)}</span>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// ⭐ Main Page
// =============================================================================
export default function DownlineReportPage() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)

  const today = new Date().toISOString().split('T')[0]
  const [dateFrom, setDateFrom] = useState(today)
  const [dateTo, setDateTo] = useState(today)

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await downlineApi.getReport({ date_from: dateFrom, date_to: dateTo })
      setData(res.data.data || null)
    } catch { setData(null) }
    finally { setLoading(false) }
  }, [dateFrom, dateTo])

  useEffect(() => { loadData() }, [loadData])

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>รายงานเคลียสายงาน</h1>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>
            สรุปยอดเคลียกับหัวสาย และ ใต้สาย
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ── Date Filter ─────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 16, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(() => {
            const d = new Date()
            const fmt = (dt: Date) => dt.toISOString().split('T')[0]
            const todayStr = fmt(d)
            const yesterday = new Date(d); yesterday.setDate(d.getDate() - 1)
            const monthStart = fmt(new Date(d.getFullYear(), d.getMonth(), 1))
            const mid = fmt(new Date(d.getFullYear(), d.getMonth(), 15))
            const day16 = fmt(new Date(d.getFullYear(), d.getMonth(), 16))
            const monthEnd = fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0))
            const prevMonthStart = fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1))
            const prevMonthEnd = fmt(new Date(d.getFullYear(), d.getMonth(), 0))
            return [
              { label: 'วันนี้', from: todayStr, to: todayStr },
              { label: 'เมื่อวาน', from: fmt(yesterday), to: fmt(yesterday) },
              { label: 'เดือนนี้', from: monthStart, to: todayStr },
              { label: 'ต้นเดือน (1-15)', from: monthStart, to: mid },
              { label: 'ท้ายเดือน (16+)', from: day16, to: monthEnd },
              { label: 'เดือนที่แล้ว', from: prevMonthStart, to: prevMonthEnd },
            ].map(p => (
              <button key={p.label}
                className={`btn ${dateFrom === p.from && dateTo === p.to ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
                onClick={() => { setDateFrom(p.from); setDateTo(p.to) }}>
                {p.label}
              </button>
            ))
          })()}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label className="label">จาก</label>
            <input className="input" type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div>
            <label className="label">ถึง</label>
            <input className="input" type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-secondary" onClick={() => { setDateFrom(today); setDateTo(today) }}>
            <Filter size={14} /> ล้าง
          </button>
        </div>
      </div>

      {loading ? (
        <Loading inline text="กำลังโหลดรายงาน..." />
      ) : !data ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ไม่มีข้อมูล
        </div>
      ) : (
        <>
          {/* ── Node Info ────────────────────────────────────────────────── */}
          <div className="card-surface" style={{
            padding: '12px 20px', marginBottom: 20,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
          }}>
            {(() => {
              const r = ROLE_CONFIG[data.my_node.role] || { label: data.my_node.role, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
              return <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: r.color, background: r.bg, textTransform: 'uppercase' }}>{r.label}</span>
            })()}
            <span style={{ fontWeight: 600, fontSize: 15 }}>{data.my_node.name}</span>
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>@{data.my_node.username}</span>
            <span style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', fontSize: 13, fontWeight: 700 }}>
              ถือ {data.my_node.share_percent}%
            </span>
            {!data.is_root && (
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 'auto' }}>
                หัวสาย: <strong style={{ color: 'var(--text-secondary)' }}>{data.parent.name}</strong>
              </span>
            )}
          </div>

          {/* ── 2 การ์ดหลัก: เคลียใต้สาย + จ่ายขึ้นหัว ────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: !data.is_root ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>
            {/* ⭐ การ์ด 1: เคลียใต้สาย */}
            <div className="card-surface" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ArrowUp size={18} color="#8b5cf6" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>เคลียใต้สาย</span>
              </div>
              {(() => {
                const total = data.children.reduce((s, c) => s + c.settlement, 0)
                if (data.children.length === 0) return <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่มีใต้สาย</div>
                return (
                  <>
                    <div className="mono" style={{
                      fontSize: 28, fontWeight: 700,
                      color: total > 0 ? 'var(--status-success)' : total < 0 ? 'var(--status-error)' : 'var(--text-tertiary)',
                    }}>
                      {fmtAbs(total)} ฿
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                      {total > 0 ? 'เคลียใต้สายได้' : total < 0 ? 'จ่ายใต้สาย (ลูกค้าชนะ)' : 'ไม่มียอดเคลีย'}
                      {' • '}{data.children.length} สายล่าง
                    </div>
                  </>
                )
              })()}
            </div>

            {/* ⭐ การ์ด 2: เคลียหัวสาย */}
            {!data.is_root && (
              <div className="card-surface" style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <ArrowUp size={18} color="#f59e0b" />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>เคลียหัวสาย</span>
                </div>
                <div className="mono" style={{
                  fontSize: 28, fontWeight: 700,
                  color: data.summary.parent_settlement > 0 ? '#f59e0b' : data.summary.parent_settlement < 0 ? '#3b82f6' : 'var(--text-tertiary)',
                }}>
                  {fmtAbs(data.summary.parent_settlement)} ฿
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
                  {data.summary.parent_settlement > 0
                    ? `ส่งให้ ${data.parent.name}`
                    : data.summary.parent_settlement < 0
                      ? `${data.parent.name} จ่ายลงมา`
                      : 'ไม่มียอดเคลีย'}
                </div>
                {/* ที่มาของยอด — คลิกเพื่อเปิดดู */}
                <ParentBreakdown data={data} />
              </div>
            )}
          </div>

          {/* ── รายละเอียดใต้สาย ──────────────────────────────────────── */}
          {data.children.length > 0 && (
            <div className="card-surface" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <ChevronDown size={16} color="#8b5cf6" />
                <span style={{ fontSize: 14, fontWeight: 600 }}>รายละเอียดใต้สาย</span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table" style={{ fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th>สายล่าง</th>
                      <th style={{ textAlign: 'right' }}>ถือ%</th>
                      <th style={{ textAlign: 'right' }}>diff%</th>
                      <th style={{ textAlign: 'right' }}>สมาชิก</th>
                      <th style={{ textAlign: 'right' }}>Bets</th>
                      <th style={{ textAlign: 'right' }}>ยอดสุทธิ tree</th>
                      <th style={{ textAlign: 'right' }}>เคลีย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.children.map(child => {
                      const r = ROLE_CONFIG[child.role] || { label: child.role, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
                      return (
                        <tr key={child.node_id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                                color: r.color, background: r.bg, textTransform: 'uppercase',
                              }}>{r.label}</span>
                              <div>
                                <div style={{ fontWeight: 600 }}>{child.name}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{child.username}</div>
                              </div>
                            </div>
                          </td>
                          <td className="mono" style={{ textAlign: 'right' }}>{child.share_percent}%</td>
                          <td className="mono" style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{child.diff_percent}%</td>
                          <td style={{ textAlign: 'right' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                              <Users size={12} /> {child.member_count}
                            </span>
                          </td>
                          <td className="mono" style={{ textAlign: 'right' }}>{child.bets > 0 ? child.bets.toLocaleString() : '-'}</td>
                          <td className="mono" style={{
                            textAlign: 'right',
                            color: child.tree_net > 0 ? 'var(--status-success)' : child.tree_net < 0 ? 'var(--status-error)' : 'var(--text-tertiary)',
                          }}>
                            {child.tree_net !== 0 ? fmtMoney(child.tree_net) : '-'}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {child.settlement !== 0 ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 4,
                                fontWeight: 700, fontSize: 13,
                                color: child.settlement > 0 ? 'var(--status-success)' : 'var(--status-error)',
                              }}>
                                {child.settlement > 0
                                  ? <>เก็บ {fmtAbs(child.settlement)}</>
                                  : <>จ่าย {fmtAbs(child.settlement)}</>}
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      )
                    })}
                    {data.children.length > 1 && (
                      <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                        <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>รวม</td>
                        <td />
                        <td style={{ textAlign: 'right' }}>
                          {(() => {
                            const total = data.children.reduce((s, c) => s + c.settlement, 0)
                            return total !== 0 ? (
                              <span style={{ fontWeight: 700, color: total > 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                                {total > 0 ? `เก็บ ${fmtAbs(total)}` : `จ่าย ${fmtAbs(total)}`}
                              </span>
                            ) : '-'
                          })()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── เว็บตัวเอง (ข้อมูลประกอบ) ────────────────────────────────── */}
          <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <User size={16} color="#3b82f6" />
              <span style={{ fontSize: 14, fontWeight: 600 }}>เว็บตัวเอง</span>
              <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                ลูกค้าสมัครตรง {data.direct.member_count} คน • {data.direct.bets} bets
              </span>
            </div>
            {data.direct.bets > 0 ? (
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>ยอดสุทธิลูกค้า</div>
                  <div className="mono" style={{
                    fontSize: 18, fontWeight: 700,
                    color: data.direct.net_result >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                  }}>
                    {fmtMoney(data.direct.net_result)} ฿
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>เราถือ ({data.my_node.share_percent}%)</div>
                  <div className="mono" style={{
                    fontSize: 18, fontWeight: 700,
                    color: data.direct.my_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                  }}>
                    {fmtMoney(data.direct.my_profit)} ฿
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่มียอดแทงในช่วงนี้</div>
            )}
          </div>

          {/* ── สรุปรวม ─────────────────────────────────────────────────── */}
          <div className="card-surface" style={{ padding: 20 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>สรุป</div>

            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>กำไร/ขาดทุนเว็บตัวเอง</span>
              <span className="mono" style={{
                fontSize: 14, fontWeight: 600,
                color: data.summary.direct_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
              }}>
                {fmtMoney(data.summary.direct_profit)} ฿
              </span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0',
              borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>เก็บ/จ่ายใต้สาย</div>
                {data.children.length > 0 && (() => {
                  // ยอดเก็บเต็มจากใต้สาย (ทุกอย่างเหนือ child%)
                  const totalCollected = data.children.reduce((s, c) => s + c.settlement, 0)
                  // ส่วนที่ต้องส่งต่อขึ้นหัว (เฉพาะจากใต้สาย) = ยอดเก็บ - กำไรเรา
                  const passUp = totalCollected - data.summary.downline_profit
                  return (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      เก็บมา <span className="mono">{fmtAbs(totalCollected)}</span>
                      {' − '}ส่งต่อขึ้นหัว <span className="mono">{fmtAbs(passUp)}</span>
                      {' = '}เหลือ <span className="mono">{fmtAbs(data.summary.downline_profit)}</span>
                    </div>
                  )
                })()}
              </div>
              <span className="mono" style={{
                fontSize: 14, fontWeight: 600,
                color: data.summary.downline_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
              }}>
                {fmtMoney(data.summary.downline_profit)} ฿
              </span>
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', padding: '10px 0',
            }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>เราเก็บได้สุทธิ</span>
              <span className="mono" style={{
                fontSize: 20, fontWeight: 700,
                color: data.summary.total_profit >= 0 ? 'var(--status-success)' : 'var(--status-error)',
              }}>
                {fmtMoney(data.summary.total_profit)} ฿
              </span>
            </div>

            {data.is_root && (
              <div style={{
                marginTop: 12, padding: 12, borderRadius: 8,
                background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Wallet size={16} color="var(--status-success)" />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>เจ้าของระบบ — ไม่ต้องเคลียกับใคร</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
