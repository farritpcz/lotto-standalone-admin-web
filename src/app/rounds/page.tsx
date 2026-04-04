/**
 * =============================================================================
 * Admin — จัดการรอบหวย (Rounds Management) — Redesigned
 * =============================================================================
 *
 * ⭐ Redesign:
 *   - Quick stats bar (จำนวนรอบแต่ละสถานะ + สี)
 *   - Status filter pills พร้อม count
 *   - Lottery filter optgroup ตาม category
 *   - Table row color coding ตาม status
 *   - Compact action buttons ชัดเจน
 *   - Relative time ("เปิดอีก 2 ชม.", "ปิดไปแล้ว 30 นาที")
 *
 * API:
 *   - roundMgmtApi: list, create, manualOpen, manualClose, voidRound
 *   - lotteryMgmtApi: list (สำหรับ filter + form dropdown)
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { roundMgmtApi, lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import { Play, Square, XCircle, Clock, CheckCircle, AlertTriangle } from 'lucide-react'

// =============================================================================
// Types
// =============================================================================

interface Round {
  id: number; round_number: string; round_date: string
  status: string; open_time: string; close_time: string
  lottery_type_id?: number
  lottery_type?: { id: number; name: string; icon?: string; category?: string }
}

interface LotteryType {
  id: number; name: string; code: string; icon?: string
  status: string; category?: string
}

interface RoundFormData {
  lottery_type_id: string; round_number: string
  round_date: string; open_time: string; close_time: string
}

// =============================================================================
// Constants
// =============================================================================

/** สถานะ → สี + icon + label */
const STATUS_CONFIG: Record<string, { badge: string; label: string; color: string; bg: string }> = {
  upcoming: { badge: 'badge-neutral',  label: 'รอเปิด',       color: 'var(--text-secondary)',  bg: 'transparent' },
  open:     { badge: 'badge-success',  label: 'เปิดรับแทง',    color: '#34d399',               bg: 'rgba(52,211,153,0.06)' },
  closed:   { badge: 'badge-warning',  label: 'ปิดรับแทง',    color: '#fbbf24',               bg: 'rgba(251,191,36,0.06)' },
  resulted: { badge: 'badge-info',     label: 'ออกผลแล้ว',    color: '#60a5fa',               bg: 'rgba(96,165,250,0.06)' },
  voided:   { badge: 'badge-error',    label: 'ยกเลิกแล้ว',   color: '#ef4444',               bg: 'rgba(239,68,68,0.06)' },
}

/** Category groups สำหรับ optgroup ใน dropdown */
const CATEGORY_GROUPS = [
  { key: 'thai',   label: 'หวยไทย' },
  { key: 'yeekee', label: 'ยี่กี' },
  { key: 'lao',    label: 'หวยลาว' },
  { key: 'hanoi',  label: 'หวยฮานอย' },
  { key: 'malay',  label: 'มาเลย์' },
  { key: 'stock',  label: 'หวยหุ้น' },
]

const EMPTY_FORM: RoundFormData = { lottery_type_id: '', round_number: '', round_date: '', open_time: '', close_time: '' }
const PER_PAGE = 20

// =============================================================================
// Helpers
// =============================================================================

/** Format datetime → "16 เม.ย. 14:30" */
const fmtShort = (s: string) => {
  try {
    const d = new Date(s)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) + ' ' +
           String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  } catch { return s }
}

/** Format time only → "14:30" */
const fmtTime = (s: string) => {
  try {
    const d = new Date(s)
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')
  } catch { return s }
}

