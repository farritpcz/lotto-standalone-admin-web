/**
 * Admin — จัดการเลขอั้น (Number Ban Management)
 *
 * ฟีเจอร์:
 * - แสดงรายการเลขอั้นทั้งหมดใน admin-table
 * - เพิ่มเลขอั้นผ่าน modal form (ครบทุก field)
 * - ลบเลขอั้นแต่ละรายการ
 * - รองรับ 3 ประเภทการอั้น: full_ban / reduce_rate / max_amount
 *
 * ความสัมพันธ์:
 * - เรียก banMgmtApi → standalone-admin-api (#5)
 * - เรียก lotteryMgmtApi.list() → ดึง dropdown ประเภทหวย
 * - provider-backoffice-admin-web (#10) มีหน้าคล้ายกัน
 *
 * Design System: Linear/Vercel dark theme
 * - ใช้ .page-container, .page-header, .card-surface
 * - ใช้ .admin-table สำหรับตาราง
 * - ใช้ .btn, .btn-primary, .btn-danger สำหรับปุ่ม
 * - ใช้ .input สำหรับ form fields
 * - ใช้ .badge-* สำหรับ status badges
 */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { banMgmtApi, lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'

// =============================================================================
// TYPES — โครงสร้างข้อมูลเลขอั้น
// =============================================================================

/** เลขอั้น 1 รายการ — มาจาก API */
interface Ban {
  id: number
  number: string               // เลขที่อั้น เช่น "123", "99"
  ban_type: string             // ประเภท: full_ban | reduce_rate | max_amount
  reduced_rate: number         // rate ที่ลด (ใช้เมื่อ ban_type = reduce_rate)
  max_amount: number           // จำนวนเงินสูงสุด (ใช้เมื่อ ban_type = max_amount)
  lottery_type_id: number      // ID ประเภทหวย
  bet_type_id: number          // ID ประเภทเดิมพัน
  lottery_type_name?: string   // ชื่อประเภทหวย (join มาจาก API)
}

/** ประเภทหวย — มาจาก lotteryMgmtApi.list() */
interface LotteryType {
  id: number
  name: string
  code: string
}

/** ข้อมูลฟอร์มสำหรับเพิ่มเลขอั้น */
interface BanFormData {
  lottery_type_id: number
  bet_type_id: string
  number: string
  ban_type: 'full_ban' | 'reduce_rate' | 'max_amount'
  reduced_rate: number
  max_amount: number
}

// =============================================================================
// CONSTANTS — ประเภทเดิมพัน (hardcode ตาม lotto-core)
// =============================================================================

/** รายการประเภทเดิมพันทั้งหมด */
const BET_TYPES = [
  { id: '3TOP', label: '3 ตัวบน' },
  { id: '3TOD', label: '3 ตัวโต๊ด' },
  { id: '2TOP', label: '2 ตัวบน' },
  { id: '2BOTTOM', label: '2 ตัวล่าง' },
  { id: 'RUN_TOP', label: 'วิ่งบน' },
  { id: 'RUN_BOT', label: 'วิ่งล่าง' },
] as const

/** แปลง ban_type เป็นภาษาไทย */
const BAN_TYPE_LABELS: Record<string, string> = {
  full_ban: 'อั้นเต็ม',
  reduce_rate: 'ลดเรท',
  max_amount: 'จำกัดยอด',
}

/** แปลง bet_type_id เป็นภาษาไทย */
const BET_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  BET_TYPES.map(bt => [bt.id, bt.label])
)

/* จำนวนรายการต่อหน้า (pagination) */
const PER_PAGE = 20

