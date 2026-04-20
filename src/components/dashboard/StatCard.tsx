/**
 * StatCard — stat card หลักของ dashboard (ยอดฝาก/ถอน/กำไร/สมาชิกใหม่)
 *
 * Rule: UI-only; คำนวณ %change จาก value vs prev
 * Related: app/dashboard/page.tsx, components/dashboard/types.ts
 */
'use client'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { fmt, pctChange } from './types'

type Variant = 'brand' | 'violet' | 'warn' | 'danger' | 'info'

interface Props {
  label: string
  value: number
  prev: number
  icon: React.ComponentType<{ size?: number }>
  variant?: Variant
  format?: 'money' | 'count'
}

const ICON_BG: Record<Variant, string> = {
  brand: 'linear-gradient(135deg, #00e5a0, #06b6d4)',
  violet: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
  warn: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
  danger: 'linear-gradient(135deg, #ef4444, #f87171)',
  info: 'linear-gradient(135deg, #3b82f6, #22d3ee)',
}

const ICON_CLASS: Record<Variant, string> = {
  brand: 'gradient',
  violet: 'gradient-violet',
  warn: 'gradient-warn',
  danger: 'gradient-danger',
  info: 'gradient-info',
}

const ACCENT_CLASS: Record<Variant, string> = {
  brand: '',
  violet: 'accent-violet',
  warn: 'accent-warn',
  danger: 'accent-danger',
  info: 'accent-info',
}

export default function StatCard({
  label,
  value,
  prev,
  icon: Icon,
  variant = 'info',
  format = 'money',
}: Props) {
  const pct = pctChange(value, prev)
  const iconBg = ICON_BG[variant]

  return (
    <div className={`stat-card ${ACCENT_CLASS[variant]}`} style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Accent top bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: iconBg,
          opacity: 0.8,
        }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            {label}
          </div>
          <div className="metric" style={{ color: 'var(--text-primary)' }}>
            {format === 'money' ? (
              fmt(value)
            ) : (
              <>
                {value.toLocaleString('th-TH')}{' '}
                <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-secondary)' }}>
                  / คน
                </span>
              </>
            )}
          </div>
        </div>
        <div
          className={`stat-icon ${ICON_CLASS[variant]}`}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: iconBg,
            color: 'white',
            flexShrink: 0,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <Icon size={20} />
        </div>
      </div>
      <div
        style={{
          marginTop: 12,
          fontSize: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          paddingTop: 10,
          borderTop: '1px dashed var(--border)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 3,
            padding: '2px 8px',
            borderRadius: 999,
            fontWeight: 700,
            background: pct >= 0 ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
            color: pct >= 0 ? 'var(--status-success)' : 'var(--status-error)',
          }}
        >
          {pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {pct >= 0 ? '+' : ''}
          {pct}%
        </span>
        <span style={{ color: 'var(--text-tertiary)' }}>เทียบเดือนก่อน</span>
      </div>
    </div>
  )
}
