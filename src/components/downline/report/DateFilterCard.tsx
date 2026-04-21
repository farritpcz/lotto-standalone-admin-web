// Quick-pick + manual date range filter — downline/report
// Parent: src/app/downline/report/page.tsx

'use client'

import { Filter } from 'lucide-react'

interface Props {
  dateFrom: string
  dateTo: string
  today: string
  onChange: (from: string, to: string) => void
}

export default function DateFilterCard({ dateFrom, dateTo, today, onChange }: Props) {
  // คำนวณช่วงวันที่สำเร็จรูป (วันนี้, เมื่อวาน, ต้นเดือน/ท้ายเดือน/เดือนก่อน)
  const d = new Date()
  const fmt = (dt: Date) => dt.toISOString().split('T')[0]
  const todayStr = fmt(d)
  const yesterday = new Date(d); yesterday.setDate(d.getDate() - 1)
  const monthStart = fmt(new Date(d.getFullYear(), d.getMonth(), 1))
  const mid = fmt(new Date(d.getFullYear(), d.getMonth(), 15))
  const day16 = fmt(new Date(d.getFullYear(), d.getMonth(), 16))
  const monthEnd = fmt(new Date(d.getFullYear(), d.getMonth() + 1, 0))
  const prevMonthStart = fmt(new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const prevMonthEnd = fmt(new Date(d.getFullYear(), d.getMonth(), 0))

  const presets = [
    { label: 'วันนี้', from: todayStr, to: todayStr },
    { label: 'เมื่อวาน', from: fmt(yesterday), to: fmt(yesterday) },
    { label: 'เดือนนี้', from: monthStart, to: todayStr },
    { label: 'ต้นเดือน (1-15)', from: monthStart, to: mid },
    { label: 'ท้ายเดือน (16+)', from: day16, to: monthEnd },
    { label: 'เดือนที่แล้ว', from: prevMonthStart, to: prevMonthEnd },
  ]

  return (
    <div className="card-surface" style={{ padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
        {presets.map(p => (
          <button key={p.label}
            className={`btn ${dateFrom === p.from && dateTo === p.to ? 'btn-primary' : 'btn-secondary'}`}
            style={{ fontSize: 12, padding: '4px 10px', height: 28 }}
            onClick={() => onChange(p.from, p.to)}>
            {p.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label className="label">จาก</label>
          <input className="input" type="date" value={dateFrom} onChange={e => onChange(e.target.value, dateTo)} />
        </div>
        <div>
          <label className="label">ถึง</label>
          <input className="input" type="date" value={dateTo} onChange={e => onChange(dateFrom, e.target.value)} />
        </div>
        <button className="btn btn-secondary" onClick={() => onChange(today, today)}>
          <Filter size={14} /> ล้าง
        </button>
      </div>
    </div>
  )
}