// =============================================================================
// COMPONENT — BansPage
// =============================================================================
export default function BansPage() {
  // ----- State: ข้อมูลหลัก -----
  const [bans, setBans] = useState<Ban[]>([])
  const [lotteryTypes, setLotteryTypes] = useState<LotteryType[]>([])
  const [loading, setLoading] = useState(true)

  // ----- State: pagination — หน้าปัจจุบัน + จำนวนรายการทั้งหมด -----
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  // ----- State: Modal เพิ่มเลขอั้น -----
  const [showModal, setShowModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<BanFormData>({
    lottery_type_id: 0,
    bet_type_id: '3TOP',
    number: '',
    ban_type: 'full_ban',
    reduced_rate: 0,
    max_amount: 0,
  })

  // ----- State: Feedback messages -----
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== โหลดข้อมูลเลขอั้น — ส่ง page + per_page ไปให้ API =====
  const loadBans = useCallback(() => {
    setLoading(true)
    banMgmtApi.list({ page, per_page: PER_PAGE })
      .then(res => {
        setBans(res.data.data?.items || res.data.data || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => setMessage({ type: 'error', text: 'โหลดข้อมูลเลขอั้นไม่สำเร็จ' }))
      .finally(() => setLoading(false))
  }, [page])

  // ===== โหลดประเภทหวย (สำหรับ dropdown) =====
  const loadLotteryTypes = useCallback(() => {
    lotteryMgmtApi.list()
      .then(res => {
        const types = res.data.data || []
        setLotteryTypes(types)
        // ตั้ง default lottery_type_id ให้เป็นตัวแรก
        if (types.length > 0) {
          setFormData(prev => ({ ...prev, lottery_type_id: types[0].id }))
        }
      })
      .catch(() => {})
  }, [])

  // ===== เรียกโหลดข้อมูลตอน mount =====
  useEffect(() => {
    loadBans()
    loadLotteryTypes()
  }, [loadBans, loadLotteryTypes])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ===== เปิด modal + reset form =====
  const openModal = () => {
    setFormData({
      lottery_type_id: lotteryTypes[0]?.id || 0,
      bet_type_id: '3TOP',
      number: '',
      ban_type: 'full_ban',
      reduced_rate: 0,
      max_amount: 0,
    })
    setShowModal(true)
  }

  // ===== บันทึกเลขอั้นใหม่ =====
  const handleSubmit = async () => {
    // Validate — ต้องกรอกเลข
    if (!formData.number.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกเลขที่ต้องการอั้น' })
      return
    }

    setSubmitting(true)
    try {
      await banMgmtApi.create({
        lottery_type_id: formData.lottery_type_id,
        bet_type_id: formData.bet_type_id,
        number: formData.number.trim(),
        ban_type: formData.ban_type,
        // ส่ง reduced_rate / max_amount ตาม ban_type ที่เลือก
        ...(formData.ban_type === 'reduce_rate' && { reduced_rate: formData.reduced_rate }),
        ...(formData.ban_type === 'max_amount' && { max_amount: formData.max_amount }),
      })
      setMessage({ type: 'success', text: `อั้นเลข "${formData.number}" สำเร็จ` })
      setShowModal(false)
      loadBans()  // รีโหลดตาราง
    } catch {
      setMessage({ type: 'error', text: 'เพิ่มเลขอั้นไม่สำเร็จ' })
    } finally {
      setSubmitting(false)
    }
  }

  // ===== ลบเลขอั้น =====
  const handleDelete = async (ban: Ban) => {
    if (!confirm(`ยืนยันลบเลขอั้น "${ban.number}" ?`)) return
    try {
      await banMgmtApi.delete(ban.id)
      setMessage({ type: 'success', text: `ลบเลขอั้น "${ban.number}" แล้ว` })
      loadBans()
    } catch {
      setMessage({ type: 'error', text: 'ลบเลขอั้นไม่สำเร็จ' })
    }
  }

  // ===== หา badge class ตาม ban_type =====
  const getBanTypeBadge = (banType: string) => {
    switch (banType) {
      case 'full_ban': return 'badge badge-error'
      case 'reduce_rate': return 'badge badge-warning'
      case 'max_amount': return 'badge badge-info'
      default: return 'badge badge-neutral'
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="page-container">
      {/* ===== Page Header ===== */}
      <div className="page-header">
        <div>
          <h1>จัดการเลขอั้น</h1>
          <p className="label" style={{ marginTop: 4 }}>
            {bans.length} รายการ
          </p>
        </div>
        {/* ปุ่มเพิ่มเลขอั้น */}
        <button className="btn btn-primary" onClick={openModal}>
          + เพิ่มเลขอั้น
        </button>
      </div>

      {/* ===== Feedback Message ===== */}
      {message && (
        <div
          className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-error'}`}
          style={{ marginBottom: 16, padding: '8px 16px', fontSize: 13 }}
        >
          {message.text}
        </div>
      )}

      {/* ===== ตารางเลขอั้น ===== */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          /* Loading state */
          <Loading inline text="กำลังโหลด..." />
        ) : bans.length === 0 ? (
          /* Empty state — ยังไม่มีเลขอั้น */
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            ยังไม่มีเลขอั้น — กดปุ่ม &quot;เพิ่มเลขอั้น&quot; เพื่อเริ่มต้น
          </div>
        ) : (
          /* ตารางข้อมูล */
          <table className="admin-table">
            <thead>
              <tr>
                <th>เลขอั้น</th>
                <th>ประเภทหวย</th>
                <th>ประเภทเดิมพัน</th>
                <th>ประเภทอั้น</th>
                <th>รายละเอียด</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {bans.map(ban => (
                <tr key={ban.id}>
                  {/* เลขอั้น — monospace font ให้อ่านง่าย */}
                  <td className="mono" style={{ fontWeight: 600, fontSize: 15 }}>
                    {ban.number}
                  </td>

                  {/* ประเภทหวย */}
                  <td className="secondary">
                    {ban.lottery_type_name || `ID: ${ban.lottery_type_id}`}
                  </td>

                  {/* ประเภทเดิมพัน */}
                  <td className="secondary">
                    {BET_TYPE_LABELS[ban.bet_type_id] || ban.bet_type_id}
                  </td>

                  {/* Badge ประเภทอั้น */}
                  <td>
                    <span className={getBanTypeBadge(ban.ban_type)}>
                      {BAN_TYPE_LABELS[ban.ban_type] || ban.ban_type}
                    </span>
                  </td>

                  {/* รายละเอียดเพิ่มเติม (ถ้ามี) */}
                  <td className="secondary mono">
                    {ban.ban_type === 'reduce_rate' && `เรท: ${ban.reduced_rate}`}
                    {ban.ban_type === 'max_amount' && `สูงสุด: ฿${ban.max_amount?.toLocaleString()}`}
                    {ban.ban_type === 'full_ban' && '—'}
                  </td>

                  {/* ปุ่มลบ */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDelete(ban)}
                    >
                      ลบ
                    </button>
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
            <button onClick={() => setPage(p => p+1)} disabled={bans.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>

      {/* =================================================================
       * MODAL: เพิ่มเลขอั้น
       * position: fixed overlay + centered card
       * ================================================================= */}
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
          onClick={() => setShowModal(false)}  // คลิกนอก modal เพื่อปิด
        >
          <div
            className="card-surface"
            style={{
              width: '100%',
              maxWidth: 480,
              padding: 24,
              margin: 16,
            }}
            onClick={e => e.stopPropagation()}  // ป้องกันปิดเมื่อคลิกใน modal
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                เพิ่มเลขอั้น
              </h2>
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {/* ===== Form Fields ===== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* 1) ประเภทหวย — dropdown จาก API */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  ประเภทหวย
                </label>
                <select
                  className="input"
                  value={formData.lottery_type_id}
                  onChange={e => setFormData(prev => ({ ...prev, lottery_type_id: Number(e.target.value) }))}
                >
                  {lotteryTypes.map(lt => (
                    <option key={lt.id} value={lt.id}>
                      {lt.name} ({lt.code})
                    </option>
                  ))}
                  {lotteryTypes.length === 0 && (
                    <option value={0}>โหลดประเภทหวยไม่สำเร็จ</option>
                  )}
                </select>
              </div>

              {/* 2) ประเภทเดิมพัน — hardcode list */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  ประเภทเดิมพัน
                </label>
                <select
                  className="input"
                  value={formData.bet_type_id}
                  onChange={e => setFormData(prev => ({ ...prev, bet_type_id: e.target.value }))}
                >
                  {BET_TYPES.map(bt => (
                    <option key={bt.id} value={bt.id}>
                      {bt.label} ({bt.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3) เลขที่ต้องการอั้น */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                  เลขที่ต้องการอั้น
                </label>
                <input
                  className="input"
                  type="text"
                  placeholder="เช่น 123, 99, 5"
                  value={formData.number}
                  onChange={e => setFormData(prev => ({ ...prev, number: e.target.value }))}
                  autoFocus
                />
              </div>

              {/* 4) ประเภทการอั้น — radio buttons */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: 8 }}>
                  ประเภทการอั้น
                </label>
                <div style={{ display: 'flex', gap: 12 }}>
                  {/* อั้นเต็ม */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
                  }}>
                    <input
                      type="radio"
                      name="ban_type"
                      checked={formData.ban_type === 'full_ban'}
                      onChange={() => setFormData(prev => ({ ...prev, ban_type: 'full_ban' }))}
                    />
                    อั้นเต็ม
                  </label>

                  {/* ลดเรท */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
                  }}>
                    <input
                      type="radio"
                      name="ban_type"
                      checked={formData.ban_type === 'reduce_rate'}
                      onChange={() => setFormData(prev => ({ ...prev, ban_type: 'reduce_rate' }))}
                    />
                    ลดเรท
                  </label>

                  {/* จำกัดยอด */}
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13,
                  }}>
                    <input
                      type="radio"
                      name="ban_type"
                      checked={formData.ban_type === 'max_amount'}
                      onChange={() => setFormData(prev => ({ ...prev, ban_type: 'max_amount' }))}
                    />
                    จำกัดยอด
                  </label>
                </div>
              </div>

              {/* 5) Reduced Rate — แสดงเมื่อเลือก "ลดเรท" */}
              {formData.ban_type === 'reduce_rate' && (
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                    เรทที่ลด (บาท)
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder="เช่น 500"
                    value={formData.reduced_rate || ''}
                    onChange={e => setFormData(prev => ({ ...prev, reduced_rate: Number(e.target.value) }))}
                  />
                </div>
              )}

              {/* 6) Max Amount — แสดงเมื่อเลือก "จำกัดยอด" */}
              {formData.ban_type === 'max_amount' && (
                <div>
                  <label className="label" style={{ display: 'block', marginBottom: 6 }}>
                    จำนวนเงินสูงสุด (บาท)
                  </label>
                  <input
                    className="input"
                    type="number"
                    placeholder="เช่น 10000"
                    value={formData.max_amount || ''}
                    onChange={e => setFormData(prev => ({ ...prev, max_amount: Number(e.target.value) }))}
                  />
                </div>
              )}
            </div>

            {/* ===== Modal Footer — ปุ่ม ยกเลิก / บันทึก ===== */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24 }}>
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                ยกเลิก
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
