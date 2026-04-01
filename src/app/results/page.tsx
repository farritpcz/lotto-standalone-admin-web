/**
 * Admin — กรอกผลรางวัล
 * ⭐ หน้าที่สำคัญที่สุด — กรอกผล → trigger payout + commission
 * Linear/Vercel dark theme
 *
 * - เลือกรอบ (closed) → กรอก 3ตัวบน + 2ตัวล่าง
 * - Submit → settle bets + credit winners + commission job
 * - แสดงผลล่าสุดด้านล่าง
 */
'use client'

import { useEffect, useState } from 'react'
import { resultMgmtApi, roundMgmtApi } from '@/lib/api'

interface Round {
  id: number; lottery_type?: { name: string }; round_number: string
  round_date: string; status: string
  result_top3?: string; result_top2?: string; result_bottom2?: string
}

export default function ResultsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [top3, setTop3] = useState('')
  const [bottom2, setBottom2] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Round[]>([])

  /* โหลดรอบที่รอกรอกผล (closed) */
  const fetchRounds = () => {
    roundMgmtApi.list({ status: 'closed', per_page: 50 })
      .then(res => setRounds(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  /* โหลดผลล่าสุด */
  const fetchResults = () => {
    resultMgmtApi.list({ per_page: 20 })
      .then(res => setResults(res.data.data?.items || []))
      .catch(() => {})
  }

  useEffect(() => { fetchRounds(); fetchResults() }, [])

  /* กรอกผล */
  const handleSubmit = async () => {
    if (!selectedRound || top3.length !== 3 || bottom2.length !== 2) {
      setMessage('กรุณากรอก 3 ตัวบน (3 หลัก) และ 2 ตัวล่าง (2 หลัก)'); return
    }
    setSubmitting(true); setMessage('')

    try {
      const top2 = top3.slice(-2) // 2 ตัวท้ายของ 3 ตัวบน
      const res = await resultMgmtApi.submit(selectedRound.id, { top3, top2, bottom2 })
      const data = res.data.data
      setMessage(`กรอกผลสำเร็จ! ถูก ${data?.settled || 0} รายการ, จ่าย ฿${(data?.total_win || 0).toLocaleString()}`)
      setSelectedRound(null); setTop3(''); setBottom2('')
      fetchRounds(); fetchResults()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setSubmitting(false) }
  }

  const isSuccess = message && message.includes('สำเร็จ')

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>กรอกผลรางวัล</h1>
      </div>

      {/* ── Message ──────────────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: isSuccess ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: isSuccess ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {isSuccess ? '✓ ' : '✕ '}{message}
        </div>
      )}

      {/* ── Form กรอกผล ──────────────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 24 }}>
        <div className="label" style={{ marginBottom: 12 }}>เลือกรอบ + กรอกผล</div>

        {loading ? (
          <div style={{ color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
        ) : rounds.length === 0 ? (
          <div style={{ color: 'var(--text-tertiary)' }}>ไม่มีรอบที่รอกรอกผล (ต้องปิดรับก่อน)</div>
        ) : (
          <>
            {/* เลือกรอบ */}
            <select
              value={selectedRound?.id || ''}
              onChange={e => setSelectedRound(rounds.find(r => r.id === Number(e.target.value)) || null)}
              className="input"
              style={{ marginBottom: 16, height: 40 }}
            >
              <option value="">เลือกรอบ...</option>
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.lottery_type?.name} — รอบ {r.round_number}</option>
              ))}
            </select>

            {/* กรอกเลข */}
            {selectedRound && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>3 ตัวบน</div>
                    <input
                      type="text" value={top3}
                      onChange={e => setTop3(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="847" maxLength={3}
                      className="input"
                      style={{
                        textAlign: 'center', fontSize: 28, fontWeight: 700,
                        fontFamily: 'var(--font-mono)', height: 56,
                        color: '#f5a623',
                      }}
                    />
                  </div>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>2 ตัวล่าง</div>
                    <input
                      type="text" value={bottom2}
                      onChange={e => setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2))}
                      placeholder="56" maxLength={2}
                      className="input"
                      style={{
                        textAlign: 'center', fontSize: 28, fontWeight: 700,
                        fontFamily: 'var(--font-mono)', height: 56,
                        color: '#3b82f6',
                      }}
                    />
                  </div>
                </div>

                {/* Preview */}
                {top3.length === 3 && (
                  <div style={{
                    background: 'var(--bg-elevated)', borderRadius: 8,
                    padding: '12px 16px', marginBottom: 16, fontSize: 13,
                    display: 'flex', gap: 20,
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>3 ตัวบน: <span style={{ color: '#f5a623', fontWeight: 700 }}>{top3}</span></span>
                    <span style={{ color: 'var(--text-secondary)' }}>2 ตัวบน: <span style={{ color: '#00e5a0', fontWeight: 700 }}>{top3.slice(-2)}</span></span>
                    <span style={{ color: 'var(--text-secondary)' }}>2 ตัวล่าง: <span style={{ color: '#3b82f6', fontWeight: 700 }}>{bottom2 || '??'}</span></span>
                  </div>
                )}

                <button onClick={handleSubmit} disabled={submitting}
                  className="btn btn-primary" style={{ width: '100%', height: 44, fontSize: 15 }}>
                  {submitting ? 'กำลังกรอกผล + คำนวณรางวัล...' : 'ยืนยันกรอกผล'}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* ── ผลล่าสุด ────────────────────────────────────────────────────── */}
      <div className="label" style={{ marginBottom: 12 }}>ผลรางวัลล่าสุด</div>
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
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td>{r.lottery_type?.name}</td>
                  <td className="mono secondary">{r.round_number}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#f5a623', fontWeight: 700, fontSize: 16 }}>{r.result_top3}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#00e5a0', fontWeight: 700, fontSize: 16 }}>{r.result_top2}</td>
                  <td className="mono" style={{ textAlign: 'center', color: '#3b82f6', fontWeight: 700, fontSize: 16 }}>{r.result_bottom2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
