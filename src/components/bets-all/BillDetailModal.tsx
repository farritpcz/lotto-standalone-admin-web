// Component: BillDetailModal — drill-down modal showing all bets in a bill
// Parent: src/app/bets/page.tsx
'use client'

import { Ticket, Ban } from 'lucide-react'
import { type BillModalData, betStatusMap, fmtMoney } from './types'

interface Props {
  bill: BillModalData
  onClose: () => void
  onRequestCancel: (activeBets: BillModalData['bets'], activeAmount: number) => void
}

export default function BillDetailModal({ bill, onClose, onRequestCancel }: Props) {
  const first = bill.bets[0]
  const username = first?.member?.username || '—'
  const roundInfo = first?.lottery_round ? `#${first.lottery_round.id}` : '—'
  const hasCancellable = bill.bets.some(b => b.status !== 'cancelled')

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }} onClick={onClose}>
      <div className="card-surface" style={{ width: '100%', maxWidth: 540, padding: 0, maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--accent-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ticket size={20} color="var(--accent)" />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)' }}>รายละเอียดบิล</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{bill.bets.length} รายการ — {username} — รอบ {roundInfo}</div>
              </div>
            </div>
            <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
          </div>
        </div>

        {/* Bet list */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '12px 20px' }}>
          <table className="admin-table" style={{ fontSize: 13 }}>
            <thead>
              <tr>
                <th>เลข</th>
                <th>ประเภท</th>
                <th style={{ textAlign: 'right' }}>จำนวน</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>รางวัล</th>
              </tr>
            </thead>
            <tbody>
              {bill.bets.map(b => {
                const st = betStatusMap[b.status] || betStatusMap.pending
                return (
                  <tr key={b.id}>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 15 }}>{b.number}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.bet_type?.name || '—'}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(b.amount)}</td>
                    <td className="mono secondary" style={{ textAlign: 'right' }}>x{b.rate}</td>
                    <td><span className={`badge ${st.cls}`} style={{ fontSize: 10 }}>{st.label}</span></td>
                    <td className="mono" style={{ textAlign: 'right', color: b.win_amount > 0 ? 'var(--status-success)' : 'var(--text-tertiary)', fontSize: 12 }}>
                      {b.win_amount > 0 ? `+${fmtMoney(b.win_amount)}` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary + Actions */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12, fontSize: 13 }}>
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>ยอดแทง: </span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtMoney(bill.totalAmount)}</span>
            </div>
            {bill.totalWin > 0 && (
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>รางวัล: </span>
                <span style={{ fontWeight: 700, color: 'var(--status-success)' }}>+{fmtMoney(bill.totalWin)}</span>
              </div>
            )}
            {(() => {
              const net = bill.totalWin - bill.totalAmount
              const hasPending = bill.bets.some(b => b.status === 'pending')
              if (hasPending) return null
              return (
                <div>
                  <span style={{ color: 'var(--text-secondary)' }}>{net > 0 ? 'เจ้ามือเสีย: ' : 'เจ้ามือได้: '}</span>
                  <span style={{ fontWeight: 700, color: net > 0 ? 'var(--status-error)' : 'var(--status-success)' }}>
                    {fmtMoney(Math.abs(net))}
                  </span>
                </div>
              )
            })()}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {hasCancellable && (
              <button onClick={() => {
                const activeBets = bill.bets.filter(b => b.status !== 'cancelled')
                const activeAmount = activeBets.reduce((s, b) => s + b.amount, 0)
                onRequestCancel(activeBets, activeAmount)
              }}
                className="btn btn-danger" style={{ flex: 1, height: 36, gap: 4 }}>
                <Ban size={14} /> ยกเลิกทั้งบิล
              </button>
            )}
            <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1, height: 36 }}>ปิด</button>
          </div>
        </div>
      </div>
    </div>
  )
}
