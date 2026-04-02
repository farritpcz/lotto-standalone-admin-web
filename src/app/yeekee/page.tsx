/**
 * =============================================================================
 * Admin — Yeekee Monitor (ยี่กี) — แสดงรอบแบบ card คล้ายหน้าสมาชิก
 * =============================================================================
 *
 * - stat cards: รอบทั้งหมด, กำลังยิง, ออกผลแล้ว, กำไร
 * - filter tabs: All / Shooting / Waiting / Resulted
 * - ⭐ แสดงรอบเป็น card (gradient + countdown) แบบ member-web
 * - auto-refresh ทุก 10 วินาที
 * - คลิกรอบ → หน้า detail /yeekee/[id]
 *
 * API: yeekeeMgmtApi.listRounds(), yeekeeMgmtApi.getStats()
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { yeekeeMgmtApi, YeekeeRound, YeekeeStats } from '@/lib/api'

// สถานะ → badge + label
const STATUS_CONFIG: Record<string, { badge: string; label: string; color: string }> = {
  waiting:     { badge: 'badge-neutral',  label: 'รอเริ่ม',     color: '#8E8E93' },
  shooting:    { badge: 'badge-success',  label: 'กำลังยิง',    color: '#34d399' },
  calculating: { badge: 'badge-warning',  label: 'คำนวณ',       color: '#fbbf24' },
  resulted:    { badge: 'badge-primary',  label: 'ออกผลแล้ว',   color: '#60a5fa' },
}

const FILTERS = [
  { value: '',           label: 'ทั้งหมด' },
  { value: 'shooting',   label: 'กำลังยิง' },
  { value: 'waiting',    label: 'รอเริ่ม' },
  { value: 'resulted',   label: 'ออกผลแล้ว' },
]

// =============================================================================
// Countdown Hook
// =============================================================================
function useCountdown(targetTime: string) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const calc = () => {
      const diff = Math.max(0, new Date(targetTime).getTime() - Date.now())
      setTotal(diff)
      return diff
    }
    const diff = calc()
    if (diff <= 0) return
    const timer = setInterval(() => {
      if (calc() <= 0) clearInterval(timer)
    }, 1000)
    return () => clearInterval(timer)
  }, [targetTime])

  const hours = Math.floor((total / (1000 * 60 * 60)) % 24)
  const minutes = Math.floor((total / (1000 * 60)) % 60)
  const seconds = Math.floor((total / 1000) % 60)
  const pad = (n: number) => String(n).padStart(2, '0')

  return { total, text: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` }
}

// =============================================================================
// Round Card — แบบ gradient คล้ายหน้าสมาชิก (dark theme)
// =============================================================================
function YeekeeRoundCard({ round, onClick }: { round: YeekeeRound; onClick: () => void }) {
  const countdown = useCountdown(round.end_time)
  const isShooting = round.status === 'shooting'
  const isResulted = round.status === 'resulted'
  const isExpired = countdown.total <= 0

  const closeDate = new Date(round.end_time)
  const closeTimeStr = closeDate.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  const startTimeStr = new Date(round.start_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl overflow-hidden transition-transform hover:scale-[1.02] active:scale-[0.98]"
      style={{ opacity: isExpired && !isResulted ? 0.5 : 1 }}
    >
      {/* Card body — gradient */}
      <div
        className="relative p-3"
        style={{
          background: isResulted
            ? 'linear-gradient(135deg, #1a3a5f 0%, #1e3a2a 100%)'
            : 'linear-gradient(135deg, #0d6e6e 0%, #14956e 50%, #1a472a 100%)',
          minHeight: '100px',
        }}
      >
        {/* ลายตัวเลข */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Ctext x='3' y='20' font-size='14' fill='white' font-family='monospace'%3E8%3C/text%3E%3Ctext x='20' y='10' font-size='12' fill='white' font-family='monospace'%3E3%3C/text%3E%3Ctext x='25' y='32' font-size='13' fill='white' font-family='monospace'%3E7%3C/text%3E%3C/svg%3E")`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* LIVE badge */}
        {isShooting && (
          <div className="absolute top-2 right-2">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: 'rgba(52, 199, 89, 0.9)' }}>
              <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        )}

        {/* ข้อมูลรอบ */}
        <div className="relative z-10 flex items-start gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold text-white"
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
            ยี่กี
          </div>
          <div className="text-white min-w-0">
            <div className="font-bold text-sm">รอบที่ {round.round_no}</div>
            <div className="text-[11px] opacity-80">{startTimeStr} - {closeTimeStr}</div>
            <div className="text-[11px] opacity-80">ยิง {round.total_shoots || 0} เลข</div>
          </div>
        </div>

        {/* ผลยี่กี */}
        {isResulted && round.result_number && (
          <div className="relative z-10 mt-2 flex items-center gap-2">
            <div className="bg-white/20 rounded-lg px-2 py-1 text-center flex-1">
              <div className="text-white text-[9px] opacity-70">ผล</div>
              <div className="text-yellow-300 text-base font-mono font-bold">{round.result_number}</div>
            </div>
            <div className="flex gap-1 text-[10px] text-white/80">
              <div className="bg-white/10 rounded px-1.5 py-0.5">
                <div className="opacity-60">3บ</div>
                <div className="font-mono font-bold">{round.lottery_round?.result_top3 || '-'}</div>
              </div>
              <div className="bg-white/10 rounded px-1.5 py-0.5">
                <div className="opacity-60">2บ</div>
                <div className="font-mono font-bold">{round.lottery_round?.result_top2 || '-'}</div>
              </div>
              <div className="bg-white/10 rounded px-1.5 py-0.5">
                <div className="opacity-60">2ล</div>
                <div className="font-mono font-bold">{round.lottery_round?.result_bottom2 || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Countdown bar */}
      <div className="px-2 py-1.5 flex items-center justify-center gap-1.5"
        style={{ background: '#1e1e2e', borderTop: '1px solid #2e2e42' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke={isExpired ? '#fbbf24' : '#34d399'}
          strokeWidth={2} className="w-3 h-3">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="text-[11px] font-semibold"
          style={{ color: isExpired ? '#fbbf24' : '#34d399' }}>
          {isResulted ? 'ออกผลแล้ว' : isExpired ? 'หมดเวลา' : countdown.text}
        </span>
      </div>
    </button>
  )
}

// =============================================================================
// Main Page
// =============================================================================
export default function YeekeeMonitorPage() {
  const router = useRouter()
  const [rounds, setRounds] = useState<YeekeeRound[]>([])
  const [stats, setStats] = useState<YeekeeStats | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]) // default วันนี้
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 40

  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, per_page: perPage, date: selectedDate }
      if (statusFilter) params.status = statusFilter

      const [roundsRes, statsRes] = await Promise.all([
        yeekeeMgmtApi.listRounds(params as never),
        yeekeeMgmtApi.getStats(),
      ])

      setRounds(roundsRes.data?.data?.items || [])
      setTotal(roundsRes.data?.data?.total || 0)
      setStats(statsRes.data?.data || null)
    } catch (err) {
      console.error('Failed to fetch yeekee data:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, selectedDate])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const totalPages = Math.ceil(total / perPage)

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">ยี่กี Monitor</h1>
          <p className="page-subtitle">รอบยี่กีวันนี้ — auto-refresh ทุก 10 วินาที</p>
        </div>
      </div>

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card-surface p-4">
            <div className="text-xs text-[var(--text-tertiary)] mb-1">รอบทั้งหมด</div>
            <div className="text-2xl font-bold">{stats.total_rounds}</div>
          </div>
          <div className="card-surface p-4">
            <div className="text-xs text-[var(--text-tertiary)] mb-1">กำลังยิง</div>
            <div className="text-2xl font-bold text-green-400">{stats.shooting_count}</div>
          </div>
          <div className="card-surface p-4">
            <div className="text-xs text-[var(--text-tertiary)] mb-1">ออกผลแล้ว</div>
            <div className="text-2xl font-bold text-blue-400">{stats.resulted_count}</div>
          </div>
          <div className="card-surface p-4">
            <div className="text-xs text-[var(--text-tertiary)] mb-1">กำไรวันนี้</div>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              ฿{stats.profit.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs + Date Picker */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatusFilter(f.value); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                statusFilter === f.value
                  ? 'bg-[var(--accent-primary)] text-white'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        {/* ⭐ เลือกวันที่ — ดูย้อนหลังได้ */}
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => { setSelectedDate(e.target.value); setPage(1) }}
          className="px-3 py-1.5 rounded-lg text-sm border border-[var(--border-color)] focus:outline-none"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
        />
      </div>

      {/* ⭐ Round Cards — แบบ gradient คล้ายหน้าสมาชิก */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: '#1e1e2e', height: '140px' }} />
          ))}
        </div>
      ) : rounds.length === 0 ? (
        <div className="card-surface p-12 text-center text-[var(--text-tertiary)]">
          ไม่พบรอบยี่กี
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {rounds.map(r => (
            <YeekeeRoundCard
              key={r.id}
              round={r}
              onClick={() => router.push(`/yeekee/${r.id}`)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-[var(--text-tertiary)]">
            แสดง {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} จาก {total} รอบ
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-ghost btn-sm"
            >
              ก่อนหน้า
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-ghost btn-sm"
            >
              ถัดไป
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
