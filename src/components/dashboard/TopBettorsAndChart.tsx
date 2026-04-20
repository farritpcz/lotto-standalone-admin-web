/**
 * TopBettorsAndChart — Row 2 ของ dashboard (top 10 bettors + กราฟฝาก/ถอน 30 วัน)
 *
 * Rule: UI-only; รับ data จาก parent
 * Related: components/dashboard/types.ts, app/dashboard/page.tsx
 */
'use client'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { fmtShort, type DashboardData } from './types'

interface Props {
  topBettors: DashboardData['top_bettors']
  chartData: DashboardData['chart_data']
}

export default function TopBettorsAndChart({ topBettors, chartData }: Props) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.5fr',
        gap: 12,
        marginBottom: 20,
      }}
    >
      {/* Top 10 สมาชิกแทงเยอะสุด */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <p className="label">Top 10 สมาชิกแทงเยอะสุด</p>
          <span className="badge badge-info">{topBettors?.length || 0}</span>
        </div>
        {!topBettors?.length ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-tertiary)', fontSize: 13 }}>
            ไม่พบข้อมูล
          </div>
        ) : (
          <div style={{ fontSize: 12 }}>
            {topBettors.map((b, i) => (
              <div
                key={b.member_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: i < topBettors.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: 'var(--bg-elevated)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: 500 }}>{b.username || `#${b.member_id}`}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="mono" style={{ fontWeight: 600 }}>
                    {fmtShort(b.total_bet)}
                  </div>
                  <div style={{ color: b.profit >= 0 ? '#00e5a0' : '#ef4444', fontSize: 11 }}>
                    {b.profit >= 0 ? '+' : ''}
                    {fmtShort(b.profit)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* กราฟฝาก/ถอน */}
      <div className="card-surface" style={{ padding: 20 }}>
        <p className="label" style={{ marginBottom: 14 }}>
          ฝากเงิน / การถอนเงิน (30 วัน)
        </p>
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <LineChart data={chartData || []}>
              <defs>
                <linearGradient id="gradDeposit" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#00e5a0" />
                </linearGradient>
                <linearGradient id="gradWithdraw" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                tickFormatter={v => v?.slice(8)}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ stroke: 'var(--accent)', strokeWidth: 1, strokeDasharray: '3 3' }}
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-hover)',
                  borderRadius: 10,
                  fontSize: 12,
                  boxShadow: 'var(--shadow-lg)',
                  backdropFilter: 'blur(8px)',
                }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((v: any) => [fmtShort(Number(v || 0)), '']) as any}
                labelFormatter={l => `วันที่ ${l}`}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone"
                dataKey="deposits"
                stroke="url(#gradDeposit)"
                name="ฝากเงิน"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-base)' }}
              />
              <Line
                type="monotone"
                dataKey="withdrawals"
                stroke="url(#gradWithdraw)"
                name="ถอนเงิน"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: 'var(--bg-base)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
