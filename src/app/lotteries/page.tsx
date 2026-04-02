/**
 * =============================================================================
 * Admin — จัดการประเภทหวย (Lottery Types CRUD)
 * =============================================================================
 *
 * หน้านี้ใช้จัดการประเภทหวยทั้งหมดในระบบ
 * - แสดงรายการประเภทหวยในตาราง (admin-table)
 * - เพิ่มประเภทหวยใหม่ (modal form)
 * - แก้ไขประเภทหวยที่มีอยู่ (modal form prefilled)
 * - เปลี่ยนสถานะ active/inactive (toggle)
 *
 * ใช้ Design System: Linear/Vercel dark theme
 * - .page-container, .page-header — layout
 * - .card-surface — card wrapper
 * - .admin-table — ตาราง
 * - .badge-* — status badges
 * - .btn, .btn-* — buttons
 * - .input — form inputs
 *
 * API: lotteryMgmtApi จาก @/lib/api
 * - list() — ดึงรายการทั้งหมด
 * - create(data) — สร้างใหม่
 * - update(id, data) — แก้ไข
 *
 * ความสัมพันธ์:
 * - ข้อมูล lottery_types ถูกใช้ในหน้า rounds (เลือกประเภทหวยตอนสร้างรอบ)
 * - ข้อมูล lottery_types ถูกใช้ในหน้า rates (ตั้งอัตราจ่าย per type)
 * =============================================================================
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { lotteryMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'

// =============================================================================
// Types — โครงสร้างข้อมูลประเภทหวย
// =============================================================================

/** ข้อมูลประเภทหวยจาก API */
interface LotteryType {
  id: number
  name: string        // ชื่อ เช่น "หวยรัฐบาล"
  code: string        // รหัส เช่น "GOVT"
  category: string    // หมวด เช่น "thai", "lao", "stock"
  status: string      // สถานะ "active" | "inactive"
  icon: string        // emoji icon เช่น "🇹🇭"
  description?: string // รายละเอียดเพิ่มเติม
}

/** ข้อมูลสำหรับ form สร้าง/แก้ไข */
interface LotteryFormData {
  name: string
  code: string
  category: string
  icon: string
  description: string
}

// =============================================================================
// Constants — ตัวเลือกหมวดหมู่หวย
// =============================================================================

/** หมวดหมู่ประเภทหวยที่รองรับ (dropdown options) */
const CATEGORY_OPTIONS = [
  { value: 'thai', label: 'หวยไทย' },
  { value: 'lao', label: 'หวยลาว' },
  { value: 'hanoi', label: 'หวยฮานอย' },
  { value: 'stock', label: 'หวยหุ้น' },
  { value: 'malay', label: 'หวยมาเลย์' },
  { value: 'yeekee', label: 'หวยยี่กี' },
  { value: 'pingpong', label: 'หวยปิงปอง' },
  { value: 'other', label: 'อื่นๆ' },
]

/** ค่าเริ่มต้นของ form (ว่างเปล่า) */
const EMPTY_FORM: LotteryFormData = {
  name: '',
  code: '',
  category: 'thai',
  icon: '🎰',
  description: '',
}

/* จำนวนรายการต่อหน้า (pagination) */
const PER_PAGE = 20

