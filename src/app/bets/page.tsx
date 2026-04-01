/**
 * Admin — รายการเดิมพัน (All Bets)
 * Linear/Vercel dark theme
 *
 * - ตาราง bets ทั้งหมด + filter by status
 * - Pagination
 * - ใช้ design system: admin-table, badge, btn
 */
'use client'

import { useEffect, useState } from 'react'
import { betMgmtApi } from '@/lib/api'

/* Bet interface */
interface Bet {
  id: number; member_id?: number; number: string; amount: number; rate: number
  status: string; win_amount: number; created_at: string
  member?: { id?: number; username: string }
  bet_type?: { name: string; code: string }
  lottery_round?: { id: number; round_number: string }
}

/* Format เงิน .00 */
const fmtMoney = (n: number) => `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* Status → badge class mapping */
const statusBadge: Record<string, { cls: string; label: string }> = {
  pending: { cls: 'badge-warning', label: 'รอผล' },
  won:     { cls: 'badge-success', label: 'ชนะ' },
  lost:    { cls: 'badge-error', label: 'แพ้' },
}

/* Filter tabs */
const filters = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอผล' },
  { key: 'won', label: 'ชนะ' },
  { key: 'lost', label: 'แพ้' },
]

export default function BetsPage() {
  const [bets, setBets] = useState<Bet[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    betMgmtApi.list({ page, per_page: 30, status: status || undefined, q: search || undefined })
      .then(res => { setBets(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, status, search])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>รายการเดิมพัน</h1>
        <span className="label">{total} รายการ</span>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => { setStatus(f.key); setPage(1) }}
            className={status === f.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12 }}>
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="ค้นหา username / เลข..." className="input" style={{ width: 200, height: 32 }} />
      </div>

      {/* Table */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : bets.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่มีรายการ</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>สมาชิก</th>
                <th>เลข</th>
                <th>ประเภท</th>
                <th>รอบ</th>
                <th style={{ textAlign: 'right' }}>จำนวน</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>รางวัล</th>
                <th style={{ textAlign: 'right' }}>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {bets.map(b => {
                const st = statusBadge[b.status] || statusBadge.pending
                return (
                  <tr key={b.id}>
                    <td>
                      <a href={`/members/${b.member?.id || b.member_id}`} target="_blank" rel="noopener"
                        style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        {b.member?.username || '—'}
                      </a>
                    </td>
                    <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{b.number}</td>
                    <td className="secondary" style={{ fontSize: 12 }}>{b.bet_type?.name}</td>
                    <td className="secondary mono" style={{ fontSize: 12 }}>#{b.lottery_round?.id} {b.lottery_round?.round_number}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{fmtMoney(b.amount)}</td>
                    <td className="mono secondary" style={{ textAlign: 'right' }}>x{b.rate}</td>
                    <td><span className={`badge ${st.cls}`}>{st.label}</span></td>
                    <td className="mono" style={{ textAlign: 'right', color: b.win_amount > 0 ? 'var(--status-success)' : 'var(--text-tertiary)' }}>
                      {b.win_amount > 0 ? `+${fmtMoney(b.win_amount)}` : '—'}
                    </td>
                    <td className="secondary" style={{ textAlign: 'right', fontSize: 12 }}>
                      {new Date(b.created_at).toLocaleString('th-TH')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 30 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary">← ก่อนหน้า</button>
          <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={bets.length < 30} className="btn btn-secondary">ถัดไป →</button>
        </div>
      )}
    </div>
  )
}
