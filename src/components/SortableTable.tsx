/**
 * SortableTable — คลิก header เรียง asc/desc
 *
 * Usage:
 *   const { sortedData, sortField, sortDir, toggleSort } = useSortableTable(data)
 *   <th onClick={() => toggleSort('username')}>
 *     ชื่อผู้ใช้ <SortIcon field="username" current={sortField} dir={sortDir} />
 *   </th>
 */
'use client'

import { useState, useMemo } from 'react'

type SortDir = 'asc' | 'desc' | null

export function useSortableTable<T extends Record<string, unknown>>(data: T[]) {
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>(null)

  const toggleSort = (field: string) => {
    if (sortField !== field) {
      setSortField(field)
      setSortDir('asc')
    } else if (sortDir === 'asc') {
      setSortDir('desc')
    } else {
      setSortField(null)
      setSortDir(null)
    }
  }

  const sortedData = useMemo(() => {
    if (!sortField || !sortDir) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]

      if (aVal == null && bVal == null) return 0
      if (aVal == null) return 1
      if (bVal == null) return -1

      let cmp = 0
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal
      } else {
        cmp = String(aVal).localeCompare(String(bVal), 'th')
      }

      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [data, sortField, sortDir])

  return { sortedData, sortField, sortDir, toggleSort }
}

/** Sort icon — แสดง ▲▼ ข้าง column header */
export function SortIcon({ field, current, dir }: { field: string; current: string | null; dir: SortDir }) {
  const isActive = field === current && dir != null

  return (
    <span style={{
      display: 'inline-flex', flexDirection: 'column', marginLeft: 4,
      fontSize: 8, lineHeight: 1, verticalAlign: 'middle', opacity: isActive ? 1 : 0.3,
    }}>
      <span style={{ color: isActive && dir === 'asc' ? 'var(--accent)' : 'var(--text-tertiary)' }}>&#9650;</span>
      <span style={{ color: isActive && dir === 'desc' ? 'var(--accent)' : 'var(--text-tertiary)', marginTop: -2 }}>&#9660;</span>
    </span>
  )
}
