/**
 * =============================================================================
 * Admin — จัดการรอบหวย (Rounds Management)
 * =============================================================================
 *
 * หน้านี้ใช้จัดการรอบหวย (rounds) ทั้งหมดในระบบ
 * - แสดงรายการรอบหวยในตาราง (admin-table)
 * - สร้างรอบหวยใหม่ (modal form)
 * - เปลี่ยนสถานะ: upcoming → open → closed
 * - กรองตาม status + lottery_type
 * - แบ่งหน้า (pagination)
 *
 * ใช้ Design System: Linear/Vercel dark theme
 * - .page-container, .page-header — layout
 * - .card-surface — card wrapper
 * - .admin-table — ตาราง
 * - .badge-* — status badges
 * - .btn, .btn-* — buttons
 * - .input — form inputs
 *
 * API:
 * - roundMgmtApi: list(), create(), updateStatus()
 * - lotteryMgmtApi: list() — สำหรับ dropdown เลือกประเภทหวย
 *
 * ความสัมพันธ์:
 * - round อ้างอิง lottery_type_id → ต้องดึง lottery_types มาด้วย
 * - round ที่ status=closed ถูกใช้ในหน้า results (กรอกผล)
 * - round ที่ status=open เปิดให้ members แทง (member-web)
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { roundMgmtApi, lotteryMgmtApi } from '@/lib/api'

// =============================================================================
// Types — โครงสร้างข้อมูลรอบหวย
// =============================================================================

/** ข้อมูลรอบหวยจาก API */
interface Round {
  id: number
  round_number: string      // เลขรอบ เช่น "20260401-001"
  round_date: string         // วันที่ออกผล
  status: string             // สถานะ: upcoming | open | closed | resulted
  open_time: string          // เวลาเปิดรับแทง
  close_time: string         // เวลาปิดรับแทง
  lottery_type_id?: number   // FK → lottery_types
  lottery_type?: {           // ข้อมูล join กลับมา
    id: number
    name: string
    icon?: string
  }
}

/** ข้อมูลประเภทหวย (สำหรับ dropdown) */
interface LotteryType {
  id: number
  name: string
  code: string
  icon?: string
  status: string
}

/** ข้อมูลสำหรับ form สร้างรอบหวย */
interface RoundFormData {
  lottery_type_id: string   // string เพราะมาจาก select value
  round_number: string
  round_date: string
  open_time: string
  close_time: string
}

// =============================================================================
// Constants — สถานะรอบหวย
// =============================================================================

/** Map สถานะ → badge class + ชื่อภาษาไทย */
const STATUS_CONFIG: Record<string, { badge: string; label: string }> = {
  upcoming: { badge: 'badge-neutral', label: 'รอเปิด' },
  open:     { badge: 'badge-success', label: 'เปิดรับแทง' },
  closed:   { badge: 'badge-warning', label: 'ปิดรับแทง' },
  resulted: { badge: 'badge-info',    label: 'ออกผลแล้ว' },
}

/** ตัวเลือก filter สถานะ (รวม "ทั้งหมด") */
const STATUS_FILTERS = [
  { value: '', label: 'ทั้งหมด' },
  { value: 'upcoming', label: 'รอเปิด' },
  { value: 'open', label: 'เปิดรับแทง' },
  { value: 'closed', label: 'ปิดรับแทง' },
  { value: 'resulted', label: 'ออกผลแล้ว' },
]

/** ค่าเริ่มต้นของ form (ว่างเปล่า) */
const EMPTY_FORM: RoundFormData = {
  lottery_type_id: '',
  round_number: '',
  round_date: '',
  open_time: '',
  close_time: '',
}

/** จำนวนรายการต่อหน้า */
const PER_PAGE = 20

