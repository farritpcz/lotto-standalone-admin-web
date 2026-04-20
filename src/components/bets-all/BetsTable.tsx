// Component: BetsTable — renders bill rows table + pagination
// Parent: src/app/bets/page.tsx
'use client'

import { FileText, Eye } from 'lucide-react'
import Loading from '@/components/Loading'
import { filterTabs } from './BetsFilters'
import {
  type BillRow,
  getBillStatus, billStatusMap,
  fmtBillId, fmtMoney, fmtDate, relTime,
} from './types'

interface Props {
  rows: BillRow[]
  loading: boolean
  filter: string
  page: number
  totalPages: number
  onPageChange: (next: number) => void
  onOpenBill: (row: BillRow) => void
}

export default function BetsTable({ rows, loading, filter, page, totalPages, onPageChange, onOpenBill }: Props) {
  return (
    <div className="card-surface" style={{ overflow: 'hidden' }}>
      {loading ? (
        <Loading inline text="กำลังโหลด..." />
      ) : rows.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <FileText size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div style={{ fontSize: 14 }}>ไม่พบรายการ{filter ? ` (${filterTabs.find(t => t.key === filter)?.label})` : ''}</div>
        </div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>หมายเลขบิล</th>
              <th>สมาชิก</th>
              <th style={{ textAlign: 'right' }}>ยอดแทง</th>
              <th style={{ textAlign: 'right' }}>รางวัล</th>
              <th style={{ textAlign: 'right' }}>กำไร/ขาดทุน</th>
              <th>สถานะ</th>
              <th>เวลา</th>
              <th style={{ textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(row => {
              const billSt = getBillStatus(row)
              const st = billStatusMap[billSt] || billStatusMap.pending
              const net = row.total_win - row.total_amount
              return (
                <tr key={row.batch_id} onClick={() => onOpenBill(row)} style={{ cursor: 'pointer' }}>
                  <td>
                    <div className="mono" style={{ color: 'var(--accent)', fontWeight: 600, fontSize: 12 }}>{fmtBillId(row.batch_id)}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{row.bet_count} เลข</div>
                  </td>
                  <td>
                    <a href={`/members/${row.member_id}`} target="_blank" rel="noopener"
                      onClick={e => e.stopPropagation()}
                      style={{ color: 'var(--text-primary)', textDecoration: 'none', fontWeight: 500 }}>
                      {row.username || '—'}
                    </a>
                  </td>
                  <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(row.total_amount)}</td>
                  <td className="mono" style={{ textAlign: 'right', color: row.total_win > 0 ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                    {row.total_win > 0 ? `+${fmtMoney(row.total_win)}` : '—'}
                  </td>
                  <td className="mono" style={{
                    textAlign: 'right', fontWeight: 600,
                    color: billSt === 'pending' ? 'var(--text-tertiary)' : net > 0 ? 'var(--status-error)' : 'var(--status-success)',
                  }}>
                    {billSt === 'pending' ? '—' : net > 0 ? `-${fmtMoney(net)}` : `+${fmtMoney(-net)}`}
                  </td>
                  <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                  <td style={{ fontSize: 12 }}>
                    <div style={{ color: 'var(--text-secondary)' }}>{fmtDate(row.created_at)}</div>
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 11 }}>{relTime(row.created_at)}</div>
                  </td>
                  <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                    <button onClick={() => onOpenBill(row)} title="ดูรายละเอียดบิล"
                      className="btn btn-ghost" style={{ width: 28, height: 28, padding: 0, minWidth: 0 }}>
                      <Eye size={14} color="var(--accent)" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
          padding: '12px 16px', borderTop: '1px solid var(--border)',
        }}>
          <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
            className="btn btn-secondary" style={{ fontSize: 12 }}>ก่อนหน้า</button>
          <span className="label" style={{ padding: '0 8px' }}>หน้า {page} / {totalPages}</span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="btn btn-secondary" style={{ fontSize: 12 }}>ถัดไป</button>
        </div>
      )}
    </div>
  )
}
