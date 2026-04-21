// Quick stats bar — 5 card + click filter
// Parent: src/app/rounds/page.tsx

'use client'

import { STATUS_CONFIG } from './types'

interface Props {
  statusCounts: Record<string, number>
  statusFilter: string
  onSelect: (s: string) => void
}

export default function StatsBar({ statusCounts, statusFilter, onSelect }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
      {(['upcoming', 'open', 'closed', 'resulted', 'voided'] as const).map(s => {
        const cfg = STATUS_CONFIG[s]
        const isActive = statusFilter === s
        return (
          <div key={s} onClick={() => onSelect(isActive ? '' : s)} style={{
            background: isActive ? cfg.bg : 'var(--bg-surface)',
            border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
            borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
            transition: 'all 0.15s',
          }}>
            <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600, marginBottom: 4 }}>{cfg.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: isActive ? cfg.color : 'var(--text-primary)' }}>
              {statusCounts[s] ?? '-'}
            </div>
          </div>
        )
      })}
    </div>
  )
}
