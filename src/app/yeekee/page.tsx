/**
 * =============================================================================
 * Admin — Yeekee Monitor (ยี่กี)
 * =============================================================================
 *
 * หน้านี้แสดงรอบยี่กีทั้งหมดของวันนี้ + สถิติ real-time
 * - stat cards: รอบทั้งหมด, กำลังยิง, ออกผลแล้ว, กำไร
 * - filter tabs: All / Shooting / Waiting / Resulted
 * - data table: round_no, status, time, shoots, result, bets, payout
 * - auto-refresh ทุก 10 วินาที
 *
 * API: yeekeeMgmtApi.listRounds(), yeekeeMgmtApi.getStats()
 *
 * ความสัมพันธ์:
 * - ยี่กีสร้างรอบอัตโนมัติ 88 รอบ/วัน โดย cron job ใน member-api (#3)
 * - ผลคำนวณอัตโนมัติจากเลขที่สมาชิกยิง (ไม่ต้อง admin กรอก)
 * - คลิกรอบ → ไปหน้า detail /yeekee/[id]
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { yeekeeMgmtApi, YeekeeRound, YeekeeStats } from '@/lib/api'

// สถานะ → badge class + ชื่อไทย
const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  waiting:     { badge: 'badge-neutral',  label: 'รอเริ่ม' },
  shooting:    { badge: 'badge-success',  label: 'กำลังยิง' },
  calculating: { badge: 'badge-warning',  label: 'คำนวณ' },
  resulted:    { badge: 'badge-primary',  label: 'ออกผลแล้ว' },
}

const FILTERS = [
  { value: '',           label: 'ทั้งหมด' },
  { value: 'shooting',   label: 'กำลังยิง' },
  { value: 'waiting',    label: 'รอเริ่ม' },
  { value: 'resulted',   label: 'ออกผลแล้ว' },
]

export default function YeekeeMonitorPage() {
  const router = useRouter()
  const [rounds, setRounds] = useState<YeekeeRound[]>([])
  const [stats, setStats] = useState<YeekeeStats | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 20

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const params: Record<string, unknown> = { page, per_page: perPage }
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
  }, [page, statusFilter])

  useEffect(() => {
    fetchData()
    // Auto-refresh ทุก 10 วินาที
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  const formatTime = (t: string) => {
    try { return new Date(t).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) }
    catch { return '-' }
  }

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

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
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

      {/* Table */}
      <div className="card-surface">
        <table className="admin-table">
          <thead>
            <tr>
              <th>รอบ</th>
              <th>สถานะ</th>
              <th>เวลา</th>
              <th>ยิง</th>
              <th>ผล</th>
              <th>3 บน</th>
              <th>2 บน</th>
              <th>2 ล่าง</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-8 text-[var(--text-tertiary)]">กำลังโหลด...</td></tr>
            ) : rounds.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-[var(--text-tertiary)]">ไม่พบรอบยี่กี</td></tr>
            ) : (
              rounds.map(r => {
                const cfg = STATUS_CONFIG[r.status] || { badge: 'badge-neutral', label: r.status }
                return (
                  <tr
                    key={r.id}
                    onClick={() => router.push(`/yeekee/${r.id}`)}
                    className="cursor-pointer hover:bg-[var(--bg-secondary)]"
                  >
                    <td className="font-mono font-bold">#{r.round_no}</td>
                    <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                    <td className="text-sm">{formatTime(r.start_time)} - {formatTime(r.end_time)}</td>
                    <td>{r.total_shoots || 0}</td>
                    <td className="font-mono font-bold text-yellow-400">
                      {r.result_number || '-'}
                    </td>
                    <td className="font-mono">{r.lottery_round?.result_top3 || '-'}</td>
                    <td className="font-mono">{r.lottery_round?.result_top2 || '-'}</td>
                    <td className="font-mono">{r.lottery_round?.result_bottom2 || '-'}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--border-color)]">
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
    </div>
  )
}
