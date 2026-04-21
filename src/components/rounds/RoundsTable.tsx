// ตารางรอบหวย + action buttons
// Parent: src/app/rounds/page.tsx

'use client'

import { Play, Square, XCircle } from 'lucide-react'
import Loading from '@/components/Loading'
import { STATUS_CONFIG, fmtTime, fmtDateOnly, relativeTime, type Round } from './types'

interface Props {
  rounds: Round[]
  loading: boolean
  page: number
  totalPages: number
  onChangePage: (p: number) => void
  onChangeStatus: (id: number, newStatus: string) => void
  onVoidRound: (id: number) => void
}

export default function RoundsTable({
  rounds, loading, page, totalPages,
  onChangePage, onChangeStatus, onVoidRound,
}: Props) {
  return (
    <div className="card-surface" style={{ overflow: 'hidden' }}>
      {loading ? <Loading inline text="กำลังโหลด..." /> : rounds.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่พบรอบหวย</div>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>ID</th>
              <th>ประเภทหวย</th>
              <th>เลขรอบ</th>
              <th>วันที่</th>
              <th>เวลา</th>
              <th>สถานะ</th>
              <th style={{ textAlign: 'right', width: 160 }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rounds.map(r => {
              const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.upcoming
              return (
                <tr key={r.id} style={{ background: sc.bg }}>
                  <td className="mono secondary">#{r.id}</td>
                  <td>
                    <span style={{ fontWeight: 500 }}>
                      {r.lottery_type?.icon ? `${r.lottery_type.icon} ` : ''}{r.lottery_type?.name || '-'}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 12 }}>{r.round_number}</td>
                  <td className="secondary" style={{ fontSize: 12 }}>{fmtDateOnly(r.round_date)}</td>
                  {/* เวลาเปิด-ปิด + relative */}
                  <td style={{ fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(r.open_time)}</span>
                    <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>-</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(r.close_time)}</span>
                    {r.status === 'upcoming' && (
                      <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{relativeTime(r.open_time)}</div>
                    )}
                    {r.status === 'open' && (
                      <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>ปิด{relativeTime(r.close_time)}</div>
                    )}
                  </td>
                  <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                  {/* Actions — compact */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {r.status === 'upcoming' && (
                        <button className="btn btn-success" style={{ fontSize: 11, height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => onChangeStatus(r.id, 'open')}>
                          <Play size={12} /> เปิด
                        </button>
                      )}
                      {r.status === 'open' && (
                        <button className="btn btn-secondary" style={{ fontSize: 11, height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => onChangeStatus(r.id, 'closed')}>
                          <Square size={12} /> ปิด
                        </button>
                      )}
                      {['open', 'closed', 'resulted'].includes(r.status) && (
                        <button className="btn btn-ghost" style={{ fontSize: 11, height: 26, padding: '0 8px', color: 'var(--status-error)' }}
                          onClick={() => onVoidRound(r.id)} title="ยกเลิกรอบ">
                          <XCircle size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={() => onChangePage(Math.max(1, page - 1))} disabled={page === 1}>ก่อนหน้า</button>
          <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page}/{totalPages}</span>
          <button className="btn btn-ghost" onClick={() => onChangePage(Math.min(totalPages, page + 1))} disabled={page >= totalPages}>ถัดไป</button>
        </div>
      )}
    </div>
  )
}