/** Format date only → "2026-04-16" */
const fmtDateOnly = (s: string) => {
  try { return new Date(s).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' }) }
  catch { return s }
}

/** Relative time from now → "เปิดอีก 2 ชม.", "ปิดไป 30 นาที" */
const relativeTime = (s: string) => {
  try {
    const diff = new Date(s).getTime() - Date.now()
    const absDiff = Math.abs(diff)
    const mins = Math.floor(absDiff / 60000)
    const hrs = Math.floor(mins / 60)
    const days = Math.floor(hrs / 24)
    const suffix = diff > 0 ? 'อีก' : 'ที่แล้ว'
    if (days > 0) return `${suffix} ${days} วัน`
    if (hrs > 0) return `${suffix} ${hrs} ชม.`
    return `${suffix} ${mins} นาที`
  } catch { return '' }
}

// =============================================================================
// Component
// =============================================================================

export default function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [lotteryFilter, setLotteryFilter] = useState('')
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<RoundFormData>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string; message: string; type: 'warning' | 'danger'
    confirmLabel?: string; onConfirm: () => void
  } | null>(null)

  // ── Stat counts (จากข้อมูลปัจจุบัน — ไม่ต้อง API แยก) ────────
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // ── Data fetching ─────────────────────────────────────────────
  const loadRounds = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = { page, per_page: PER_PAGE }
      if (statusFilter) params.status = statusFilter
      if (lotteryFilter) params.lottery_type_id = Number(lotteryFilter)
      const res = await roundMgmtApi.list(params)
      setRounds(res.data.data?.items || [])
      setTotal(res.data.data?.total || 0)
    } catch { /* silent */ } finally { setLoading(false) }
  }, [page, statusFilter, lotteryFilter])

  const loadLotteryTypes = useCallback(async () => {
    try {
      const res = await lotteryMgmtApi.list()
      setLotteryTypes(res.data.data || [])
    } catch { /* silent */ }
  }, [])

  // ── Load stat counts (ดึงแบบไม่ filter เพื่อนับ) ──────────────
  const loadCounts = useCallback(async () => {
    try {
      const counts: Record<string, number> = {}
      for (const s of ['upcoming', 'open', 'closed', 'resulted', 'voided']) {
        const res = await roundMgmtApi.list({ status: s, per_page: 1 })
        counts[s] = res.data.data?.total || 0
      }
      setStatusCounts(counts)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { loadRounds() }, [loadRounds])
  useEffect(() => { loadLotteryTypes(); loadCounts() }, [loadLotteryTypes, loadCounts])

  // ── Actions ───────────────────────────────────────────────────
  const changeStatus = (id: number, newStatus: string) => {
    const configs: Record<string, { title: string; message: string; type: 'warning' | 'danger' }> = {
      open:   { title: 'เปิดรับแทง',  message: `เปิดรับแทงรอบ #${id}?\nสมาชิกจะสามารถแทงหวยรอบนี้ได้`, type: 'warning' },
      closed: { title: 'ปิดรับแทง',   message: `ปิดรับแทงรอบ #${id}?\nสมาชิกจะไม่สามารถแทงรอบนี้ได้อีก`, type: 'danger' },
    }
    const cfg = configs[newStatus] || { title: 'เปลี่ยนสถานะ', message: `ยืนยันเปลี่ยนสถานะรอบ #${id}?`, type: 'warning' as const }
    setConfirmDialog({
      ...cfg,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          if (newStatus === 'open') await roundMgmtApi.manualOpen(id)
          else if (newStatus === 'closed') await roundMgmtApi.manualClose(id)
          else await roundMgmtApi.updateStatus(id, newStatus)
          await loadRounds(); loadCounts()
        } catch { /* silent */ }
      },
    })
  }

  const handleVoidRound = (id: number) => {
    setConfirmDialog({
      title: 'ยกเลิกรอบหวย',
      message: `ยืนยันยกเลิกรอบ #${id}?\n\nคืนเงินเดิมพันทุกรายการ\nหักเงินรางวัลที่จ่ายแล้ว (ถ้ามี)`,
      type: 'danger', confirmLabel: 'ยกเลิกรอบ',
      onConfirm: async () => {
        setConfirmDialog(null)
        try { await roundMgmtApi.voidRound(id, 'ยกเลิกโดยแอดมิน'); await loadRounds(); loadCounts() }
        catch { /* silent */ }
      },
    })
  }

  // ── Modal ─────────────────────────────────────────────────────
  const openCreateModal = () => { setForm(EMPTY_FORM); setShowModal(true) }
  const closeModal = () => { setShowModal(false) }

  const handleSubmit = async () => {
    if (!form.lottery_type_id || !form.round_number.trim() || !form.round_date || !form.open_time || !form.close_time) return
    try {
      setSubmitting(true)
      await roundMgmtApi.create({
        lottery_type_id: Number(form.lottery_type_id), round_number: form.round_number,
        round_date: form.round_date, open_time: form.open_time, close_time: form.close_time,
      })
      closeModal(); await loadRounds(); loadCounts()
    } catch { /* silent */ } finally { setSubmitting(false) }
  }

  const onStatusFilter = (v: string) => { setStatusFilter(v); setPage(1) }
  const onLotteryFilter = (v: string) => { setLotteryFilter(v); setPage(1) }
  const totalPages = Math.ceil(total / PER_PAGE)

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1>จัดการรอบหวย</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {total} รอบ{statusFilter ? ` (${STATUS_CONFIG[statusFilter]?.label || statusFilter})` : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ สร้างรอบ</button>
      </div>

      {/* ── Quick Stats ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 20 }}>
        {(['upcoming', 'open', 'closed', 'resulted', 'voided'] as const).map(s => {
          const cfg = STATUS_CONFIG[s]
          const isActive = statusFilter === s
          return (
            <div key={s} onClick={() => onStatusFilter(isActive ? '' : s)} style={{
              background: isActive ? cfg.bg : 'var(--bg-surface)',
              border: `1px solid ${isActive ? cfg.color : 'var(--border)'}`,
              borderRadius: 8, padding: '10px 12px', cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <div style={{ fontSize: 11, color: cfg.color, fontWeight: 600, marginBottom: 4 }}>{cfg.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: isActive ? cfg.color : 'var(--text-primary)' }}>
                {statusCounts[s] ?? '-'}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Filters ────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        {/* Lottery filter — optgroup ตาม category */}
        <select className="input" style={{ width: 'auto', minWidth: 200 }} value={lotteryFilter} onChange={e => onLotteryFilter(e.target.value)}>
          <option value="">ทุกประเภทหวย</option>
          {CATEGORY_GROUPS.map(cat => {
            const items = lotteryTypes.filter(lt => lt.status === 'active' && (lt.category || '') === cat.key)
            if (items.length === 0) return null
            return (
              <optgroup key={cat.key} label={cat.label}>
                {items.map(lt => (
                  <option key={lt.id} value={String(lt.id)}>{lt.icon ? `${lt.icon} ` : ''}{lt.name}</option>
                ))}
              </optgroup>
            )
          })}
        </select>
        {(statusFilter || lotteryFilter) && (
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setStatusFilter(''); setLotteryFilter(''); setPage(1) }}>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      {/* ── Table ──────────────────────────────────────────── */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? <Loading inline text="กำลังโหลด..." /> : rounds.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>ไม่พบรอบหวย</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 50 }}>ID</th>
                <th>ประเภทหวย</th>
                <th>เลขรอบ</th>
                <th>วันที่</th>
                <th>เวลา</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right', width: 160 }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(r => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.upcoming
                return (
                  <tr key={r.id} style={{ background: sc.bg }}>
                    <td className="mono secondary">#{r.id}</td>
                    <td>
                      <span style={{ fontWeight: 500 }}>
                        {r.lottery_type?.icon ? `${r.lottery_type.icon} ` : ''}{r.lottery_type?.name || '-'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{r.round_number}</td>
                    <td className="secondary" style={{ fontSize: 12 }}>{fmtDateOnly(r.round_date)}</td>
                    {/* เวลาเปิด-ปิด + relative */}
                    <td style={{ fontSize: 12 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(r.open_time)}</span>
                      <span style={{ color: 'var(--text-tertiary)', margin: '0 4px' }}>-</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{fmtTime(r.close_time)}</span>
                      {r.status === 'upcoming' && (
                        <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 2 }}>{relativeTime(r.open_time)}</div>
                      )}
                      {r.status === 'open' && (
                        <div style={{ fontSize: 10, color: '#fbbf24', marginTop: 2 }}>ปิด{relativeTime(r.close_time)}</div>
                      )}
                    </td>
                    <td><span className={`badge ${sc.badge}`}>{sc.label}</span></td>
                    {/* Actions — compact */}
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                        {r.status === 'upcoming' && (
                          <button className="btn btn-success" style={{ fontSize: 11, height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => changeStatus(r.id, 'open')}>
                            <Play size={12} /> เปิด
                          </button>
                        )}
                        {r.status === 'open' && (
                          <button className="btn btn-secondary" style={{ fontSize: 11, height: 26, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 4 }}
                            onClick={() => changeStatus(r.id, 'closed')}>
                            <Square size={12} /> ปิด
                          </button>
                        )}
                        {['open', 'closed', 'resulted'].includes(r.status) && (
                          <button className="btn btn-ghost" style={{ fontSize: 11, height: 26, padding: '0 8px', color: 'var(--status-error)' }}
                            onClick={() => handleVoidRound(r.id)} title="ยกเลิกรอบ">
                            <XCircle size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: 16, borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}>ก่อนหน้า</button>
            <span style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: 13 }}>หน้า {page}/{totalPages}</span>
            <button className="btn btn-ghost" onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page >= totalPages}>ถัดไป</button>
          </div>
        )}
      </div>

      {/* ── Create Modal ───────────────────────────────────── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className="card-surface" style={{ width: '100%', maxWidth: 480, padding: 24, animation: 'fadeSlideUp 0.2s ease' }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>สร้างรอบหวยใหม่</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>ประเภทหวย</label>
                <select className="input" value={form.lottery_type_id} onChange={e => setForm({ ...form, lottery_type_id: e.target.value })}>
                  <option value="">— เลือกประเภทหวย —</option>
                  {CATEGORY_GROUPS.map(cat => {
                    const items = lotteryTypes.filter(lt => lt.status === 'active' && (lt.category || '') === cat.key)
                    if (items.length === 0) return null
                    return (
                      <optgroup key={cat.key} label={cat.label}>
                        {items.map(lt => <option key={lt.id} value={String(lt.id)}>{lt.icon ? `${lt.icon} ` : ''}{lt.name}</option>)}
                      </optgroup>
                    )
                  })}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>เลขรอบ</label>
                  <input className="input" style={{ fontFamily: 'var(--font-mono, monospace)' }} placeholder="20260401" value={form.round_number} onChange={e => setForm({ ...form, round_number: e.target.value })} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>วันที่ออกผล</label>
                  <input className="input" type="date" value={form.round_date} onChange={e => setForm({ ...form, round_date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>เวลาเปิดรับ</label>
                  <input className="input" type="datetime-local" value={form.open_time} onChange={e => setForm({ ...form, open_time: e.target.value })} />
                </div>
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>เวลาปิดรับ</label>
                  <input className="input" type="datetime-local" value={form.close_time} onChange={e => setForm({ ...form, close_time: e.target.value })} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={closeModal}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={handleSubmit}
                disabled={submitting || !form.lottery_type_id || !form.round_number.trim() || !form.round_date || !form.open_time || !form.close_time}>
                {submitting ? 'กำลังสร้าง...' : 'สร้างรอบหวย'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ──────────────────────────────────── */}
      {confirmDialog && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '28px 24px', maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{confirmDialog.type === 'danger' ? '⚠️' : '🔔'}</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: confirmDialog.type === 'danger' ? '#ef4444' : '#f5a623' }}>
              {confirmDialog.title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {confirmDialog.message}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirmDialog(null)} className="btn btn-secondary" style={{ flex: 1, height: 38 }}>ยกเลิก</button>
              <button onClick={confirmDialog.onConfirm} className={confirmDialog.type === 'danger' ? 'btn btn-danger' : 'btn btn-primary'} style={{ flex: 1, height: 38, fontWeight: 600 }}>
                {confirmDialog.confirmLabel || 'ยืนยัน'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
