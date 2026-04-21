/**
 * Admin — จัดการรอบหวย (Rounds Management) — orchestrator
 *
 * Sub-components: src/components/rounds/*
 *  - StatsBar              — quick count per status
 *  - LotterySelect         — optgroup dropdown (reused in modal)
 *  - RoundsTable           — rounds list + action buttons + pagination
 *  - CreateRoundModal      — create form
 *  - InlineConfirmDialog   — warning/danger confirm (keep custom for rounds)
 *
 * API:
 *   - roundMgmtApi: list, create, manualOpen, manualClose, voidRound
 *   - lotteryMgmtApi: list (สำหรับ filter + form dropdown)
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import { roundMgmtApi, lotteryMgmtApi } from '@/lib/api'
import StatsBar from '@/components/rounds/StatsBar'
import LotterySelect from '@/components/rounds/LotterySelect'
import RoundsTable from '@/components/rounds/RoundsTable'
import CreateRoundModal from '@/components/rounds/CreateRoundModal'
import InlineConfirmDialog, { type InlineDialog } from '@/components/rounds/InlineConfirmDialog'
import { STATUS_CONFIG, EMPTY_FORM, PER_PAGE, type Round, type LotteryType, type RoundFormData } from '@/components/rounds/types'

export default function RoundsPage() {
  // ─── State ──────────────────────────────────────────────────────
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
  const [confirmDialog, setConfirmDialog] = useState<InlineDialog | null>(null)
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})

  // ─── Data fetching ──────────────────────────────────────────────
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

  // ดึงนับสถานะ (ไม่ filter) — ใช้แสดงบน StatsBar
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

  // ─── Actions ────────────────────────────────────────────────────
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

  // ─── Modal ──────────────────────────────────────────────────────
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

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1>จัดการรอบหวย</h1>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            {total} รอบ{statusFilter ? ` (${STATUS_CONFIG[statusFilter]?.label || statusFilter})` : ''}
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>+ สร้างรอบ</button>
      </div>

      <StatsBar statusCounts={statusCounts} statusFilter={statusFilter} onSelect={onStatusFilter} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <LotterySelect
          value={lotteryFilter}
          onChange={onLotteryFilter}
          lotteryTypes={lotteryTypes}
          style={{ width: 'auto', minWidth: 200 }}
        />
        {(statusFilter || lotteryFilter) && (
          <button className="btn btn-ghost" style={{ fontSize: 12 }} onClick={() => { setStatusFilter(''); setLotteryFilter(''); setPage(1) }}>
            ล้างตัวกรอง
          </button>
        )}
      </div>

      <RoundsTable
        rounds={rounds}
        loading={loading}
        page={page}
        totalPages={totalPages}
        onChangePage={setPage}
        onChangeStatus={changeStatus}
        onVoidRound={handleVoidRound}
      />

      {showModal && (
        <CreateRoundModal
          form={form}
          setForm={setForm}
          lotteryTypes={lotteryTypes}
          submitting={submitting}
          onClose={closeModal}
          onSubmit={handleSubmit}
        />
      )}

      {confirmDialog && (
        <InlineConfirmDialog dialog={confirmDialog} onCancel={() => setConfirmDialog(null)} />
      )}
    </div>
  )
}
