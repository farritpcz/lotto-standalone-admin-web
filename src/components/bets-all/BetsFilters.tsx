// Component: BetsFilters — tabs (status) + search + date filter bar
// Parent: src/app/bets/page.tsx
'use client'

import { Clock, Trophy, XCircle, Ban, Search, FileText, Calendar } from 'lucide-react'

export const filterTabs = [
  { key: '',          label: 'ทั้งหมด', icon: FileText },
  { key: 'pending',   label: 'รอผล',    icon: Clock },
  { key: 'won',       label: 'ชนะ',     icon: Trophy },
  { key: 'lost',      label: 'แพ้',     icon: XCircle },
  { key: 'cancelled', label: 'ยกเลิก',  icon: Ban },
]

interface Props {
  filter: string
  setFilter: (v: string) => void
  searchInput: string
  setSearchInput: (v: string) => void
  dateFilter: string
  handleDateFilter: (key: string) => void
  dateFrom: string
  setDateFrom: (v: string) => void
  dateTo: string
  setDateTo: (v: string) => void
}

export default function BetsFilters({
  filter, setFilter,
  searchInput, setSearchInput,
  dateFilter, handleDateFilter,
  dateFrom, setDateFrom, dateTo, setDateTo,
}: Props) {
  return (
    <>
      {/* ── Filter Tabs + Search ──────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {filterTabs.map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              className={filter === tab.key ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12, gap: 4 }}>
              <Icon size={13} /> {tab.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
            placeholder="ค้นหา username / เลข..." className="input"
            style={{ width: 220, height: 32, paddingLeft: 32 }} />
        </div>
      </div>

      {/* ── Date Filter ───────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { key: 'today', label: 'วันนี้' },
          { key: 'yesterday', label: 'เมื่อวาน' },
          { key: 'custom', label: 'กำหนดเอง' },
        ].map(d => (
          <button key={d.key} onClick={() => handleDateFilter(d.key)}
            className={dateFilter === d.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12, gap: 4 }}>
            <Calendar size={13} /> {d.label}
          </button>
        ))}
        {dateFilter === 'custom' && (
          <>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="input" style={{ height: 32, fontSize: 12, width: 150 }} />
            <span style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>ถึง</span>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="input" style={{ height: 32, fontSize: 12, width: 150 }} />
          </>
        )}
      </div>
    </>
  )
}
