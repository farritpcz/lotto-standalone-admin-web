/**
 * Admin — กรอกผลรางวัล (2-step: Preview → Confirm)
 *
 * Flow:
 *  1. เลือกรอบ (closed) → กรอก 3ตัวบน + 2ตัวล่าง
 *  2. กด "ดูตัวอย่างผล" → เรียก preview API → แสดงใครจะถูก จ่ายเท่าไร
 *  3. กด "ยืนยันกรอกผล" → เรียก submit API → settle bets + credit + commission
 *
 * ⭐ หน้าที่สำคัญที่สุดของ admin — กรอกผล → trigger payout + commission
 */
'use client'

import { useEffect, useState } from 'react'
import { resultMgmtApi, roundMgmtApi } from '@/lib/api'

// ── Types ──────────────────────────────────────────────────────────────────────
interface Round {
  id: number; lottery_type?: { name: string }; round_number: string
  round_date: string; status: string
  result_top3?: string; result_top2?: string; result_bottom2?: string
}

interface Winner {
  bet_id: number; member_id: number; username: string
  number: string; bet_type: string
  amount: number; rate: number; payout: number
}

interface PreviewData {
  round_number: string
  total_bets: number; total_amount: number
  winners: Winner[]; winner_count: number
  total_payout: number; profit: number
}

// ── Pagination ─────────────────────────────────────────────────────────────────
const PER_PAGE = 20

