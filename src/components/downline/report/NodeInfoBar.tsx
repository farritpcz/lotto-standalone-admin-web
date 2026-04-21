// แถบข้อมูล node — ชื่อ, role, ถือ%, หัวสาย
// Parent: src/app/downline/report/page.tsx

'use client'

import { ROLE_CONFIG } from '@/components/downline/types'
import type { ReportData } from './types'

export default function NodeInfoBar({ data }: { data: ReportData }) {
  const r = ROLE_CONFIG[data.my_node.role] || { label: data.my_node.role, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
  return (
    <div className="card-surface" style={{
      padding: '12px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, color: r.color, background: r.bg, textTransform: 'uppercase' }}>{r.label}</span>
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
  )
}
