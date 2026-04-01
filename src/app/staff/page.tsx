/**
 * Admin — ระบบพนักงาน (Admin Staff Management)
 *
 * ฟีเจอร์:
 * - แสดงรายการ admin users ใน admin-table (ID, username, name, role, status, last_login)
 * - เพิ่มพนักงานใหม่ (modal form: username, password, name, role)
 * - แก้ไขพนักงาน (เปลี่ยนชื่อ, role)
 * - สลับสถานะ active/suspended
 *
 * ความสัมพันธ์:
 * - เรียก API → GET /api/v1/admins (ถ้ามี)
 * - ถ้า API ยังไม่มี → ใช้ mock data
 *
 * Design System: Linear/Vercel dark theme
 * - .page-container, .page-header, .card-surface
 * - .admin-table, .btn-*, .input, .label, .badge-*
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

// =============================================================================
// TYPES — โครงสร้างข้อมูลพนักงาน
// =============================================================================

/** พนักงาน (admin user) */
interface Staff {
  id: number
  username: string
  name: string
  role: 'admin' | 'superadmin'
  status: 'active' | 'suspended'
  last_login: string | null
  created_at: string
}

/** ฟอร์มเพิ่ม/แก้ไขพนักงาน */
interface StaffForm {
  username: string
  password: string
  name: string
  role: 'admin' | 'superadmin'
}

// =============================================================================
// MOCK DATA — ใช้เมื่อ API ยังไม่พร้อม
// =============================================================================
const MOCK_STAFF: Staff[] = [
  { id: 1, username: 'superadmin', name: 'Super Admin', role: 'superadmin', status: 'active', last_login: '2026-04-01T10:30:00Z', created_at: '2026-01-01T00:00:00Z' },
  { id: 2, username: 'admin01', name: 'สมชาย จัดการดี', role: 'admin', status: 'active', last_login: '2026-03-31T15:45:00Z', created_at: '2026-01-15T00:00:00Z' },
  { id: 3, username: 'admin02', name: 'สมหญิง ดูแลเงิน', role: 'admin', status: 'active', last_login: '2026-03-30T09:20:00Z', created_at: '2026-02-01T00:00:00Z' },
  { id: 4, username: 'admin03', name: 'วิชัย ตรวจสอบ', role: 'admin', status: 'suspended', last_login: '2026-02-15T14:00:00Z', created_at: '2026-02-10T00:00:00Z' },
  { id: 5, username: 'admin04', name: 'นภา รายงาน', role: 'admin', status: 'active', last_login: null, created_at: '2026-03-20T00:00:00Z' },
]

