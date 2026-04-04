/**
 * =============================================================================
 * Admin — กรอกผลรางวัล — "Lottery Result Studio"
 * =============================================================================
 *
 * ⭐ Redesign: Premium UI สำหรับหน้าที่สำคัญที่สุดของ admin
 *
 * Flow:
 *   1. เลือกรอบจาก card list (ไม่ใช่ dropdown)
 *   2. กรอกเลข — hero input 3 ตัวบน + 2 ตัวล่าง
 *   3. Preview — ดูว่าใครถูก จ่ายเท่าไร กำไร/ขาดทุน
 *   4. Confirm — กรอกผลจริง + settle + payout + commission
 *
 * API: resultMgmtApi.preview(), .submit(), .list()
 *      roundMgmtApi.list()
 * =============================================================================
 */
'use client'

import { useEffect, useState } from 'react'
import { resultMgmtApi, roundMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import { ChevronDown, ChevronRight, Trophy, TrendingUp, Users, DollarSign } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface Round {
  id: number; lottery_type?: { name: string; code?: string; icon?: string; category?: string }
  round_number: string; round_date: string; status: string
  result_top3?: string; result_top2?: string; result_bottom2?: string
  result_front3?: string; result_bottom3?: string
}

interface Winner {
  bet_id: number; member_id: number; username: string
  number: string; bet_type: string
  amount: number; rate: number; payout: number
}

interface PreviewData {
  round_number: string; total_bets: number; total_amount: number
  winners: Winner[]; winner_count: number
  total_payout: number; profit: number
}

const PER_PAGE = 15

// =============================================================================
// Component
// =============================================================================

export default function ResultsPage() {
  // ── State ─────────────────────────────────────────────────────
  const [rounds, setRounds] = useState<Round[]>([])
  const [selectedRound, setSelectedRound] = useState<Round | null>(null)
  const [top3, setTop3] = useState('')
  const [bottom2, setBottom2] = useState('')
  const [front3, setFront3] = useState('')
  const [bottom3, setBottom3] = useState('')
  const [showExtra, setShowExtra] = useState(false) // collapsible ผลเพิ่มเติม
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<Round[]>([])
  const [resultPage, setResultPage] = useState(1)
  const [resultTotal, setResultTotal] = useState(0)
  const [previewing, setPreviewing] = useState(false)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [detailRound, setDetailRound] = useState<Round | null>(null)
  const [detailData, setDetailData] = useState<PreviewData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // ── Fetch ─────────────────────────────────────────────────────
  const fetchRounds = () => {
    roundMgmtApi.list({ status: 'closed', per_page: 50 })
      .then(res => {
        const items = res.data.data?.items || []
        setRounds(items)
        // auto-select ถ้ามีแค่ 1 รอบ
        if (items.length === 1) setSelectedRound(items[0])
      })
      .catch(() => {}).finally(() => setLoading(false))
  }

  const fetchResults = () => {
    resultMgmtApi.list({ page: resultPage, per_page: PER_PAGE })
      .then(res => { setResults(res.data.data?.items || []); setResultTotal(res.data.data?.total || 0) })
      .catch(() => {})
  }

  const openResultDetail = async (round: Round) => {
    if (!round.result_top3) return
    setDetailRound(round); setDetailLoading(true)
    try {
      const res = await resultMgmtApi.preview(round.id, {
        top3: round.result_top3, top2: round.result_top2 || round.result_top3.slice(-2),
        bottom2: round.result_bottom2 || '',
      })
      setDetailData(res.data.data)
    } catch { setDetailData(null) } finally { setDetailLoading(false) }
  }

  useEffect(() => { fetchRounds() }, [])
  useEffect(() => { fetchResults() }, [resultPage])

  // ── Preview ───────────────────────────────────────────────────
  const handlePreview = async () => {
    if (!selectedRound || top3.length !== 3 || bottom2.length !== 2) {
      setMessage('กรุณากรอก 3 ตัวบน (3 หลัก) และ 2 ตัวล่าง (2 หลัก)'); return
    }
    setPreviewing(true); setMessage('')
    try {
      const payload: Record<string, string> = { top3, top2: top3.slice(-2), bottom2 }
      if (front3) payload.front3 = front3
      if (bottom3) payload.bottom3 = bottom3
      const res = await resultMgmtApi.preview(selectedRound.id, payload)
      setPreview(res.data.data)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setPreviewing(false) }
  }

  // ── Confirm ───────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!selectedRound) return
    setSubmitting(true); setMessage('')
    try {
      const payload: Record<string, string> = { top3, top2: top3.slice(-2), bottom2 }
      if (front3) payload.front3 = front3
      if (bottom3) payload.bottom3 = bottom3
      const res = await resultMgmtApi.submit(selectedRound.id, payload)
      const data = res.data.data
      setMessage(`กรอกผลสำเร็จ! ถูก ${data?.settled || 0} รายการ, จ่าย ฿${(data?.total_win || 0).toLocaleString()}`)
      setPreview(null); setSelectedRound(null); setTop3(''); setBottom2(''); setFront3(''); setBottom3('')
      fetchRounds(); fetchResults()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      setMessage(e.response?.data?.error || 'เกิดข้อผิดพลาด')
    } finally { setSubmitting(false) }
  }

  const isSuccess = message && message.includes('สำเร็จ')
  const fmtMoney = (n: number) => `฿${n.toLocaleString()}`

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>กรอกผลรางวัล</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {rounds.length} รอบรอกรอกผล
          </div>
        </div>
      </div>

      {/* ── Message ────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: isSuccess ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: isSuccess ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {isSuccess ? '\u2713 ' : '\u2717 '}{message}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
       * SECTION 1: เลือกรอบ — Card List
       * ═══════════════════════════════════════════════════════ */}
      {!selectedRound && !preview && (
        <div style={{ marginBottom: 24 }}>
          {loading ? <Loading inline text="กำลังโหลดรอบ..." /> : rounds.length === 0 ? (
            <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
              ไม่มีรอบที่รอกรอกผล — ต้องปิดรับแทงก่อน
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {rounds.map(r => (
                <div key={r.id} onClick={() => { setSelectedRound(r); setPreview(null) }}
                  className="card-surface" style={{
                    padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14,
                    transition: 'all 0.15s', borderColor: 'var(--border)',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)' }}
                >
                  {/* Icon */}
                  <span style={{ fontSize: 28 }}>{r.lottery_type?.icon || '🎲'}</span>
                  {/* Info */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{r.lottery_type?.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)', marginTop: 2 }}>
                      #{r.id} &middot; {r.round_number}
                    </div>
                  </div>
                  <span className="badge badge-warning">รอกรอกผล</span>
                  <ChevronRight size={16} color="var(--text-tertiary)" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
       * SECTION 2: กรอกผล — Premium Input
       * ═══════════════════════════════════════════════════════ */}
      {selectedRound && !preview && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 24 }}>
          {/* Header — ชื่อรอบ + ปุ่มเปลี่ยนรอบ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 32 }}>{selectedRound.lottery_type?.icon || '🎲'}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{selectedRound.lottery_type?.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono, monospace)' }}>
                  #{selectedRound.id} &middot; {selectedRound.round_number}
                </div>
              </div>
            </div>
            {rounds.length > 1 && (
              <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => setSelectedRound(null)}>
                เปลี่ยนรอบ
              </button>
            )}
          </div>

          {/* ── Hero: 3 ตัวบน ──────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#f5a623', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
              3 ตัวบน
            </div>
            <input type="text" value={top3}
              onChange={e => { setTop3(e.target.value.replace(/\D/g, '').slice(0, 3)); setPreview(null) }}
              placeholder="847" maxLength={3}
              className="input" style={{
                textAlign: 'center', fontSize: 56, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                height: 80, maxWidth: 240, margin: '0 auto', letterSpacing: 12,
                color: '#f5a623', background: 'color-mix(in srgb, #f5a623 5%, var(--bg-secondary))',
                borderColor: 'color-mix(in srgb, #f5a623 20%, var(--border))',
              }}
            />
            {/* 2 ตัวบน — auto-fill */}
            {top3.length >= 2 && (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 8 }}>
                2 ตัวบน: <span style={{ color: '#00e5a0', fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', fontSize: 16 }}>{top3.slice(-2)}</span>
              </div>
            )}
          </div>

          {/* ── 2 ตัวล่าง ─────────────────────────────────── */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3b82f6', marginBottom: 8, letterSpacing: 2, textTransform: 'uppercase' }}>
              2 ตัวล่าง
            </div>
            <input type="text" value={bottom2}
              onChange={e => { setBottom2(e.target.value.replace(/\D/g, '').slice(0, 2)); setPreview(null) }}
              placeholder="56" maxLength={2}
              className="input" style={{
                textAlign: 'center', fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
                height: 64, maxWidth: 180, margin: '0 auto', letterSpacing: 12,
                color: '#3b82f6', background: 'color-mix(in srgb, #3b82f6 5%, var(--bg-secondary))',
                borderColor: 'color-mix(in srgb, #3b82f6 20%, var(--border))',
              }}
            />
          </div>

          {/* ── ผลเพิ่มเติม (collapsible) ─────────────────── */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, marginBottom: 20 }}>
            <button onClick={() => setShowExtra(!showExtra)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'var(--text-secondary)', padding: 0,
              }}>
              {showExtra ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              ผลเพิ่มเติม (3 ตัวหน้า, 3 ตัวล่าง — เฉพาะหวยไทย)
            </button>
            {showExtra && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#ec4899', marginBottom: 4, fontWeight: 600 }}>3 ตัวหน้า</div>
                  <input type="text" value={front3}
                    onChange={e => { setFront3(e.target.value.replace(/\D/g, '').slice(0, 3)); setPreview(null) }}
                    placeholder="491" maxLength={3} className="input"
                    style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', height: 48, color: '#ec4899' }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#a855f7', marginBottom: 4, fontWeight: 600 }}>3 ตัวล่าง (comma แยก)</div>
                  <input type="text" value={bottom3}
                    onChange={e => { setBottom3(e.target.value.replace(/[^\d,]/g, '')); setPreview(null) }}
                    placeholder="123,456" className="input"
                    style={{ textAlign: 'center', fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', height: 48, color: '#a855f7' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ── Live Preview Card ──────────────────────────── */}
          {top3.length === 3 && bottom2.length === 2 && (
            <div style={{
              background: 'var(--bg-elevated)', borderRadius: 12, padding: '16px 20px', marginBottom: 20,
              display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap',
            }}>
              {[
                { label: '3 ตัวบน', value: top3, color: '#f5a623' },
                { label: '2 ตัวบน', value: top3.slice(-2), color: '#00e5a0' },
                { label: '2 ตัวล่าง', value: bottom2, color: '#3b82f6' },
                ...(front3 ? [{ label: '3 ตัวหน้า', value: front3, color: '#ec4899' }] : []),
                ...(bottom3 ? [{ label: '3 ตัวล่าง', value: bottom3, color: '#a855f7' }] : []),
                ...(front3 && top3 ? [{ label: '4 ตัวบน', value: (front3 + top3).slice(-4), color: '#14b8a6' }] : []),
              ].map(r => (
                <div key={r.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4 }}>{r.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 22, fontWeight: 800, color: r.color }}>{r.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* ── ปุ่ม Preview ───────────────────────────────── */}
          <button onClick={handlePreview} disabled={previewing || top3.length !== 3 || bottom2.length !== 2}
            className="btn btn-primary" style={{ width: '100%', height: 48, fontSize: 16, fontWeight: 700 }}>
            {previewing ? 'กำลังคำนวณ...' : 'ดูตัวอย่างผลก่อนยืนยัน'}
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
       * SECTION 3: Preview Results — Pro Dashboard
       * ═══════════════════════════════════════════════════════ */}
      {preview && (
        <div className="card-surface" style={{ padding: 24, marginBottom: 24, borderColor: 'rgba(0,229,160,0.3)' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Trophy size={20} color="var(--accent)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--accent)' }}>
                ตัวอย่างผล — {selectedRound?.lottery_type?.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>#{selectedRound?.id} {preview.round_number}</div>
            </div>
          </div>

          {/* Hero: กำไร/ขาดทุน */}
          <div style={{
            textAlign: 'center', padding: '20px 0', marginBottom: 20,
            background: 'var(--bg-elevated)', borderRadius: 12,
          }}>
            <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 8 }}>
              {preview.profit >= 0 ? 'กำไร' : 'ขาดทุน'}
            </div>
            <div style={{
              fontSize: 40, fontWeight: 800, fontFamily: 'var(--font-mono, monospace)',
              color: preview.profit >= 0 ? '#00e5a0' : '#ef4444',
            }}>
              {preview.profit >= 0 ? '+' : ''}{fmtMoney(preview.profit)}
            </div>
          </div>

          {/* Stat Cards — 4 ตัว */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { icon: Users, label: 'Bets', value: String(preview.total_bets), color: 'var(--text-primary)' },
              { icon: DollarSign, label: 'ยอดแทง', value: fmtMoney(preview.total_amount), color: '#a855f7' },
              { icon: Trophy, label: 'ถูกรางวัล', value: `${preview.winner_count} คน`, color: '#fbbf24' },
              { icon: TrendingUp, label: 'ต้องจ่าย', value: fmtMoney(preview.total_payout), color: '#ef4444' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ textAlign: 'center' }}>
                <s.icon size={16} color={s.color} style={{ marginBottom: 6 }} />
                <div className="label" style={{ fontSize: 10, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'var(--font-mono, monospace)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* ตารางผู้ถูกรางวัล */}
          {preview.winners && preview.winners.length > 0 ? (
            <>
              <div className="label" style={{ marginBottom: 8 }}>ผู้ถูกรางวัล ({preview.winner_count} รายการ)</div>
              <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', marginBottom: 20 }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>สมาชิก</th><th>เลข</th><th>ประเภท</th>
                      <th style={{ textAlign: 'right' }}>เดิมพัน</th>
                      <th style={{ textAlign: 'right' }}>Rate</th>
                      <th style={{ textAlign: 'right' }}>จ่าย</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.winners.map((w, i) => (
                      <tr key={i}>
                        <td><a href={`/members/${w.member_id}`} target="_blank" rel="noopener" style={{ color: 'var(--text-primary)', textDecoration: 'none' }}>{w.username || `ID:${w.member_id}`}</a></td>
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
            </>
          ) : (
            <div style={{ padding: '20px 0', color: 'var(--text-tertiary)', textAlign: 'center', marginBottom: 20, background: 'var(--bg-elevated)', borderRadius: 8 }}>
              ไม่มีใครถูกรางวัล — กำไรเต็มจำนวน {fmtMoney(preview.total_amount)}
            </div>
          )}

          {/* ปุ่ม */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => setPreview(null)} className="btn btn-secondary" style={{ flex: 1, height: 48, fontSize: 15 }}>
              แก้ไขผล
            </button>
            <button onClick={handleConfirm} disabled={submitting}
              className="btn btn-primary" style={{ flex: 2, height: 48, fontSize: 15, fontWeight: 700 }}>
              {submitting ? 'กำลังกรอกผล + จ่ายเงิน...' : `ยืนยันกรอกผล (จ่าย ${fmtMoney(preview.total_payout)})`}
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════
       * SECTION 4: ผลรางวัลล่าสุด
       * ═══════════════════════════════════════════════════════ */}
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
                <tr key={r.id} onClick={() => openResultDetail(r)} style={{ cursor: 'pointer' }}>
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
        {resultTotal > PER_PAGE && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button onClick={() => setResultPage(p => Math.max(1, p-1))} disabled={resultPage === 1} className="btn btn-ghost">ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {resultPage}/{Math.ceil(resultTotal / PER_PAGE)}</span>
            <button onClick={() => setResultPage(p => p+1)} disabled={results.length < PER_PAGE} className="btn btn-ghost">ถัดไป</button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════
       * MODAL: รายละเอียดผลรางวัล
       * ═══════════════════════════════════════════════════════ */}
      {detailRound && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={() => { setDetailRound(null); setDetailData(null) }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '85vh', overflow: 'auto' }}
            onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{detailRound.lottery_type?.icon} {detailRound.lottery_type?.name} — {detailRound.round_number}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>รายละเอียดผลรางวัล</div>
              </div>
              <button onClick={() => { setDetailRound(null); setDetailData(null) }} className="btn btn-ghost" style={{ fontSize: 18 }}>✕</button>
            </div>

            {/* ผลที่ออก */}
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
                {/* สรุป */}
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

                {/* ตารางคนถูก */}
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
              <button onClick={() => { setDetailRound(null); setDetailData(null) }} className="btn btn-secondary" style={{ width: '100%' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
