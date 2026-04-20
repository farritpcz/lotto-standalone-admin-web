/**
 * StatCard — metric card ใช้ใน admin pages (deposits, withdrawals, member-levels, ฯลฯ)
 * ประกอบด้วย icon + label + value ที่ hi-light ด้วย color token
 */
import React from 'react'

export default function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ComponentType<{ size?: number }>
  label: string
  value: string
  color: string
}) {
  return (
    <div className="stat-card" style={{ padding: '14px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <Icon size={15} />
        <span className="label">{label}</span>
      </div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color }}>{value}</div>
    </div>
  )
}
