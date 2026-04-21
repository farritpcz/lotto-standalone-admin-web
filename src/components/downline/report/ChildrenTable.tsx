// ตารางรายละเอียดใต้สาย
// Parent: src/app/downline/report/page.tsx

'use client'

import { ChevronDown, Users } from 'lucide-react'
import { ROLE_CONFIG } from '@/components/downline/types'
import type { ReportData } from './types'
import { fmtMoney, fmtAbs } from './types'

export default function ChildrenTable({ data }: { data: ReportData }) {
  if (data.children.length === 0) return null

  const total = data.children.reduce((s, c) => s + c.settlement, 0)

  return (
    <div className="card-surface" style={{ padding: 0, marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <ChevronDown size={16} color="#8b5cf6" />
        <span style={{ fontSize: 14, fontWeight: 600 }}>รายละเอียดใต้สาย</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="admin-table" style={{ fontSize: 13 }}>
          <thead>
            <tr>
              <th>สายล่าง</th>
              <th style={{ textAlign: 'right' }}>ถือ%</th>
              <th style={{ textAlign: 'right' }}>diff%</th>
              <th style={{ textAlign: 'right' }}>สมาชิก</th>
              <th style={{ textAlign: 'right' }}>Bets</th>
              <th style={{ textAlign: 'right' }}>ยอดสุทธิ tree</th>
              <th style={{ textAlign: 'right' }}>เคลีย</th>
            </tr>
          </thead>
          <tbody>
            {data.children.map(child => {
              const r = ROLE_CONFIG[child.role] || { label: child.role, color: '#6b7280', bg: 'rgba(107,114,128,0.15)' }
              return (
                <tr key={child.node_id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                        color: r.color, background: r.bg, textTransform: 'uppercase',
                      }}>{r.label}</span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{child.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>@{child.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{child.share_percent}%</td>
                  <td className="mono" style={{ textAlign: 'right', color: '#f59e0b', fontWeight: 600 }}>{child.diff_percent}%</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <Users size={12} /> {child.member_count}
                    </span>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{child.bets > 0 ? child.bets.toLocaleString() : '-'}</td>
                  <td className="mono" style={{
                    textAlign: 'right',
                    color: child.tree_net > 0 ? 'var(--status-success)' : child.tree_net < 0 ? 'var(--status-error)' : 'var(--text-tertiary)',
                  }}>
                    {child.tree_net !== 0 ? fmtMoney(child.tree_net) : '-'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {child.settlement !== 0 ? (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        fontWeight: 700, fontSize: 13,
                        color: child.settlement > 0 ? 'var(--status-success)' : 'var(--status-error)',
                      }}>
                        {child.settlement > 0
                          ? <>เก็บ {fmtAbs(child.settlement)}</>
                          : <>จ่าย {fmtAbs(child.settlement)}</>}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
            {data.children.length > 1 && (
              <tr style={{ borderTop: '2px solid var(--border)', fontWeight: 700 }}>
                <td colSpan={5} style={{ textAlign: 'right', color: 'var(--text-secondary)' }}>รวม</td>
                <td />
                <td style={{ textAlign: 'right' }}>
                  {total !== 0 ? (
                    <span style={{ fontWeight: 700, color: total > 0 ? 'var(--status-success)' : 'var(--status-error)' }}>
                      {total > 0 ? `เก็บ ${fmtAbs(total)}` : `จ่าย ${fmtAbs(total)}`}
                    </span>
                  ) : '-'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