// =============================================================================
// COMPONENT — StaffPage
// =============================================================================
export default function StaffPage() {
  // ----- State: รายการพนักงาน -----
  const [staffList, setStaffList] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // ----- State: Modal เพิ่ม/แก้ไข -----
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null) // null = เพิ่มใหม่
  const [form, setForm] = useState<StaffForm>({
    username: '', password: '', name: '', role: 'admin',
  })
  const [formSaving, setFormSaving] = useState(false)

  // ----- State: Confirm dialog + Feedback -----
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ===== โหลดข้อมูลเริ่มต้น =====
  useEffect(() => { loadStaff() }, [])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  /**
   * โหลดรายการพนักงานจาก API
   * fallback → mock data ถ้า API ยังไม่มี
   */
  const loadStaff = async () => {
    setLoading(true)
    try {
      const res = await api.get('/admins')
      setStaffList(res.data.data?.items || res.data.data || [])
    } catch {
      // API ยังไม่มี → ใช้ mock
      setStaffList(MOCK_STAFF)
    } finally {
      setLoading(false)
    }
  }

  /** กรอง staff ตาม search keyword */
  const filteredStaff = staffList.filter(s =>
    s.username.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  /**
   * เปิด modal เพิ่มพนักงานใหม่
   */
  const openAddModal = () => {
    setEditingId(null)
    setForm({ username: '', password: '', name: '', role: 'admin' })
    setShowModal(true)
  }

  /**
   * เปิด modal แก้ไขพนักงาน
   * ไม่แสดง password field ตอนแก้ไข (ส่งเฉพาะ name, role)
   */
  const openEditModal = (staff: Staff) => {
    setEditingId(staff.id)
    setForm({ username: staff.username, password: '', name: staff.name, role: staff.role })
    setShowModal(true)
  }

  /**
   * บันทึกพนักงาน (เพิ่มใหม่ หรือ แก้ไข)
   */
  const handleSaveStaff = async () => {
    // Validate
    if (!editingId && (!form.username || !form.password)) {
      setMessage({ type: 'error', text: 'กรุณากรอก username และ password' })
      return
    }
    if (!form.name) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อ' })
      return
    }

    setFormSaving(true)
    try {
      if (editingId) {
        await api.put(`/admins/${editingId}`, { name: form.name, role: form.role })
      } else {
        await api.post('/admins', form)
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขพนักงานสำเร็จ' : 'เพิ่มพนักงานสำเร็จ' })
      setShowModal(false)
      loadStaff()
    } catch {
      // mock: จัดการใน state ตรงๆ
      if (editingId) {
        setStaffList(prev => prev.map(s =>
          s.id === editingId ? { ...s, name: form.name, role: form.role } : s
        ))
      } else {
        const newStaff: Staff = {
          id: Date.now(),
          username: form.username,
          name: form.name,
          role: form.role,
          status: 'active',
          last_login: null,
          created_at: new Date().toISOString(),
        }
        setStaffList(prev => [...prev, newStaff])
      }
      setMessage({ type: 'success', text: editingId ? 'แก้ไขพนักงานสำเร็จ (mock)' : 'เพิ่มพนักงานสำเร็จ (mock)' })
      setShowModal(false)
    } finally {
      setFormSaving(false)
    }
  }

  /**
   * สลับสถานะ active ↔ suspended
   * ไม่อนุญาตให้ suspend superadmin คนสุดท้าย
   */
  const handleToggleStatus = (staff: Staff) => {
    const newStatus = staff.status === 'active' ? 'suspended' : 'active'
    const action = newStatus === 'suspended' ? 'ระงับ' : 'เปิดใช้งาน'

    // ป้องกัน suspend superadmin คนสุดท้าย
    if (newStatus === 'suspended' && staff.role === 'superadmin') {
      const activeSuperadmins = staffList.filter(s => s.role === 'superadmin' && s.status === 'active')
      if (activeSuperadmins.length <= 1) {
        setMessage({ type: 'error', text: 'ไม่สามารถระงับ superadmin คนสุดท้ายได้' })
        return
      }
    }

    setConfirmDialog({
      title: `${action}พนักงาน`,
      message: `ยืนยัน${action} "${staff.name}" (${staff.username})?`,
      type: newStatus === 'suspended' ? 'danger' : 'info',
      confirmLabel: action,
      onConfirm: async () => {
        setConfirmDialog(null)
        try {
          await api.put(`/admins/${staff.id}/status`, { status: newStatus })
          loadStaff()
        } catch {
          // mock: อัพเดท state
          setStaffList(prev => prev.map(s =>
            s.id === staff.id ? { ...s, status: newStatus as 'active' | 'suspended' } : s
          ))
        }
        setMessage({ type: 'success', text: `${action}พนักงานสำเร็จ` })
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  /** helper: format วันที่ + เวลา */
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    try {
      return new Date(dateStr).toLocaleString('th-TH', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    } catch { return dateStr }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>พนักงาน (Admin Staff)</h1>
        <button className="btn btn-primary" onClick={openAddModal}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
            style={{ width: 14, height: 14 }}>
            <path d="M12 5v14m-7-7h14" />
          </svg>
          เพิ่มพนักงาน
        </button>
      </div>

      {/* ── Feedback Message ─────────────────────────────────────────────── */}
      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      {/* ── Search bar ───────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text" className="input" placeholder="ค้นหาพนักงาน (username, ชื่อ)..."
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 360 }}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         ตารางพนักงาน
         ══════════════════════════════════════════════════════════════════ */}
      <div className="card-surface" style={{ overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            กำลังโหลด...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            {search ? 'ไม่พบพนักงานที่ค้นหา' : 'ยังไม่มีพนักงาน'}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>USERNAME</th>
                <th>ชื่อ</th>
                <th>ROLE</th>
                <th>สถานะ</th>
                <th>เข้าสู่ระบบล่าสุด</th>
                <th style={{ textAlign: 'right' }}>จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map(staff => (
                <tr key={staff.id}>
                  {/* ID */}
                  <td className="mono" style={{ color: 'var(--text-secondary)', width: 60 }}>
                    #{staff.id}
                  </td>
                  {/* Username */}
                  <td className="mono" style={{ fontWeight: 500 }}>
                    {staff.username}
                  </td>
                  {/* ชื่อ */}
                  <td>{staff.name}</td>
                  {/* Role — badge สีต่างกัน */}
                  <td>
                    <span className={`badge ${staff.role === 'superadmin' ? 'badge-warning' : 'badge-info'}`}>
                      {staff.role === 'superadmin' ? 'Super Admin' : 'Admin'}
                    </span>
                  </td>
                  {/* สถานะ */}
                  <td>
                    <span className={`badge ${staff.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                      {staff.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                    </span>
                  </td>
                  {/* เข้าสู่ระบบล่าสุด */}
                  <td className="secondary" style={{ fontSize: 12 }}>
                    {formatDate(staff.last_login)}
                  </td>
                  {/* จัดการ */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button className="btn btn-ghost" onClick={() => openEditModal(staff)}
                        style={{ height: 28, padding: '0 8px', fontSize: 12 }}>
                        แก้ไข
                      </button>
                      <button
                        className={`btn ${staff.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggleStatus(staff)}
                        style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                      >
                        {staff.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── สรุปจำนวน ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 16, fontSize: 12, color: 'var(--text-secondary)',
      }}>
        <span>ทั้งหมด {staffList.length} คน</span>
        <span>ใช้งาน {staffList.filter(s => s.status === 'active').length} คน</span>
        <span>ระงับ {staffList.filter(s => s.status === 'suspended').length} คน</span>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         MODAL: เพิ่ม/แก้ไขพนักงาน
         ══════════════════════════════════════════════════════════════════ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.15s ease',
        }}>
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '24px', maxWidth: 420, width: '100%',
            animation: 'fadeSlideUp 0.2s ease',
          }}>
            {/* Modal header */}
            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--text-primary)' }}>
              {editingId ? 'แก้ไขพนักงาน' : 'เพิ่มพนักงานใหม่'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Username — disabled ตอนแก้ไข */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Username</div>
                <input
                  type="text" className="input" placeholder="เช่น admin05"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  disabled={!!editingId}
                  style={editingId ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                />
              </div>

              {/* Password — แสดงเฉพาะเพิ่มใหม่ */}
              {!editingId && (
                <div>
                  <div className="label" style={{ marginBottom: 6 }}>Password</div>
                  <input
                    type="password" className="input" placeholder="รหัสผ่าน"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  />
                </div>
              )}

              {/* ชื่อ */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>ชื่อ-นามสกุล</div>
                <input
                  type="text" className="input" placeholder="เช่น สมชาย จัดการดี"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>

              {/* Role dropdown */}
              <div>
                <div className="label" style={{ marginBottom: 6 }}>Role (บทบาท)</div>
                <select
                  className="input"
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value as 'admin' | 'superadmin' }))}
                >
                  <option value="admin">Admin — จัดการทั่วไป</option>
                  <option value="superadmin">Super Admin — จัดการทุกอย่าง</option>
                </select>
              </div>
            </div>

            {/* ── Modal buttons ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }}
                onClick={() => setShowModal(false)}>
                ยกเลิก
              </button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38, fontWeight: 600 }}
                onClick={handleSaveStaff} disabled={formSaving}>
                {formSaving ? 'กำลังบันทึก...' : (editingId ? 'บันทึกการแก้ไข' : 'เพิ่มพนักงาน')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm Dialog ───────────────────────────────────────────── */}
      {confirmDialog && <ConfirmDialog {...confirmDialog} />}
    </div>
  )
}
