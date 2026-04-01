/**
 * Admin Dashboard — Linear/Vercel style
 *
 * - stat cards จาก API จริง (dashboardApi.getStats)
 * - กำไรวันนี้
 * - Quick actions: pending deposits/withdrawals
 */
'use client'

import { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'

/* stat card configs */
const statConfigs = [
  { key: 'total_members', label: 'สมาชิกทั้งหมด', color: '#3b82f6', prefix: '' },
  { key: 'active_members', label: 'สมาชิก Active', color: '#00e5a0', prefix: '' },
  { key: 'total_bets_today', label: 'Bets วันนี้', color: '#f5a623', prefix: '' },
  { key: 'total_amount_today', label: 'ยอดแทงวันนี้', color: '#a855f7', prefix: '฿' },
  { key: 'total_win_today', label: 'จ่ายรางวัลวันนี้', color: '#ef4444', prefix: '฿' },
  { key: 'open_rounds', label: 'รอบที่เปิด', color: '#06b6d4', prefix: '' },
]

export default function DashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getStats()
      .then(res => setStats(res.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const profit = (stats.total_amount_today || 0) - (stats.total_win_today || 0)

  return (
    <div className="page-container">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {/* ── Stat Cards ───────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {statConfigs.map(cfg => (
          <div key={cfg.key} className="stat-card">
            <div className="label" style={{ marginBottom: 8 }}>{cfg.label}</div>
            <div className="metric" style={{ color: cfg.color }}>
              {loading ? '—' : `${cfg.prefix}${(stats[cfg.key] || 0).toLocaleString()}`}
            </div>
          </div>
        ))}

        {/* Profit card */}
        <div className="stat-card" style={{
          borderColor: profit >= 0 ? 'rgba(0,229,160,0.2)' : 'rgba(239,68,68,0.2)',
        }}>
          <div className="label" style={{ marginBottom: 8 }}>กำไรวันนี้</div>
          <div className="metric" style={{ color: profit >= 0 ? '#00e5a0' : '#ef4444' }}>
            {loading ? '—' : `${profit >= 0 ? '+' : ''}฿${profit.toLocaleString()}`}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div className="label" style={{ marginBottom: 8 }}>รายการฝากรอดำเนินการ</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric" style={{ color: 'var(--status-warning)' }}>0</span>
            <a href="/deposits" className="btn btn-secondary" style={{ textDecoration: 'none' }}>ดูทั้งหมด</a>
          </div>
        </div>
        <div className="card-surface" style={{ padding: '16px 20px' }}>
          <div className="label" style={{ marginBottom: 8 }}>รายการถอนรอดำเนินการ</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="metric" style={{ color: 'var(--status-warning)' }}>0</span>
            <a href="/withdrawals" className="btn btn-secondary" style={{ textDecoration: 'none' }}>ดูทั้งหมด</a>
          </div>
        </div>
      </div>
    </div>
  )
}
