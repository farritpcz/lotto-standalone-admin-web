// Component: TransactionsTable — credit history tab (ประวัติเครดิต)
// Parent: src/app/members/[id]/page.tsx

'use client'

import Loading from '@/components/Loading'
import PaginationBar from './PaginationBar'
import { Transaction, fmtMoney, fmtDateTime } from './types'

/** Transaction type → badge class + label (Thai) */
const txTypeBadge: Record<string, { cls: string; label: string }> = {
  deposit:  { cls: 'badge-success', label: 'ฝาก' },
  withdraw: { cls: 'badge-error', label: 'ถอน' },
  bet:      { cls: 'badge-warning', label: 'แทง' },
  win:      { cls: 'badge-success', label: 'ชนะ' },
  refund:   { cls: 'badge-info', label: 'คืนเงิน' },
  adjust:   { cls: 'badge-info', label: 'ปรับยอด' },
}

interface Props {
  txns: Transaction[]
  loading: boolean
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export default function TransactionsTable({ txns, loading, page, totalPages, onPrev, onNext }: Props) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลดประวัติเครดิต..." />
        ) : txns.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            ยังไม่มีรายการธุรกรรม
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>ประเภท</th>
                  <th style={{ textAlign: 'right' }}>จำนวนเงิน</th>
                  <th style={{ textAlign: 'right' }}>ก่อน</th>
                  <th style={{ textAlign: 'right' }}>หลัง</th>
                  <th>หมายเหตุ</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {txns.map(tx => {
                  const badge = txTypeBadge[tx.type] || { cls: 'badge-neutral', label: tx.type }
                  return (
                    <tr key={tx.id}>
                      <td className="secondary mono">{tx.id}</td>
                      <td><span className={`badge ${badge.cls}`}>{badge.label}</span></td>
                      <td className="mono" style={{
                        textAlign: 'right',
                        color: tx.amount >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                      }}>
                        {tx.amount >= 0 ? '+' : ''}{fmtMoney(tx.amount)}
                      </td>
                      <td className="mono secondary" style={{ textAlign: 'right' }}>
                        {fmtMoney(tx.balance_before)}
                      </td>
                      <td className="mono secondary" style={{ textAlign: 'right' }}>
                        {fmtMoney(tx.balance_after)}
                      </td>
                      <td className="secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tx.note || '---'}
                      </td>
                      <td className="secondary" style={{ whiteSpace: 'nowrap' }}>
                        {fmtDateTime(tx.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <PaginationBar page={page} totalPages={totalPages} onPrev={onPrev} onNext={onNext} />
            )}
          </>
        )}
      </div>
    </div>
  )
}
