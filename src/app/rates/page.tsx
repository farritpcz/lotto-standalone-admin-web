/**
 * Admin — จัดการอัตราจ่าย (Pay Rates)
 * Linear/Vercel dark theme
 *
 * - ตารางแสดง rate ทั้งหมด (group by lottery type)
 * - Inline edit rate + max bet per number
 * - ใช้ design system classes: admin-table, btn, input
 */
'use client'

import { useEffect, useState } from 'react'
import { rateMgmtApi } from '@/lib/api'

/* Rate interface */
interface Rate {
  id: number
  rate: number
  max_bet_per_number: number
  bet_type?: { name: string; code: string }
  lottery_type?: { name: string }
}

/* จำนวนรายการต่อหน้า (pagination) */
const PER_PAGE = 20

export default function RatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<number | null>(null) // track ว่ากำลัง save rate ไหน

  /* state สำหรับ pagination — หน้าปัจจุบัน + จำนวนรายการทั้งหมด */
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  /* โหลดข้อมูล — ส่ง page + per_page ไปให้ API */
  useEffect(() => {
    setLoading(true)
    rateMgmtApi.list({ page, per_page: PER_PAGE })
      .then(res => {
        const data = res.data.data
        if (Array.isArray(data)) {
          setRates(data)
          setTotal(data.length)
        } else {
          setRates(data?.items || [])
          setTotal(data?.total || 0)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [page])

  /* อัพเดท rate (inline edit) */
  const updateRate = async (id: number, field: string, value: number) => {
    setSaving(id)
    try {
      await rateMgmtApi.update(id, { [field]: value })
      setRates(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r))
    } catch { /* ignore */ }
    finally { setSaving(null) }
  }

  return (
    <div className="page-container">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>จัดการอัตราจ่าย</h1>
        <span className="label">{rates.length} รายการ</span>
      </div>

      {/* ── Table ────────────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ประเภทหวย</th>
                <th>ประเภทแทง</th>
                <th>Code</th>
                <th style={{ textAlign: 'right' }}>อัตราจ่าย (x)</th>
                <th style={{ textAlign: 'right' }}>Max/เลข (฿)</th>
              </tr>
            </thead>
            <tbody>
              {rates.map(r => (
                <tr key={r.id} style={{ opacity: saving === r.id ? 0.6 : 1 }}>
                  {/* ประเภทหวย */}
                  <td>{r.lottery_type?.name || '—'}</td>

                  {/* ประเภทแทง */}
                  <td>{r.bet_type?.name || '—'}</td>

                  {/* Code */}
                  <td className="mono secondary" style={{ fontSize: 12 }}>
                    {r.bet_type?.code || '—'}
                  </td>

                  {/* Rate — inline editable */}
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      value={r.rate}
                      onChange={e => setRates(prev => prev.map(x => x.id === r.id ? { ...x, rate: Number(e.target.value) } : x))}
                      onBlur={e => updateRate(r.id, 'rate', Number(e.target.value))}
                      className="input"
                      style={{
                        width: 100, textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    />
                  </td>

                  {/* Max bet per number — inline editable */}
                  <td style={{ textAlign: 'right' }}>
                    <input
                      type="number"
                      value={r.max_bet_per_number}
                      onChange={e => setRates(prev => prev.map(x => x.id === r.id ? { ...x, max_bet_per_number: Number(e.target.value) } : x))}
                      onBlur={e => updateRate(r.id, 'max_bet_per_number', Number(e.target.value))}
                      className="input"
                      style={{
                        width: 100, textAlign: 'right',
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                      }}
                      placeholder="0 = ไม่จำกัด"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* ── Pagination — แบ่งหน้าแสดงผล ──────────────────────────────── */}
        {total > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary">← ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page} / {Math.ceil(total / PER_PAGE)}</span>
            <button onClick={() => setPage(p => p+1)} disabled={rates.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>
    </div>
  )
}
