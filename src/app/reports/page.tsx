/**
 * Admin — รายงาน (Summary + Profit/Loss)
 * Linear/Vercel dark theme
 *
 * - Date range picker
 * - 4 stat cards: bets, amount, payout, profit
 * - ใช้ design system: stat-card, input, metric
 */
'use client'

import { useEffect, useState } from 'react'
import { reportApi } from '@/lib/api'

export default function ReportsPage() {
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
    <div className="page-container">
      <div className="page-header">
        <h1>รายงาน</h1>
      </div>

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
    </div>
  )
}
