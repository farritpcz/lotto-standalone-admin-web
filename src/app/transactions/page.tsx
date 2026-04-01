/**
 * Admin — ธุรกรรมทั้งหมด (Transactions)
 * Linear/Vercel dark theme
 *
 * - ตาราง transactions + filter by type
 * - แสดง: type, member, amount, balance before/after, date
 */
'use client'

import { useEffect, useState } from 'react'
import { txMgmtApi } from '@/lib/api'

interface Tx {
  id: number; type: string; amount: number
  balance_before: number; balance_after: number
  created_at: string; member_id: number
}

/* Format เงิน .00 */
const fmtMoney = (n: number) => `฿${Math.abs(n).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* Type → badge */
const typeBadge: Record<string, { cls: string; label: string }> = {
  deposit:  { cls: 'badge-success', label: 'ฝาก' },
  withdraw: { cls: 'badge-error', label: 'ถอน' },
  bet:      { cls: 'badge-warning', label: 'แทง' },
  win:      { cls: 'badge-success', label: 'ชนะ' },
  refund:   { cls: 'badge-info', label: 'คืนเงิน' },
}

const filters = [
  { key: '', label: 'ทั้งหมด' },
  { key: 'deposit', label: 'ฝาก' },
  { key: 'withdraw', label: 'ถอน' },
  { key: 'bet', label: 'แทง' },
  { key: 'win', label: 'ชนะ' },
]

export default function TransactionsPage() {
  const [txns, setTxns] = useState<Tx[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    txMgmtApi.list({ page, per_page: 30, type: typeFilter || undefined, q: search || undefined })
      .then(res => { setTxns(res.data.data?.items || []); setTotal(res.data.data?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page, typeFilter, search])

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ธุรกรรมทั้งหมด</h1>
        <span className="label">{total} รายการ</span>
      </div>

      {/* Filter + Search */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {filters.map(f => (
          <button key={f.key} onClick={() => { setTypeFilter(f.key); setPage(1) }}
            className={typeFilter === f.key ? 'btn btn-primary' : 'btn btn-ghost'}
            style={{ fontSize: 12 }}>
            {f.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="ค้นหา member ID..." className="input" style={{ width: 200, height: 32 }} />
      </div>

      {/* Table */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : txns.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่มีรายการ</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ประเภท</th>
                <th>สมาชิก</th>
                <th style={{ textAlign: 'right' }}>จำนวน</th>
                <th style={{ textAlign: 'right' }}>ก่อน</th>
                <th style={{ textAlign: 'right' }}>หลัง</th>
                <th style={{ textAlign: 'right' }}>เวลา</th>
              </tr>
            </thead>
            <tbody>
              {txns.map(tx => {
                const tb = typeBadge[tx.type] || { cls: 'badge-neutral', label: tx.type }
                return (
                  <tr key={tx.id}>
                    <td className="mono secondary">#{tx.id}</td>
                    <td><span className={`badge ${tb.cls}`}>{tb.label}</span></td>
                    <td>
                      <a href={`/members/${tx.member_id}`} target="_blank" rel="noopener"
                        style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>
                        ID:{tx.member_id}
                      </a>
                    </td>
                    <td className="mono" style={{
                      textAlign: 'right', fontWeight: 600,
                      color: tx.amount >= 0 ? 'var(--status-success)' : 'var(--status-error)',
                    }}>
                      {tx.amount >= 0 ? '+' : '-'}{fmtMoney(tx.amount)}
                    </td>
                    <td className="mono secondary" style={{ textAlign: 'right', fontSize: 12 }}>
                      {fmtMoney(tx.balance_before)}
                    </td>
                    <td className="mono" style={{ textAlign: 'right', fontSize: 12 }}>
                      {fmtMoney(tx.balance_after)}
                    </td>
                    <td className="secondary" style={{ textAlign: 'right', fontSize: 12 }}>
                      {new Date(tx.created_at).toLocaleString('th-TH')}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 30 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary">← ก่อนหน้า</button>
          <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page}</span>
          <button onClick={() => setPage(p => p+1)} disabled={txns.length < 30} className="btn btn-secondary">ถัดไป →</button>
        </div>
      )}
    </div>
  )
}
