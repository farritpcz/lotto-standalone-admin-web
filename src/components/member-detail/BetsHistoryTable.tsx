// Component: BetsHistoryTable — bets history tab (ประวัติการแทง)
// Parent: src/app/members/[id]/page.tsx

'use client'

import Loading from '@/components/Loading'
import PaginationBar from './PaginationBar'
import { Bet, fmtMoney, fmtDateTime } from './types'

/** Bet status → badge class + label (Thai) */
const betStatusBadge: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'badge-warning', label: 'รอผล' },
  won:     { cls: 'badge-success', label: 'ชนะ' },
  lost:    { cls: 'badge-error', label: 'แพ้' },
}

interface Props {
  bets: Bet[]
  loading: boolean
  page: number
  totalPages: number
  onPrev: () => void
  onNext: () => void
}

export default function BetsHistoryTable({ bets, loading, page, totalPages, onPrev, onNext }: Props) {
  return (
    <div style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <Loading inline text="กำลังโหลดประวัติการแทง..." />
        ) : bets.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            ยังไม่มีรายการเดิมพัน
          </div>
        ) : (
          <>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>งวด</th>
                  <th>ประเภท</th>
                  <th>เลข</th>
                  <th style={{ textAlign: 'right' }}>ยอดแทง</th>
                  <th style={{ textAlign: 'right' }}>อัตราจ่าย</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th style={{ textAlign: 'right' }}>ยอดชนะ</th>
                  <th>วันที่</th>
                </tr>
              </thead>
              <tbody>
                {bets.map(bet => {
                  const badge = betStatusBadge[bet.status] || { cls: 'badge-neutral', label: bet.status }
                  return (
                    <tr key={bet.id}>
                      <td className="secondary mono">{bet.id}</td>
                      <td className="secondary">{bet.lottery_round?.round_number || '---'}</td>
                      <td>{bet.bet_type?.name || bet.bet_type?.code || '---'}</td>
                      <td className="mono" style={{ fontWeight: 600 }}>{bet.number}</td>
                      <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(bet.amount)}</td>
                      <td className="mono secondary" style={{ textAlign: 'right' }}>x{bet.rate}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`badge ${badge.cls}`}>{badge.label}</span>
                      </td>
                      <td className="mono" style={{
                        textAlign: 'right',
                        color: bet.win_amount > 0 ? 'var(--status-success)' : 'var(--text-secondary)',
                      }}>
                        {bet.win_amount > 0 ? fmtMoney(bet.win_amount) : '---'}
                      </td>
                      <td className="secondary" style={{ whiteSpace: 'nowrap' }}>
                        {fmtDateTime(bet.created_at)}
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
