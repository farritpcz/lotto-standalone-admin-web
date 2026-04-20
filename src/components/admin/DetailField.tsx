/**
 * DetailField — key/value row ใน detail modal
 * รองรับ `children` สำหรับกรณีต้องการ render custom (เช่น badge)
 */
import React from 'react'

export default function DetailField({ label, value, color, bold, children }: {
  label: string
  value?: string
  color?: string
  bold?: boolean
  children?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '10px 0', borderBottom: '1px solid var(--border)',
    }}>
      <span className="label">{label}</span>
      {children || (
        <span style={{ fontWeight: bold ? 700 : 400, color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
          {value}
        </span>
      )}
    </div>
  )
}