// ── Component ──────────────────────────────────────────────────────────────────
export default function ResultsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [top3, setTop3] = useState('')
  const [bottom2, setBottom2] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Round[]>([])
  const [resultPage, setResultPage] = useState(1)
  const [resultTotal, setResultTotal] = useState(0)

  // ── Preview state (สำหรับ form กรอกผล) ──────────────────────────────────────
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  // ── Result detail modal (คลิกดูรายละเอียดผลที่กรอกไปแล้ว) ────────────────
  const [detailRound, setDetailRound] = useState<Round | null>(null)
  const [detailData, setDetailData] = useState<PreviewData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Fetch data ───────────────────────────────────────────────────────────────
  const fetchRounds = () => {
    roundMgmtApi.list({ status: 'closed', per_page: 50 })
      .then(res => setRounds(res.data.data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const fetchResults = () => {
    resultMgmtApi.list({ page: resultPage, per_page: PER_PAGE })
      .then(res => {
        setResults(res.data.data?.items || [])
        setResultTotal(res.data.data?.total || 0)
      })
      .catch(() => {})
  }

  // ── ดูรายละเอียดรอบที่ออกผลไปแล้ว ──────────────────────────────────────────
  const openResultDetail = async (round: Round) => {
    if (!round.result_top3) return
    setDetailRound(round)
    setDetailLoading(true)
    try {
      // ใช้ preview API กับ bets ที่ settled แล้ว — API จะดึง won/lost bets
      const res = await resultMgmtApi.preview(round.id, {
        top3: round.result_top3,
        top2: round.result_top2 || round.result_top3.slice(-2),
        bottom2: round.result_bottom2 || '',
      })
      setDetailData(res.data.data)
    } catch {
      // ถ้า preview ไม่ได้ (bets settled แล้ว) → ดึง bets ที่ won
      setDetailData(null)
    } finally { setDetailLoading(false) }
  }

  useEffect(() => { fetchRounds() }, [])
  useEffect(() => { fetchResults() }, [resultPage])

  // ── Step 1: Preview — ดูตัวอย่างก่อนกรอกผลจริง ──────────────────────────────
  const handlePreview = async () => {
    if (!selectedRound || top3.length !== 3 || bottom2.length !== 2) {
      setMessage('กรุณากรอก 3 ตัวบน (3 หลัก) และ 2 ตัวล่าง (2 หลัก)'); return
    }
    setPreviewing(true); setMessage('')
    try {
      const top2 = top3.slice(-2)
      const res = await resultMgmtApi.preview(selectedRound.id, { top3, top2, bottom2 })
      setPreview(res.data.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setPreviewing(false) }
  }

  // ── Step 2: Confirm — กรอกผลจริง + settle + payout + commission ──────────────
  const handleConfirm = async () => {
    if (!selectedRound) return
    setSubmitting(true); setMessage('')
    try {
      const top2 = top3.slice(-2)
      const res = await resultMgmtApi.submit(selectedRound.id, { top3, top2, bottom2 })
      const data = res.data.data
      setMessage(`กรอกผลสำเร็จ! ถูก ${data?.settled || 0} รายการ, จ่าย ฿${(data?.total_win || 0).toLocaleString()}`)
      setPreview(null); setSelectedRound(null); setTop3(''); setBottom2('')
      fetchRounds(); fetchResults()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setSubmitting(false) }
  }

  const isSuccess = message && message.includes('สำเร็จ')

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <h1>กรอกผลรางวัล</h1>
      </div>

      {/* ── Message ────────────────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: isSuccess ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: isSuccess ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {isSuccess ? '✓ ' : '✕ '}{message}
        </div>
      )}

      {/* ── Form กรอกผล ────────────────────────────────────────────────────── */}
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
              onChange={e => { setSelectedRound(rounds.find(r => r.id === Number(e.target.value)) || null); setPreview(null) }}
              className="input" style={{ marginBottom: 16, height: 40 }}
            >
              <option value="">เลือกรอบ...</option>
              {rounds.map(r => (
                <option key={r.id} value={r.id}>{r.lottery_type?.name} — #{r.id} {r.round_number}</option>
              ))}
            </select>

            {/* กรอกเลข */}
            {selectedRound && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>3 ตัวบน</div>
                    <input type="text" value={top3}
                      onChange={e => { setTop3(e.target.value.replace(/\D/g, '').slice(0, 3)); setPreview(null) }}
                      placeholder="847" maxLength={3} className="input"
                      style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', height: 56, color: '#f5a623' }}
                    />
                  </div>
                  <div>
                    <div className="label" style={{ marginBottom: 6 }}>2 ตัวล่าง</div>
                    <input type="text" value={bottom2}
                      onChange={e => { setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2)); setPreview(null) }}
                      placeholder="56" maxLength={2} className="input"
                      style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, fontFamily: 'var(--font-mono)', height: 56, color: '#3b82f6' }}
                    />
                  </div>
                </div>

                {/* Preview ตัวเลข */}
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

                {/* ปุ่ม preview (step 1) */}
                {!preview && (
                  <button onClick={handlePreview} disabled={previewing || top3.length !== 3 || bottom2.length !== 2}
                    className="btn btn-secondary" style={{ width: '100%', height: 44, fontSize: 15 }}>
                    {previewing ? 'กำลังคำนวณ...' : '🔍 ดูตัวอย่างผลก่อนยืนยัน'}
                  </button>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
       * PREVIEW RESULTS — แสดงว่าใครจะถูก จ่ายเท่าไร
       * ════════════════════════════════════════════════════════════════════ */}
      {preview && (
        <div className="card-surface" style={{ padding: 20, marginBottom: 24, borderColor: 'rgba(0,229,160,0.3)' }}>
          <div className="label" style={{ marginBottom: 16, color: 'var(--accent)' }}>
            ตัวอย่างผล #{selectedRound?.id} {preview.round_number}
          </div>

          {/* สรุปยอด — 5 cards รวมค่าคอม */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
            <div className="stat-card">
              <div className="label" style={{ marginBottom: 4 }}>Bets ทั้งหมด</div>
              <div className="metric" style={{ fontSize: 20, color: 'var(--text-primary)' }}>{preview.total_bets}</div>
            </div>
            <div className="stat-card">
              <div className="label" style={{ marginBottom: 4 }}>ยอดแทงรวม</div>
              <div className="metric" style={{ fontSize: 20, color: '#a855f7' }}>฿{preview.total_amount.toLocaleString()}</div>
            </div>
            <div className="stat-card">
              <div className="label" style={{ marginBottom: 4 }}>ต้องจ่าย</div>
              <div className="metric" style={{ fontSize: 20, color: '#ef4444' }}>฿{preview.total_payout.toLocaleString()}</div>
            </div>
            <div className="stat-card" style={{ borderColor: preview.profit >= 0 ? 'rgba(0,229,160,0.3)' : 'rgba(239,68,68,0.3)' }}>
              <div className="label" style={{ marginBottom: 4 }}>กำไร/ขาดทุน</div>
              <div className="metric" style={{ fontSize: 20, color: preview.profit >= 0 ? '#00e5a0' : '#ef4444' }}>
                {preview.profit >= 0 ? '+' : ''}฿{preview.profit.toLocaleString()}
              </div>
            </div>
            {/* ค่าคอมมิชชั่น affiliate (ประมาณ 0.5% ของยอดแทง) */}
            <div className="stat-card" style={{ borderColor: 'rgba(168,85,247,0.2)' }}>
              <div className="label" style={{ marginBottom: 4 }}>ค่าคอม Affiliate</div>
              <div className="metric" style={{ fontSize: 20, color: '#a855f7' }}>
                ~฿{(preview.total_amount * 0.005).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>ประมาณ 0.5% ของยอดแทง</div>
            </div>
          </div>

          {/* ตารางคนถูกรางวัล */}
          {preview.winners && preview.winners.length > 0 ? (
            <>
              <div className="label" style={{ marginBottom: 8 }}>
                ผู้ถูกรางวัล ({preview.winner_count} รายการ)
              </div>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>สมาชิก</th>
                      <th>เลข</th>
                      <th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>เดิมพัน</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>จ่าย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.winners.map((w, i) => (
                      <tr key={i}>
                        <td>{w.username || `ID:${w.member_id}`}</td>
                        <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{w.number}</td>
                        <td className="secondary" style={{ fontSize: 12 }}>{w.bet_type}</td>
                        <td className="mono" style={{ textAlign: 'right' }}>฿{w.amount.toLocaleString()}</td>
                        <td className="mono secondary" style={{ textAlign: 'right' }}>x{w.rate}</td>
                        <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>
                          ฿{w.payout.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div style={{ padding: '16px 0', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20 }}>
              ไม่มีใครถูกรางวัล — กำไรเต็มจำนวน ฿{preview.total_amount.toLocaleString()}
            </div>
          )}

          {/* ปุ่มยืนยัน + ยกเลิก */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPreview(null)} className="btn btn-secondary" style={{ flex: 1, height: 44, fontSize: 15 }}>
              ← แก้ไขผล
            </button>
            <button onClick={handleConfirm} disabled={submitting}
              className="btn btn-primary" style={{ flex: 2, height: 44, fontSize: 15 }}>
              {submitting ? 'กำลังกรอกผล + จ่ายเงิน + คำนวณคอมฯ...' : `✓ ยืนยันกรอกผล (จ่าย ฿${preview.total_payout.toLocaleString()})`}
            </button>
          </div>
        </div>
      )}

      {/* ── ผลล่าสุด ────────────────────────────────────────────────────── */}
      <div className="label" style={{ marginBottom: 12 }}>ผลรางวัลล่าสุด</div>
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {results.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ยังไม่มีผลรางวัล</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ประเภทหวย</th>
                <th>รอบ</th>
                <th style={{ textAlign: 'center' }}>3 ตัวบน</th>
                <th style={{ textAlign: 'center' }}>2 ตัวบน</th>
                <th style={{ textAlign: 'center' }}>2 ตัวล่าง</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id} onClick={() => openResultDetail(r)} style={{ cursor: 'pointer' }}>
                  <td className="mono secondary">#{r.id}</td>
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

        {resultTotal > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, paddingBottom: 16 }}>
            <button onClick={() => setResultPage(p => Math.max(1, p-1))} disabled={resultPage === 1} className="btn btn-secondary">← ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {resultPage} / {Math.ceil(resultTotal / PER_PAGE)}</span>
            <button onClick={() => setResultPage(p => p+1)} disabled={results.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
       * MODAL: รายละเอียดผลรางวัล — คลิกจากตาราง "ผลรางวัลล่าสุด"
       * แสดง: ผลที่ออก, ใครถูกบ้าง, จ่ายเท่าไร, กำไร/ขาดทุน
       * ════════════════════════════════════════════════════════════════════ */}
      {detailRound && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}>

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {detailRound.lottery_type?.name} — รอบ {detailRound.round_number}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>รายละเอียดผลรางวัล</div>
              </div>
              <button onClick={() => { setDetailRound(null); setDetailData(null) }} className="btn btn-ghost" style={{ fontSize: 18 }}>✕</button>
            </div>

            {/* ผลที่ออก */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 16, justifyContent: 'center' }}>
              {[
                { label: '3 ตัวบน', value: detailRound.result_top3, color: '#f5a623' },
                { label: '2 ตัวบน', value: detailRound.result_top2, color: '#00e5a0' },
                { label: '2 ตัวล่าง', value: detailRound.result_bottom2, color: '#3b82f6' },
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'center' }}>
                  <div className="label" style={{ marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 800, color: r.color }}>{r.value || '—'}</div>
                </div>
              ))}
            </div>

            {detailLoading ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>กำลังโหลด...</div>
            ) : detailData ? (
              <>
                {/* สรุป */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, padding: '0 20px 16px' }}>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>Bets</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700 }}>{detailData.total_bets}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>ยอดแทง</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#a855f7' }}>฿{detailData.total_amount.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>จ่ายรางวัล</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: '#ef4444' }}>฿{detailData.total_payout.toLocaleString()}</div>
                  </div>
                  <div style={{ background: 'var(--bg-elevated)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div className="label" style={{ fontSize: 10, marginBottom: 2 }}>กำไร</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: detailData.profit >= 0 ? '#00e5a0' : '#ef4444' }}>
                      {detailData.profit >= 0 ? '+' : ''}฿{detailData.profit.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* ตารางคนถูกรางวัล */}
                {detailData.winners && detailData.winners.length > 0 ? (
                  <div style={{ padding: '0 20px 20px' }}>
                    <div className="label" style={{ marginBottom: 8 }}>ผู้ถูกรางวัล ({detailData.winner_count} รายการ)</div>
                    <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>สมาชิก</th>
                            <th>เลข</th>
                            <th>ประเภท</th>
                            <th style={{ textAlign: 'right' }}>เดิมพัน</th>
                            <th style={{ textAlign: 'right' }}>Rate</th>
                            <th style={{ textAlign: 'right' }}>จ่าย</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailData.winners.map((w, i) => (
                            <tr key={i}>
                              <td>{w.username || `ID:${w.member_id}`}</td>
                              <td className="mono" style={{ fontWeight: 700, color: 'var(--accent)' }}>{w.number}</td>
                              <td className="secondary" style={{ fontSize: 12 }}>{w.bet_type}</td>
                              <td className="mono" style={{ textAlign: 'right' }}>฿{w.amount.toLocaleString()}</td>
                              <td className="mono secondary" style={{ textAlign: 'right' }}>x{w.rate}</td>
                              <td className="mono" style={{ textAlign: 'right', fontWeight: 700, color: '#ef4444' }}>฿{w.payout.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: '16px 20px 20px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                    ไม่มีใครถูกรางวัลในรอบนี้
                  </div>
                )}
              </>
            ) : (
              <div style={{ padding: '20px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
                ไม่สามารถโหลดรายละเอียดได้
              </div>
            )}

            {/* Footer */}
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setDetailRound(null); setDetailData(null) }} className="btn btn-secondary" style={{ width: '100%' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
