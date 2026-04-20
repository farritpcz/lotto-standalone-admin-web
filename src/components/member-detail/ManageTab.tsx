// Component: ManageTab — manage tab (edit profile, reset password, toggle status)
// Parent: src/app/members/[id]/page.tsx

'use client'

import { MemberDetail } from './types'

interface Props {
  member: MemberDetail
  editPhone: string
  editEmail: string
  newPassword: string
  editLoading: boolean
  setEditPhone: (v: string) => void
  setEditEmail: (v: string) => void
  setNewPassword: (v: string) => void
  onSaveProfile: () => void
  onResetPassword: () => void
  onToggleStatus: () => void
}

export default function ManageTab({
  member,
  editPhone,
  editEmail,
  newPassword,
  editLoading,
  setEditPhone,
  setEditEmail,
  setNewPassword,
  onSaveProfile,
  onResetPassword,
  onToggleStatus,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeIn 0.2s ease' }}>
      {/* ----- แก้ไขข้อมูล: phone + email ----- */}
      <div className="card-surface" style={{ padding: 24 }}>
        <p className="label" style={{ marginBottom: 16 }}>แก้ไขข้อมูลส่วนตัว</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              เบอร์โทร
            </label>
            <input
              className="input"
              type="text"
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
              placeholder="0812345678"
            />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              อีเมล
            </label>
            <input
              className="input"
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" onClick={onSaveProfile} disabled={editLoading}>
            {editLoading ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* ----- รีเซ็ตรหัสผ่าน ----- */}
      <div className="card-surface" style={{ padding: 24 }}>
        <p className="label" style={{ marginBottom: 16 }}>รีเซ็ตรหัสผ่าน</p>
        <div style={{ maxWidth: 360 }}>
          <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
            รหัสผ่านใหม่
          </label>
          <input
            className="input"
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)"
          />
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            className="btn btn-primary"
            onClick={onResetPassword}
            disabled={editLoading || !newPassword}
          >
            {editLoading ? 'กำลังรีเซ็ต...' : 'รีเซ็ตรหัสผ่าน'}
          </button>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 8 }}>
          * API อาจยังไม่รองรับฟีเจอร์นี้
        </p>
      </div>

      {/* ----- สลับสถานะ: active ↔ suspended ----- */}
      <div className="card-surface" style={{ padding: 24 }}>
        <p className="label" style={{ marginBottom: 16 }}>สถานะสมาชิก</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>สถานะปัจจุบัน:</span>
          <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`}>
            {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
          </span>
          <button
            className={`btn ${member.status === 'active' ? 'btn-danger' : 'btn-success'}`}
            onClick={onToggleStatus}
          >
            {member.status === 'active' ? 'ระงับสมาชิก' : 'เปิดใช้งาน'}
          </button>
        </div>
      </div>
    </div>
  )
}
