/**
 * TrackingAndCredits — Row 4: ติดตามสมาชิกรายวัน + Credit stats grid 3×3
 *
 * Rule: UI-only
 * Related: components/dashboard/types.ts, app/dashboard/page.tsx
 */
'use client'
import {
  Users,
  UserPlus,
  Wallet,
  TrendingUp,
  TrendingDown,
  Activity,
  Ban,
} from 'lucide-react'
import { fmt, type DashboardData } from './types'

interface Props {
  memberTracking: DashboardData['member_tracking']
  creditStats: DashboardData['credit_stats']
}

export default function TrackingAndCredits({ memberTracking, creditStats }: Props) {
  // ───── Rows: ติดตามสมาชิก ─────
  const trackingRows = [
    {
      icon: Users,
      label: 'สมาชิกสมัครโดยตรง',
      value: `${memberTracking.direct_signups} / คน`,
      pct: memberTracking.direct_signups > 0 ? '+100%' : '0%',
    },
    {
      icon: UserPlus,
      label: 'สมาชิกสมัครแนะนำเพื่อน',
      value: `${memberTracking.referral_signups} / คน`,
      pct: memberTracking.referral_signups > 0 ? '+100%' : '0%',
    },
    {
      icon: Wallet,
      label: 'สมาชิกฝากเงินวันนี้',
      value: `${memberTracking.deposited_today} / คน`,
      pct: memberTracking.deposited_today > 0 ? '+100%' : '0%',
    },
  ]

  // ───── Grid: Credit stats ─────
  const creditItems = [
    { label: 'เพิ่มเครดิต', value: creditStats.credit_added, color: '#00e5a0', icon: TrendingUp },
    { label: 'ลดเครดิต', value: creditStats.credit_deducted, color: '#ef4444', icon: TrendingDown },
    {
      label: 'จำนวนสมาชิกฝากเงิน',
      value: creditStats.deposit_count,
      color: '#3b82f6',
      icon: Users,
      isCount: true,
    },
    {
      label: 'ค่าคอมมิชชั่นรวม',
      value: creditStats.commission_total,
      color: '#a855f7',
      icon: Activity,
    },
    {
      label: 'ยกเลิกการฝากเงิน',
      value: creditStats.cancelled_deposits,
      color: '#f5a623',
      icon: Ban,
    },
    {
      label: 'ยกเลิกการถอนเงิน',
      value: creditStats.cancelled_withdrawals,
      color: '#ef4444',
      icon: Ban,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
      {/* ติดตามสมาชิกรายวัน */}
      <div className="card-surface" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 14 }}>
          ติดตามสมาชิกรายวัน
        </p>
        {trackingRows.map((item, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <item.icon size={16} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{item.value}</div>
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: 6,
                background:
                  item.pct.startsWith('+') && item.pct !== '+0%'
                    ? 'rgba(0,229,160,0.12)'
                    : 'rgba(239,68,68,0.12)',
                color:
                  item.pct.startsWith('+') && item.pct !== '+0%' ? '#00e5a0' : '#ef4444',
              }}
            >
              {item.pct}
            </span>
          </div>
        ))}
      </div>

      {/* Credit Stats Grid 3×3 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {creditItems.map((item, i) => (
          <div key={i} className="card-surface" style={{ padding: '16px 18px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 10,
              }}
            >
              <div className="label">{item.label}</div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: `${item.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <item.icon size={16} color={item.color} />
              </div>
            </div>
            <div className="metric" style={{ fontSize: 20, color: item.color }}>
              {item.isCount ? `${item.value} / คน` : fmt(item.value)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
              +0% ตั้งแต่รายเดือน
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
