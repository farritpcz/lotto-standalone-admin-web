/**
 * =============================================================================
 * Admin — Yeekee Round Detail (รายละเอียดรอบยี่กี)
 * =============================================================================
 *
 * หน้านี้แสดงรายละเอียดรอบยี่กี 1 รอบ:
 * - ข้อมูลรอบ: round_no, status, เวลา, ผล
 * - ตาราง shoots: สมาชิกที่ยิง + เลขที่ยิง + เวลา
 * - สรุป bets: จำนวน bets, ยอดแทง, ยอดจ่าย, คนชนะ
 *
 * API: yeekeeMgmtApi.getRound(id)
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { yeekeeMgmtApi, YeekeeRound, YeekeeShoot } from '@/lib/api'

const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  waiting:     { badge: 'badge-neutral',  label: 'รอเริ่ม' },
  shooting:    { badge: 'badge-success',  label: 'กำลังยิง' },
  calculating: { badge: 'badge-warning',  label: 'คำนวณ' },
  resulted:    { badge: 'badge-primary',  label: 'ออกผลแล้ว' },
}

interface BetSummary {
  total_bets: number
  total_amount: number
  total_payout: number
  winner_count: number
}

interface BetItem {
  id: number
  member_id: number
  number: string
  amount: number
  rate: number
  status: string
  win_amount: number
  created_at: string
  settled_at?: string
  member?: { id: number; username: string }
  bet_type?: { id: number; name: string; code: string }
}

const betStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: 'รอผล', color: 'badge-warning' },
  won:     { label: 'ชนะ', color: 'badge-success' },
  lost:    { label: 'แพ้', color: 'badge-error' },
}

export default function YeekeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = Number(params.id)

  const [round, setRound] = useState<YeekeeRound | null>(null)
  const [shoots, setShoots] = useState<YeekeeShoot[]>([])
  const [bets, setBets] = useState<BetItem[]>([])
  const [betSummary, setBetSummary] = useState<BetSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await yeekeeMgmtApi.getRound(id)
      const data = res.data?.data
      setRound(data?.round || null)
      setShoots(data?.shoots || [])
      setBets(data?.bets || [])
      setBetSummary(data?.bet_summary || null)
    } catch (err) {
      console.error('Failed to fetch yeekee round:', err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchData()
    // Auto-refresh ถ้ารอบยังไม่จบ
    const interval = setInterval(() => {
      if (round?.status === 'shooting' || round?.status === 'calculating') {
        fetchData()
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [fetchData, round?.status])

  const formatTime = (t: string) => {
    try { return new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
    catch { return '-' }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="text-center py-20 text-[var(--text-tertiary)]">กำลังโหลด...</div>
      </div>
    )
  }

  if (!round) {
    return (
      <div className="page-container">
        <div className="text-center py-20 text-[var(--text-tertiary)]">ไม่พบรอบยี่กี</div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[round.status] || { badge: 'badge-neutral', label: round.status }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <button onClick={() => router.push('/yeekee')} className="btn btn-ghost btn-sm mb-2">
            ← กลับ
          </button>
          <h1 className="page-title">ยี่กี รอบ #{round.round_no}</h1>
          <p className="page-subtitle">
            {formatTime(round.start_time)} - {formatTime(round.end_time)}
            <span className={`badge ${cfg.badge} ml-3`}>{cfg.label}</span>
          </p>
        </div>
      </div>

      {/* Result + Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* ผลยี่กี */}
        <div className="card-surface p-4 col-span-2 md:col-span-1">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">ผลยี่กี</div>
          <div className="text-3xl font-mono font-bold text-yellow-400">
            {round.result_number || '-'}
          </div>
          {round.lottery_round && (
            <div className="mt-2 text-sm space-y-1">
              <div>3 บน: <span className="font-mono font-bold">{round.lottery_round.result_top3 || '-'}</span></div>
              <div>2 บน: <span className="font-mono font-bold">{round.lottery_round.result_top2 || '-'}</span></div>
              <div>2 ล่าง: <span className="font-mono font-bold">{round.lottery_round.result_bottom2 || '-'}</span></div>
            </div>
          )}
        </div>

        <div className="card-surface p-4">
          <div className="text-xs text-[var(--text-tertiary)] mb-1">เลขยิง</div>
          <div className="text-2xl font-bold">{shoots.length}</div>
        </div>

        {betSummary && (
          <>
            <div className="card-surface p-4">
              <div className="text-xs text-[var(--text-tertiary)] mb-1">ยอดแทง / จ่าย</div>
              <div className="text-lg font-bold">฿{betSummary.total_amount.toLocaleString()}</div>
              <div className="text-sm text-red-400">จ่าย ฿{betSummary.total_payout.toLocaleString()}</div>
            </div>
            <div className="card-surface p-4">
              <div className="text-xs text-[var(--text-tertiary)] mb-1">กำไร/ขาดทุน</div>
              <div className={`text-2xl font-bold ${(betSummary.total_amount - betSummary.total_payout) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                ฿{(betSummary.total_amount - betSummary.total_payout).toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-tertiary)]">{betSummary.winner_count} คนชนะ</div>
            </div>
          </>
        )}
      </div>

      {/* Bets Table — ⭐ บิลที่แทงเข้ามา */}
      <div className="card-surface mb-6">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold">บิลที่แทง ({bets.length} รายการ)</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>สมาชิก</th>
              <th>ประเภท</th>
              <th>เลข</th>
              <th>จำนวน</th>
              <th>เรท</th>
              <th>สถานะ</th>
              <th>รางวัล</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {bets.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-[var(--text-tertiary)]">ยังไม่มีบิลแทง</td></tr>
            ) : (
              bets.map((b, i) => {
                const st = betStatusLabels[b.status] || { label: b.status, color: 'badge-neutral' }
                return (
                  <tr key={b.id}>
                    <td className="text-[var(--text-tertiary)]">{i + 1}</td>
                    <td>{b.member?.username || `#${b.member_id}`}</td>
                    <td className="text-sm">{b.bet_type?.name || b.bet_type?.code || '-'}</td>
                    <td className="font-mono font-bold text-yellow-400">{b.number}</td>
                    <td>฿{b.amount.toLocaleString()}</td>
                    <td className="text-sm">{b.rate}</td>
                    <td><span className={`badge ${st.color}`}>{st.label}</span></td>
                    <td className={b.win_amount > 0 ? 'text-green-400 font-bold' : ''}>
                      {b.win_amount > 0 ? `฿${b.win_amount.toLocaleString()}` : '-'}
                    </td>
                    <td className="text-sm">{formatTime(b.created_at)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Shoots Table */}
      <div className="card-surface">
        <div className="p-4 border-b border-[var(--border-color)]">
          <h2 className="text-lg font-semibold">เลขที่ยิง ({shoots.length} เลข)</h2>
        </div>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>สมาชิก</th>
              <th>เลขที่ยิง</th>
              <th>เวลา</th>
            </tr>
          </thead>
          <tbody>
            {shoots.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-[var(--text-tertiary)]">ยังไม่มีเลขยิง</td></tr>
            ) : (
              shoots.map((s, i) => (
                <tr key={s.id}>
                  <td className="text-[var(--text-tertiary)]">{i + 1}</td>
                  <td>{s.member?.username || `#${s.member_id}`}</td>
                  <td className="font-mono font-bold text-yellow-400">{s.number}</td>
                  <td className="text-sm">{formatTime(s.shot_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