// =============================================================================
// Component หลัก — RoundsPage
// =============================================================================
export default function RoundsPage() {
  // ---------------------------------------------------------------------------
  // State — ข้อมูลและ UI state
  // ---------------------------------------------------------------------------

  /** รายการรอบหวย */
  const [rounds, setRounds] = useState<Round[]>([])

  /** จำนวนรอบทั้งหมด (สำหรับ pagination) */
  const [total, setTotal] = useState(0)

  /** หน้าปัจจุบัน */
  const [page, setPage] = useState(1)

  /** กำลังโหลดหรือไม่ */
  const [loading, setLoading] = useState(true)

  /** Filter: สถานะที่เลือก */
  const [statusFilter, setStatusFilter] = useState('')

  /** Filter: ประเภทหวยที่เลือก */
  const [lotteryFilter, setLotteryFilter] = useState('')

  /** รายการประเภทหวย (สำหรับ dropdown filter + form) */
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])

  /** แสดง modal สร้างรอบหวยหรือไม่ */
  const [showModal, setShowModal] = useState(false)

  /** ข้อมูลใน form */
  const [form, setForm] = useState<RoundFormData>(EMPTY_FORM)

  /** กำลัง submit form หรือไม่ */
  const [submitting, setSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching — โหลดข้อมูลรอบหวย + ประเภทหวย
  // ---------------------------------------------------------------------------

  /** โหลดรายการรอบหวย (รองรับ filter + pagination) */
  const loadRounds = useCallback(async () => {
    try {
      setLoading(true)
      const params: Record<string, unknown> = {
        page,
        per_page: PER_PAGE,
      }
      // เพิ่ม filter ถ้ามีค่า
      if (statusFilter) params.status = statusFilter
      if (lotteryFilter) params.lottery_type_id = Number(lotteryFilter)

      const res = await roundMgmtApi.list(params)
      setRounds(res.data.data?.items || [])
      setTotal(res.data.data?.total || 0)
    } catch (err) {
      console.error('โหลดรอบหวยไม่สำเร็จ:', err)
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, lotteryFilter])

  /** โหลดรายการประเภทหวย (ใช้ใน dropdown) */
  const loadLotteryTypes = useCallback(async () => {
    try {
      const res = await lotteryMgmtApi.list()
      setLotteryTypes(res.data.data || [])
    } catch (err) {
      console.error('โหลดประเภทหวยไม่สำเร็จ:', err)
    }
  }, [])

  /** โหลดข้อมูลเมื่อ mount + เมื่อ filter/page เปลี่ยน */
  useEffect(() => { loadRounds() }, [loadRounds])
  useEffect(() => { loadLotteryTypes() }, [loadLotteryTypes])

  // ---------------------------------------------------------------------------
  // Status actions — เปลี่ยนสถานะรอบหวย
  // ---------------------------------------------------------------------------

  /** เปลี่ยนสถานะรอบหวย (upcoming→open, open→closed) */
  const changeStatus = async (id: number, newStatus: string) => {
    try {
      await roundMgmtApi.updateStatus(id, newStatus)
      // reload ข้อมูลหลังเปลี่ยนสถานะ
      await loadRounds()
    } catch (err) {
      console.error('เปลี่ยนสถานะไม่สำเร็จ:', err)
      alert('เกิดข้อผิดพลาดในการเปลี่ยนสถานะ')
    }
  }

  // ---------------------------------------------------------------------------
  // Modal handlers — เปิด/ปิด modal, submit form สร้างรอบ
  // ---------------------------------------------------------------------------

  /** เปิด modal สร้างรอบหวยใหม่ */
  const openCreateModal = () => {
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  /** ปิด modal + reset form */
  const closeModal = () => {
    setShowModal(false)
    setForm(EMPTY_FORM)
  }

  /** Submit form — สร้างรอบหวยใหม่ */
  const handleSubmit = async () => {
    // ตรวจสอบข้อมูลจำเป็น
    if (!form.lottery_type_id || !form.round_number.trim() || !form.round_date || !form.open_time || !form.close_time) {
      return
    }

    try {
      setSubmitting(true)
      await roundMgmtApi.create({
        lottery_type_id: Number(form.lottery_type_id),
        round_number: form.round_number,
        round_date: form.round_date,
        open_time: form.open_time,
        close_time: form.close_time,
      })
      // สำเร็จ → ปิด modal + reload
      closeModal()
      await loadRounds()
    } catch (err) {
      console.error('สร้างรอบหวยไม่สำเร็จ:', err)
      alert('เกิดข้อผิดพลาดในการสร้างรอบหวย')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Filter handlers — เปลี่ยน filter จะ reset page กลับ 1
  // ---------------------------------------------------------------------------

  /** เปลี่ยน status filter */
  const onStatusFilter = (value: string) => {
    setStatusFilter(value)
    setPage(1)
  }

  /** เปลี่ยน lottery type filter */
  const onLotteryFilter = (value: string) => {
    setLotteryFilter(value)
    setPage(1)
  }

  // ---------------------------------------------------------------------------
  // Helpers — ฟังก์ชันช่วย
  // ---------------------------------------------------------------------------

  /** จำนวนหน้าทั้งหมด */
  const totalPages = Math.ceil(total / PER_PAGE)

  /** Format datetime → ภาษาไทย */
  const formatThaiDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('th-TH', {
        day: '2-digit',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  // ---------------------------------------------------------------------------
  // Render — แสดงผลหน้าจอ
  // ---------------------------------------------------------------------------
  return (
    <div className="page-container">
      {/* ====== Page header — ชื่อหน้า + ปุ่มสร้างรอบ ====== */}
      <div className="page-header">
        <h1>จัดการรอบหวย</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + สร้างรอบหวย
        </button>
      </div>

      {/* ====== Filters — กรอง status + ประเภทหวย ====== */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Filter สถานะ (tab-style buttons) */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {STATUS_FILTERS.map(sf => (
            <button
              key={sf.value}
              className={`btn ${statusFilter === sf.value ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => onStatusFilter(sf.value)}
            >
              {sf.label}
            </button>
          ))}
        </div>

        {/* Filter ประเภทหวย (dropdown) */}
        <select
          className="input"
          style={{ width: 'auto', minWidth: '180px' }}
          value={lotteryFilter}
          onChange={e => onLotteryFilter(e.target.value)}
        >
          <option value="">ทุกประเภทหวย</option>
          {lotteryTypes.filter(lt => lt.status === 'active').map(lt => (
            <option key={lt.id} value={String(lt.id)}>
              {lt.icon ? `${lt.icon} ` : ''}{lt.name}
            </option>
          ))}
        </select>
      </div>

      {/* ====== ตารางรายการรอบหวย ====== */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          /* กำลังโหลด */
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            กำลังโหลดข้อมูล...
          </div>
        ) : rounds.length === 0 ? (
          /* ไม่มีข้อมูล */
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ไม่พบรอบหวย — ลองเปลี่ยนตัวกรอง หรือกดปุ่ม &quot;สร้างรอบหวย&quot;
          </div>
        ) : (
          /* ตาราง admin-table */
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ประเภทหวย</th>
                <th>เลขรอบ</th>
                <th>วันที่</th>
                <th>เปิดรับ</th>
                <th>ปิดรับ</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {rounds.map(r => {
                // หา config ของสถานะ
                const sc = STATUS_CONFIG[r.status] || { badge: 'badge-neutral', label: r.status }

                return (
                  <tr key={r.id}>
                    {/* ID */}
                    <td className="mono secondary">#{r.id}</td>
                    {/* ประเภทหวย (ชื่อ + icon) */}
                    <td style={{ fontWeight: 500 }}>
                      {r.lottery_type?.icon ? `${r.lottery_type.icon} ` : ''}
                      {r.lottery_type?.name || '-'}
                    </td>

                    {/* เลขรอบ (monospace) */}
                    <td className="mono">{r.round_number}</td>

                    {/* วันที่ออกผล */}
                    <td className="secondary">{r.round_date}</td>

                    {/* เวลาเปิดรับ */}
                    <td className="secondary" style={{ fontSize: '12px' }}>
                      {formatThaiDate(r.open_time)}
                    </td>

                    {/* เวลาปิดรับ */}
                    <td className="secondary" style={{ fontSize: '12px' }}>
                      {formatThaiDate(r.close_time)}
                    </td>

                    {/* สถานะ badge */}
                    <td>
                      <span className={`badge ${sc.badge}`}>
                        {sc.label}
                      </span>
                    </td>

                    {/* ปุ่มจัดการ — เปลี่ยนสถานะตาม flow */}
                    <td style={{ textAlign: 'right' }}>
                      {/* upcoming → เปิดรับแทง */}
                      {r.status === 'upcoming' && (
                        <button
                          className="btn btn-success"
                          onClick={() => changeStatus(r.id, 'open')}
                        >
                          เปิดรับแทง
                        </button>
                      )}
                      {/* open → ปิดรับแทง */}
                      {r.status === 'open' && (
                        <button
                          className="btn btn-warning"
                          style={{ background: 'var(--status-warning-bg)', color: 'var(--status-warning)' }}
                          onClick={() => changeStatus(r.id, 'closed')}
                        >
                          ปิดรับแทง
                        </button>
                      )}
                      {/* closed / resulted → ไม่มี action */}
                      {(r.status === 'closed' || r.status === 'resulted') && (
                        <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {/* ====== Pagination — แบ่งหน้า ====== */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '16px',
            borderTop: '1px solid var(--border)',
          }}>
            {/* ปุ่มก่อนหน้า */}
            <button
              className="btn btn-ghost"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ก่อนหน้า
            </button>

            {/* แสดงหน้าปัจจุบัน / ทั้งหมด */}
            <span className="data-text" style={{ color: 'var(--text-secondary)', padding: '0 8px' }}>
              หน้า {page} / {totalPages}
            </span>

            {/* ปุ่มถัดไป */}
            <button
              className="btn btn-ghost"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              ถัดไป
            </button>
          </div>
        )}
      </div>

      {/* ====================================================================
       * Modal — ฟอร์มสร้างรอบหวยใหม่
       * ====================================================================
       * ใช้ fixed overlay (position: fixed, inset: 0, z-index: 200)
       * centered card สำหรับ form
       * ==================================================================== */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={(e) => {
            // คลิก backdrop → ปิด modal
            if (e.target === e.currentTarget) closeModal()
          }}
        >
          <div
            className="card-surface"
            style={{
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              animation: 'fadeSlideUp 0.2s ease',
            }}
          >
            {/* หัวข้อ modal */}
            <h2 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: '20px',
            }}>
              สร้างรอบหวยใหม่
            </h2>

            {/* ====== Form fields ====== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* ประเภทหวย (dropdown) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  ประเภทหวย
                </label>
                <select
                  className="input"
                  value={form.lottery_type_id}
                  onChange={e => setForm({ ...form, lottery_type_id: e.target.value })}
                >
                  <option value="">— เลือกประเภทหวย —</option>
                  {lotteryTypes.filter(lt => lt.status === 'active').map(lt => (
                    <option key={lt.id} value={String(lt.id)}>
                      {lt.icon ? `${lt.icon} ` : ''}{lt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* เลขรอบ (round_number) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  เลขรอบ
                </label>
                <input
                  className="input"
                  placeholder="เช่น 20260401-001"
                  value={form.round_number}
                  onChange={e => setForm({ ...form, round_number: e.target.value })}
                />
              </div>

              {/* วันที่ออกผล (round_date) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  วันที่ออกผล
                </label>
                <input
                  className="input"
                  type="date"
                  value={form.round_date}
                  onChange={e => setForm({ ...form, round_date: e.target.value })}
                />
              </div>

              {/* เวลาเปิดรับแทง (open_time) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  เวลาเปิดรับแทง
                </label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.open_time}
                  onChange={e => setForm({ ...form, open_time: e.target.value })}
                />
              </div>

              {/* เวลาปิดรับแทง (close_time) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  เวลาปิดรับแทง
                </label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.close_time}
                  onChange={e => setForm({ ...form, close_time: e.target.value })}
                />
              </div>
            </div>

            {/* ====== ปุ่ม submit / cancel ====== */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              marginTop: '24px',
            }}>
              <button className="btn btn-secondary" onClick={closeModal}>
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={
                  submitting ||
                  !form.lottery_type_id ||
                  !form.round_number.trim() ||
                  !form.round_date ||
                  !form.open_time ||
                  !form.close_time
                }
              >
                {submitting ? 'กำลังสร้าง...' : 'สร้างรอบหวย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
