/**
 * Admin Dashboard V2 — ภาพรวมยอดฝาก/ถอน/กำไร/สมาชิก (สไตล์เจริญดี88)
 *
 * Rule: page-level (data fetching + state) — render แบ่งไป components/dashboard/*
 * Related:
 *  - components/dashboard/types.ts
 *  - components/dashboard/DateFilterBar.tsx
 *  - components/dashboard/StatCard.tsx
 *  - components/dashboard/TopBettorsAndChart.tsx
 *  - components/dashboard/TransactionsRow.tsx
 *  - components/dashboard/TrackingAndCredits.tsx
 *  - GET /dashboard/v2
 */
'use client'

import { useEffect, useState } from 'react'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  UserPlus,
  RefreshCw,
} from 'lucide-react'
import { api } from '@/lib/api'
import { DashboardSkeleton } from '@/components/Loading'
import DateFilterBar from '@/components/dashboard/DateFilterBar'
import StatCard from '@/components/dashboard/StatCard'
import TopBettorsAndChart from '@/components/dashboard/TopBettorsAndChart'
import TransactionsRow from '@/components/dashboard/TransactionsRow'
import TrackingAndCredits from '@/components/dashboard/TrackingAndCredits'
import {
  getPresetRange,
  type DashboardData,
  type FilterPreset,
} from '@/components/dashboard/types'

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // ─── Date Filter State ───
  const [activePreset, setActivePreset] = useState<FilterPreset>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')

  const loadData = (preset?: FilterPreset, from?: string, to?: string) => {
    const p = preset || activePreset
    const range = p === 'custom' && from && to ? { from, to } : getPresetRange(p)

    setLoading(true)
    api
      .get(`/dashboard/v2?from=${range.from}&to=${range.to}`)
      .then(res => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handlePreset = (p: FilterPreset) => {
    setActivePreset(p)
    if (p !== 'custom') loadData(p)
  }

  const handleCustomSearch = () => {
    if (customFrom && customTo) loadData('custom', customFrom, customTo)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading || !data) return <DashboardSkeleton />

  const s = data.summary

  return (
    <div className="page-container">
      {/* ═══ Header ════════════════════════════════════════════════════ */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ภาพรวมระบบ</h1>
          <p className="page-subtitle">ดูภาพรวมยอดฝาก ถอน กำไร และสมาชิกใหม่</p>
        </div>
        <button className="btn btn-secondary" onClick={() => loadData()}>
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* ═══ Date Filter ═══════════════════════════════════════════════ */}
      <DateFilterBar
        activePreset={activePreset}
        customFrom={customFrom}
        customTo={customTo}
        onPresetChange={handlePreset}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
        onCustomSearch={handleCustomSearch}
      />

      {/* ═══ Row 1: Top 4 Stat Cards ══════════════════════════════════ */}
      <div
        className="grid-stats"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="ยอดฝาก"
          value={s.deposits_this_month}
          prev={s.deposits_last_month}
          icon={ArrowDownToLine}
          variant="info"
        />
        <StatCard
          label="การถอนเงิน"
          value={s.withdrawals_this_month}
          prev={s.withdrawals_last_month}
          icon={ArrowUpFromLine}
          variant="danger"
        />
        <StatCard
          label="กำไร/ขาดทุน (เบื้องต้น)"
          value={s.profit_this_month}
          prev={s.profit_last_month}
          icon={DollarSign}
          variant="brand"
        />
        <StatCard
          label="สมาชิกใหม่"
          value={s.new_members_this_month}
          prev={s.new_members_last_month}
          icon={UserPlus}
          variant="warn"
          format="count"
        />
      </div>

      {/* ═══ Row 2: Top Bettors + Chart ═══════════════════════════════ */}
      <TopBettorsAndChart topBettors={data.top_bettors} chartData={data.chart_data} />

      {/* ═══ Row 3: Bank + Top Depositors + Recent Tx ═════════════════ */}
      <TransactionsRow data={data} />

      {/* ═══ Row 4: Member Tracking + Credit Stats ════════════════════ */}
      <TrackingAndCredits
        memberTracking={data.member_tracking}
        creditStats={data.credit_stats}
      />
    </div>
  )
}