// =============================================================================
// Component หลัก — LotteriesPage
// =============================================================================
export default function LotteriesPage() {
  // ---------------------------------------------------------------------------
  // State — ข้อมูลและ UI state
  // ---------------------------------------------------------------------------

  /** รายการประเภทหวยทั้งหมด */
  const [types, setTypes] = useState<LotteryType[]>([])

  /** กำลังโหลดข้อมูลหรือไม่ */
  const [loading, setLoading] = useState(true)

  /** state สำหรับ pagination — หน้าปัจจุบัน + จำนวนรายการทั้งหมด */
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  /** แสดง modal form หรือไม่ */
  const [showModal, setShowModal] = useState(false)

  /** ข้อมูลที่กำลังแก้ไข (null = สร้างใหม่) */
  const [editing, setEditing] = useState<LotteryType | null>(null)

  /** ข้อมูลใน form */
  const [form, setForm] = useState<LotteryFormData>(EMPTY_FORM)

  /** กำลัง submit form หรือไม่ (ป้องกันกดซ้ำ) */
  const [submitting, setSubmitting] = useState(false)

  // ---------------------------------------------------------------------------
  // Data fetching — โหลดข้อมูลจาก API
  // ---------------------------------------------------------------------------

  /** โหลดรายการประเภทหวย — ส่ง page + per_page ไปให้ API */
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const res = await lotteryMgmtApi.list({ page, per_page: PER_PAGE })
      // API อาจคืน data.data เป็น array หรือ { items, total }
      const data = res.data.data
      if (Array.isArray(data)) {
        setTypes(data)
        setTotal(data.length)
      } else {
        setTypes(data?.items || [])
        setTotal(data?.total || 0)
      }
    } catch (err) {
      console.error('โหลดประเภทหวยไม่สำเร็จ:', err)
    } finally {
      setLoading(false)
    }
  }, [page])

  /** โหลดข้อมูลครั้งแรกเมื่อ mount + เมื่อเปลี่ยนหน้า */
  useEffect(() => { loadData() }, [loadData])

  // ---------------------------------------------------------------------------
  // Modal handlers — เปิด/ปิด modal, submit form
  // ---------------------------------------------------------------------------

  /** เปิด modal สร้างประเภทหวยใหม่ */
  const openCreateModal = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  /** เปิด modal แก้ไขประเภทหวย (prefill ข้อมูลเดิม) */
  const openEditModal = (lt: LotteryType) => {
    setEditing(lt)
    setForm({
      name: lt.name,
      code: lt.code,
      category: lt.category,
      icon: lt.icon,
      description: lt.description || '',
    })
    setShowModal(true)
  }

  /** ปิด modal และ reset form */
  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  /** Submit form — สร้างใหม่ หรือ อัพเดท */
  const handleSubmit = async () => {
    // ตรวจสอบข้อมูลจำเป็น
    if (!form.name.trim() || !form.code.trim()) return

    try {
      setSubmitting(true)

      if (editing) {
        // === แก้ไข (update) ===
        await lotteryMgmtApi.update(editing.id, { ...form })
      } else {
        // === สร้างใหม่ (create) ===
        await lotteryMgmtApi.create({ ...form })
      }

      // สำเร็จ → ปิด modal + reload ข้อมูล
      closeModal()
      await loadData()
    } catch (err) {
      console.error('บันทึกไม่สำเร็จ:', err)
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Status toggle — สลับ active/inactive
  // ---------------------------------------------------------------------------

  /** สลับสถานะ active ↔ inactive */
  const toggleStatus = async (lt: LotteryType) => {
    const newStatus = lt.status === 'active' ? 'inactive' : 'active'
    try {
      await lotteryMgmtApi.update(lt.id, { status: newStatus })
      await loadData()
    } catch (err) {
      console.error('เปลี่ยนสถานะไม่สำเร็จ:', err)
    }
  }

  // ---------------------------------------------------------------------------
  // Render — แสดงผลหน้าจอ
  // ---------------------------------------------------------------------------
  return (
    <div className="page-container">
      {/* ====== Page header — ชื่อหน้า + ปุ่มเพิ่ม ====== */}
      <div className="page-header">
        <h1>จัดการประเภทหวย</h1>
        <button className="btn btn-primary" onClick={openCreateModal}>
          + เพิ่มประเภทหวย
        </button>
      </div>

      {/* ====== สรุปจำนวน (stat cards) ====== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
        {/* จำนวนทั้งหมด */}
        <div className="stat-card">
          <div className="label" style={{ marginBottom: '4px' }}>ทั้งหมด</div>
          <div className="metric">{types.length}</div>
        </div>
        {/* จำนวนที่ active */}
        <div className="stat-card">
          <div className="label" style={{ marginBottom: '4px' }}>เปิดใช้งาน</div>
          <div className="metric" style={{ color: 'var(--status-success)' }}>
            {types.filter(t => t.status === 'active').length}
          </div>
        </div>
        {/* จำนวนที่ inactive */}
        <div className="stat-card">
          <div className="label" style={{ marginBottom: '4px' }}>ปิดใช้งาน</div>
          <div className="metric" style={{ color: 'var(--text-secondary)' }}>
            {types.filter(t => t.status !== 'active').length}
          </div>
        </div>
      </div>

      {/* ====== ตารางรายการประเภทหวย ====== */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          /* กำลังโหลด */
          <Loading inline text="กำลังโหลดข้อมูล..." />
        ) : types.length === 0 ? (
          /* ไม่มีข้อมูล */
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            ยังไม่มีประเภทหวย — กดปุ่ม &quot;เพิ่มประเภทหวย&quot; เพื่อเริ่มต้น
          </div>
        ) : (
          /* ตาราง admin-table */
          <table className="admin-table">
            <thead>
              <tr>
                <th>ไอคอน</th>
                <th>ชื่อประเภทหวย</th>
                <th>รหัส</th>
                <th>หมวดหมู่</th>
                <th>สถานะ</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {types.map(lt => (
                <tr key={lt.id}>
                  {/* ไอคอน emoji */}
                  <td style={{ fontSize: '20px', width: '60px' }}>{lt.icon}</td>

                  {/* ชื่อประเภทหวย */}
                  <td style={{ fontWeight: 500 }}>{lt.name}</td>

                  {/* รหัส (monospace) */}
                  <td className="mono secondary">{lt.code}</td>

                  {/* หมวดหมู่ */}
                  <td className="secondary">
                    {CATEGORY_OPTIONS.find(c => c.value === lt.category)?.label || lt.category}
                  </td>

                  {/* สถานะ badge */}
                  <td>
                    <span className={`badge ${lt.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                      {lt.status === 'active' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </td>

                  {/* ปุ่มจัดการ — แก้ไข + toggle สถานะ */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {/* ปุ่มแก้ไข */}
                      <button className="btn btn-ghost" onClick={() => openEditModal(lt)}>
                        แก้ไข
                      </button>
                      {/* ปุ่มเปลี่ยนสถานะ */}
                      <button
                        className={`btn ${lt.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => toggleStatus(lt)}
                      >
                        {lt.status === 'active' ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                      </button>
                    </div>
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
            <button onClick={() => setPage(p => p+1)} disabled={types.length < PER_PAGE} className="btn btn-secondary">ถัดไป →</button>
          </div>
        )}
      </div>

      {/* ====================================================================
       * Modal — ฟอร์มสร้าง/แก้ไขประเภทหวย
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
              {editing ? 'แก้ไขประเภทหวย' : 'เพิ่มประเภทหวยใหม่'}
            </h2>

            {/* ====== Form fields ====== */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* ชื่อประเภทหวย */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  ชื่อประเภทหวย
                </label>
                <input
                  className="input"
                  placeholder="เช่น หวยรัฐบาล"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* รหัส (code) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  รหัส (CODE)
                </label>
                <input
                  className="input"
                  placeholder="เช่น GOVT"
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                />
              </div>

              {/* หมวดหมู่ (category dropdown) */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  หมวดหมู่
                </label>
                <select
                  className="input"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ไอคอน Emoji */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  ไอคอน (EMOJI)
                </label>
                <input
                  className="input"
                  placeholder="เช่น 🇹🇭"
                  value={form.icon}
                  onChange={e => setForm({ ...form, icon: e.target.value })}
                />
              </div>

              {/* รายละเอียด */}
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '6px' }}>
                  รายละเอียด
                </label>
                <input
                  className="input"
                  placeholder="คำอธิบายเพิ่มเติม (ไม่บังคับ)"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
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
                disabled={submitting || !form.name.trim() || !form.code.trim()}
              >
                {submitting ? 'กำลังบันทึก...' : editing ? 'บันทึกการแก้ไข' : 'สร้างประเภทหวย'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
