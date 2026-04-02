/**
 * Admin Dashboard V2 — แบบเจริญดี88
 *
 * Sections:
 * 1. Top 4 stat cards (ยอดฝาก/ถอน/กำไร/สมาชิกใหม่ + % เทียบเดือนก่อน)
 * 2. Top 10 สมาชิกแทงเยอะสุด + กราฟฝาก/ถอน 30 วัน
 * 3. บัญชีธนาคาร + Top 10 ฝาก/ถอน + ธุรกรรมล่าสุด
 * 4. ติดตามสมาชิกรายวัน + Credit stats grid
 *
 * Design: Linear/Vercel dark theme
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import {
  TrendingUp, TrendingDown, Users, DollarSign, ArrowDownToLine, ArrowUpFromLine,
  CreditCard, Activity, UserPlus, Wallet, Ban, RefreshCw
} from 'lucide-react'
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts'

// ─── Types ──────────────────────────────────────────────────────────────
interface DashboardData {
  summary: {
    deposits_this_month: number; deposits_last_month: number
    withdrawals_this_month: number; withdrawals_last_month: number
    profit_this_month: number; profit_last_month: number
    new_members_this_month: number; new_members_last_month: number
  }
  chart_data: { date: string; deposits: number; withdrawals: number }[]
  top_bettors: { member_id: number; username: string; total_bet: number; total_win: number; profit: number }[]
  top_depositors: { member_id: number; username: string; total_deposit: number; total_withdraw: number }[]
  recent_deposits: { id: number; username: string; amount: number; status: string; created_at: string }[]
  recent_withdrawals: { id: number; username: string; amount: number; status: string; bank_code: string; created_at: string }[]
  member_tracking: { direct_signups: number; referral_signups: number; deposited_today: number }
  credit_stats: {
    credit_added: number; credit_deducted: number; deposit_count: number
    commission_total: number; cancelled_deposits: number; cancelled_withdrawals: number
  }
  bank_accounts: { id: number; bank_code: string; bank_name: string; account_number: string; account_name: string }[]
}

// ─── Helpers ────────────────────────────────────────────────────────────
const fmt = (n: number) => `฿${Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtShort = (n: number) => `฿${Math.abs(n).toLocaleString('th-TH', { maximumFractionDigits: 0 })}`
const pctChange = (curr: number, prev: number) => {
  if (prev === 0) return curr > 0 ? 100 : curr < 0 ? -100 : 0
  return Math.round(((curr - prev) / Math.abs(prev)) * 100)
}

const statusBadge: Record<string, { bg: string; color: string; label: string }> = {
  pending:  { bg: 'rgba(245,166,35,0.15)', color: '#f5a623', label: 'รอ' },
  approved: { bg: 'rgba(0,229,160,0.15)',  color: '#00e5a0', label: 'สำเร็จ' },
  rejected: { bg: 'rgba(239,68,68,0.15)',  color: '#ef4444', label: 'ปฏิเสธ' },
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [txTab, setTxTab] = useState<'deposit' | 'withdraw'>('deposit')

  const loadData = () => {
    setLoading(true)
    api.get('/dashboard/v2')
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const s = data?.summary

  // ─── Loading ────────────────────────────────────────────────────
  if (loading || !data) {
    return (
      <div className="page-container">
        <div className="page-header"><h1>Dashboard</h1></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 100 }}><div className="skeleton" style={{ height: 14, width: 80, marginBottom: 12 }} /><div className="skeleton" style={{ height: 28, width: 120 }} /></div>)}
        </div>
      </div>
    )
  }

  // ─── Stat Card Helper ──────────────────────────────────────────
  const StatCard = ({ label, value, prev, icon: Icon, color }: {
    label: string; value: number; prev: number; icon: React.ComponentType<{ size?: number }>; color: string
  }) => {
    const pct = pctChange(value, prev)
    return (
      <div className="card-surface" style={{ padding: '18px 20px', borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="label" style={{ marginBottom: 8 }}>{label}</div>
            <div className="metric" style={{ fontSize: 24, color }}>{fmt(value)}</div>
          </div>
          <div style={{ width: 42, height: 42, borderRadius: '50%', background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={20} />
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          {pct >= 0 ? <TrendingUp size={14} color="#00e5a0" /> : <TrendingDown size={14} color="#ef4444" />}
          <span style={{ color: pct >= 0 ? '#00e5a0' : '#ef4444', fontWeight: 600 }}>{pct >= 0 ? '+' : ''}{pct}%</span>
          <span style={{ color: 'var(--text-tertiary)' }}>ตั้งแต่รายเดือน</span>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* ═══ Header ════════════════════════════════════════════════════ */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <h1>ภาพรวมระบบ</h1>
        <button className="btn btn-ghost" onClick={loadData} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ═══ Row 1: Top 4 Stat Cards ══════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 20 }}>
        <StatCard label="ยอดฝาก" value={s!.deposits_this_month} prev={s!.deposits_last_month} icon={ArrowDownToLine} color="#3b82f6" />
        <StatCard label="การถอนเงิน" value={s!.withdrawals_this_month} prev={s!.withdrawals_last_month} icon={ArrowUpFromLine} color="#ef4444" />
        <StatCard label="กำไร/ขาดทุน (เบื้องต้น)" value={s!.profit_this_month} prev={s!.profit_last_month} icon={DollarSign} color="#00e5a0" />
        <div className="card-surface" style={{ padding: '18px 20px', borderLeft: '3px solid #f5a623' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>สมาชิกใหม่</div>
              <div className="metric" style={{ fontSize: 24, color: '#f5a623' }}>
                {s!.new_members_this_month} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>/ คน</span>
              </div>
            </div>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#f5a62315', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={20} />
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            {(() => { const p = pctChange(s!.new_members_this_month, s!.new_members_last_month); return (<>
              {p >= 0 ? <TrendingUp size={14} color="#00e5a0" /> : <TrendingDown size={14} color="#ef4444" />}
              <span style={{ color: p >= 0 ? '#00e5a0' : '#ef4444', fontWeight: 600 }}>{p >= 0 ? '+' : ''}{p}%</span>
              <span style={{ color: 'var(--text-tertiary)' }}>ตั้งแต่รายเดือน</span>
            </>)})()}
          </div>
        </div>
      </div>

      {/* ═══ Row 2: Top Bettors + Chart ═══════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12, marginBottom: 20 }}>
        {/* Top 10 สมาชิกแทงเยอะสุด */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p className="label">Top 10 สมาชิกแทงเยอะสุด</p>
            <span className="badge badge-info">{data.top_bettors?.length || 0}</span>
          </div>
          {!data.top_bettors?.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่พบข้อมูล</div>
          ) : (
            <div style={{ fontSize: 12 }}>
              {data.top_bettors.map((b, i) => (
                <div key={b.member_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < data.top_bettors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{i + 1}</span>
                    <span style={{ fontWeight: 500 }}>{b.username || `#${b.member_id}`}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontWeight: 600 }}>{fmtShort(b.total_bet)}</div>
                    <div style={{ color: b.profit >= 0 ? '#00e5a0' : '#ef4444', fontSize: 11 }}>
                      {b.profit >= 0 ? '+' : ''}{fmtShort(b.profit)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* กราฟฝาก/ถอน */}
        <div className="card-surface" style={{ padding: 20 }}>
          <p className="label" style={{ marginBottom: 14 }}>ฝากเงิน / การถอนเงิน (30 วัน)</p>
          <div style={{ width: '100%', height: 280 }}>
            <ResponsiveContainer>
              <LineChart data={data.chart_data || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => v?.slice(8)} />
                <YAxis tick={{ fontSize: 10, fill: '#666' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => [fmtShort(v), '']}
                  labelFormatter={l => `วันที่ ${l}`}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="deposits" stroke="#3b82f6" name="ฝากเงิน" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" name="ถอนเงิน" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Row 3: Bank + Top Depositors + Recent Tx ═════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {/* บัญชีธนาคาร */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p className="label">บัญชีธนาคาร</p>
            <span className="badge badge-info">{data.bank_accounts?.length || 0}</span>
          </div>
          {!data.bank_accounts?.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>
              <CreditCard size={32} strokeWidth={1} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <div>ไม่พบข้อมูล</div>
            </div>
          ) : data.bank_accounts.map(ba => (
            <div key={ba.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
              <div style={{ fontWeight: 600 }}>{ba.bank_name || ba.bank_code}</div>
              <div className="mono" style={{ color: 'var(--text-secondary)' }}>{ba.account_number} · {ba.account_name}</div>
            </div>
          ))}
        </div>

        {/* Top 10 ฝาก/ถอน */}
        <div className="card-surface" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p className="label">สมาชิก 10 อันดับแรก — ยอดฝากและถอนสูงสุด</p>
            <span className="badge badge-info">{data.top_depositors?.length || 0}</span>
          </div>
          {!data.top_depositors?.length ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>ไม่พบข้อมูล</div>
          ) : (
            <div style={{ fontSize: 12 }}>
              {data.top_depositors.map((d, i) => (
                <div key={d.member_id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < data.top_depositors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <span>{d.username || `#${d.member_id}`}</span>
                  <div className="mono" style={{ display: 'flex', gap: 12 }}>
                    <span style={{ color: '#3b82f6' }}>+{fmtShort(d.total_deposit)}</span>
                    <span style={{ color: '#ef4444' }}>-{fmtShort(d.total_withdraw)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ธุรกรรมล่าสุด */}
        <div className="card-surface" style={{ padding: 20 }}>
          <p className="label" style={{ marginBottom: 10 }}>ธุรกรรมล่าสุด</p>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {(['deposit', 'withdraw'] as const).map(t => (
              <button key={t} onClick={() => setTxTab(t)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                background: txTab === t ? (t === 'deposit' ? '#3b82f6' : '#ef4444') : 'var(--bg-elevated)',
                color: txTab === t ? 'white' : 'var(--text-secondary)',
              }}>
                {t === 'deposit' ? `ฝากเงิน ${data.recent_deposits?.length || 0}` : `ถอนเงิน ${data.recent_withdrawals?.length || 0}`}
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12 }}>
            {(txTab === 'deposit' ? data.recent_deposits : data.recent_withdrawals)?.map(tx => {
              const badge = statusBadge[tx.status] || statusBadge.pending
              return (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{tx.username || `#${tx.id}`}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>{tx.created_at?.slice(0, 16)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ fontWeight: 600 }}>{fmtShort(tx.amount)}</span>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color }}>{badge.label}</span>
                  </div>
                </div>
              )
            })}
            {!(txTab === 'deposit' ? data.recent_deposits : data.recent_withdrawals)?.length && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-tertiary)' }}>ไม่มีรายการ</div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ Row 4: Member Tracking + Credit Stats ════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
        {/* ติดตามสมาชิกรายวัน */}
        <div className="card-surface" style={{ padding: 20 }}>
          <p className="label" style={{ marginBottom: 14 }}>ติดตามสมาชิกรายวัน</p>
          {[
            { icon: Users, label: 'สมาชิกสมัครโดยตรง', value: `${data.member_tracking.direct_signups} / คน`, pct: data.member_tracking.direct_signups > 0 ? '+100%' : '0%' },
            { icon: UserPlus, label: 'สมาชิกสมัครแนะนำเพื่อน', value: `${data.member_tracking.referral_signups} / คน`, pct: data.member_tracking.referral_signups > 0 ? '+100%' : '0%' },
            { icon: Wallet, label: 'สมาชิกฝากเงินวันนี้', value: `${data.member_tracking.deposited_today} / คน`, pct: data.member_tracking.deposited_today > 0 ? '+100%' : '0%' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.value}</div>
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6, background: item.pct.startsWith('+') && item.pct !== '+0%' ? 'rgba(0,229,160,0.12)' : 'rgba(239,68,68,0.12)', color: item.pct.startsWith('+') && item.pct !== '+0%' ? '#00e5a0' : '#ef4444' }}>
                {item.pct}
              </span>
            </div>
          ))}
        </div>

        {/* Credit Stats Grid 3x3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {[
            { label: 'เพิ่มเครดิต', value: data.credit_stats.credit_added, color: '#00e5a0', icon: TrendingUp },
            { label: 'ลดเครดิต', value: data.credit_stats.credit_deducted, color: '#ef4444', icon: TrendingDown },
            { label: 'จำนวนสมาชิกฝากเงิน', value: data.credit_stats.deposit_count, color: '#3b82f6', icon: Users, isCount: true },
            { label: 'ค่าคอมมิชชั่นรวม', value: data.credit_stats.commission_total, color: '#a855f7', icon: Activity },
            { label: 'ยกเลิกการฝากเงิน', value: data.credit_stats.cancelled_deposits, color: '#f5a623', icon: Ban },
            { label: 'ยกเลิกการถอนเงิน', value: data.credit_stats.cancelled_withdrawals, color: '#ef4444', icon: Ban },
          ].map((item, i) => (
            <div key={i} className="card-surface" style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div className="label">{item.label}</div>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <item.icon size={16} color={item.color} />
                </div>
              </div>
              <div className="metric" style={{ fontSize: 20, color: item.color }}>
                {item.isCount ? `${item.value} / คน` : fmt(item.value)}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>+0% ตั้งแต่รายเดือน</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
