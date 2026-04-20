// Component: ResultsHistory — history list of settled rounds + detail modal
// Parent: src/app/results/page.tsx
'use client'

import Loading from '@/components/Loading'
import { type Round, type PreviewData, fmtMoney } from './types'

interface Props {
  results: Round[]
  resultPage: number
  resultTotal: number
  perPage: number
  setResultPage: (fn: (n: number) => number) => void
  onOpenDetail: (r: Round) => void

  // Detail modal
  detailRound: Round | null
  detailData: PreviewData | null
  detailLoading: boolean
  closeDetail: () => void
}

export default function ResultsHistory({
  results, resultPage, resultTotal, perPage, setResultPage, onOpenDetail,
  detailRound, detailData, detailLoading, closeDetail,
}: Props) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="label">ผลรางวัลล่าสุด</div>
      </div>
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {results.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ยังไม่มีผลรางวัล</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ประเภทหวย</th>
                <th>รอบ</th>
                <th style={{ textAlign: 'center' }}>3 ตัวบน</th>
                <th style={{ textAlign: 'center' }}>2 ตัวบน</th>
                <th style={{ textAlign: 'center' }}>2 ตัวล่าง</th>
                <th style={{ textAlign: 'center' }}>3 ตัวหน้า</th>
                <th style={{ textAlign: 'center' }}>3 ตัวล่าง</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} onClick={() => onOpenDetail(r)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>
                    {r.lottery_type?.icon ? `${r.lottery_type.icon} ` : ''}{r.lottery_type?.name}
                  </td>
                  <td className="mono secondary" style={{ fontSize: 12 }}>{r.round_number}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#f5a623', fontWeight: 700, fontSize: 18 }}>{r.result_top3}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#00e5a0', fontWeight: 700, fontSize: 18 }}>{r.result_top2}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 700, fontSize: 18 }}>{r.result_bottom2}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#ec4899', fontWeight: 700, fontSize: 16 }}>{r.result_front3 || '—'}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#a855f7', fontWeight: 700, fontSize: 16 }}>{r.result_bottom3 || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {resultTotal > perPage && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setResultPage(p => Math.max(1, p - 1))} disabled={resultPage === 1} className="btn btn-ghost">ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {resultPage}/{Math.ceil(resultTotal / perPage)}</span>
            <button onClick={() => setResultPage(p => p + 1)} disabled={results.length < perPage} className="btn btn-ghost">ถัดไป</button>
          </div>
        )}
      </div>

      {/* MODAL: รายละเอียดผลรางวัล */}
      {detailRound && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={closeDetail}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{detailRound.lottery_type?.icon} {detailRound.lottery_type?.name} — {detailRound.round_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>รายละเอียดผลรางวัล</div>
              </div>
              <button onClick={closeDetail} className="btn btn-ghost" style={{ fontSize: 18 }}>✕</button>
            </div>

            <div style={{ padding: '20px', display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '3 ตัวบน', value: detailRound.result_top3, color: '#f5a623' },
                { label: '2 ตัวบน', value: detailRound.result_top2, color: '#00e5a0' },
                { label: '2 ตัวล่าง', value: detailRound.result_bottom2, color: '#3b82f6' },
                ...(detailRound.result_front3 ? [{ label: '3 ตัวหน้า', value: detailRound.result_front3, color: '#ec4899' }] : []),
                ...(detailRound.result_bottom3 ? [{ label: '3 ตัวล่าง', value: detailRound.result_bottom3, color: '#a855f7' }] : []),
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'center' }}>
                  <div className="label" style={{ marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 32, fontWeight: 800, color: r.color }}>{r.value || '—'}</div>
                </div>
              ))}
            </div>

            {detailLoading ? <Loading inline text="กำลังโหลด..." /> : detailData ? (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 20px 16px' }}>
                  {[
                    { label: 'Bets', value: detailData.total_bets, color: 'var(--text-primary)' },
                    { label: 'ยอดแทง', value: fmtMoney(detailData.total_amount), color: '#a855f7' },
                    { label: 'จ่ายรางวัล', value: fmtMoney(detailData.total_payout), color: '#ef4444' },
                    { label: 'กำไร', value: `${detailData.profit >= 0 ? '+' : ''}${fmtMoney(detailData.profit)}`, color: detailData.profit >= 0 ? '#00e5a0' : '#ef4444' },
                  ].map(s => (
                    <div key={s.label} style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                      <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 16, fontWeight: 700, color: s.color }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {detailData.winners && detailData.winners.length > 0 ? (
                  <div style={{ padding: '0 20px 20px' }}>
                    <div className="label" style={{ marginBottom: 8 }}>ผู้ถูกรางวัล ({detailData.winner_count} รายการ)</div>
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <table className="admin-table">
                        <thead><tr><th>สมาชิก</th><th>เลข</th><th>ประเภท</th><th style={{ textAlign: 'right' }}>เดิมพัน</th><th style={{ textAlign: 'right' }}>Rate</th><th style={{ textAlign: 'right' }}>จ่าย</th></tr></thead>
                        <tbody>
                          {detailData.winners.map((w, i) => (
                            <tr key={i}>
                              <td>{w.username || `ID:${w.member_id}`}</td>
                              <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{w.number}</td>
                              <td className="secondary" style={{ fontSize: 12 }}>{w.bet_type}</td>
                              <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(w.amount)}</td>
                              <td className="mono secondary" style={{ textAlign: 'right' }}>x{w.rate}</td>
                              <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>{fmtMoney(w.payout)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px 20px', color: 'var(--text-tertiary)', textAlign: 'center' }}>ไม่มีใครถูกรางวัล</div>
                )}
              </>
            ) : (
              <div style={{ padding: 20, color: 'var(--text-tertiary)', textAlign: 'center' }}>ไม่สามารถโหลดรายละเอียดได้</div>
            )}

            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={closeDetail} className="btn btn-secondary" style={{ width: '100%' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
