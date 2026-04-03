/**
 * Admin — จัดการสมาชิก (Member Management)
 *
 * ฟีเจอร์:
 * - แสดงรายการสมาชิกใน admin-table (พร้อม search + pagination)
 * - สลับสถานะ active/suspended ต่อสมาชิก
 * - คลิกแถวเพื่อดูรายละเอียดสมาชิกใน modal
 *   (ข้อมูลส่วนตัว, ยอดเงิน, ธนาคาร, ผู้แนะนำ, จำนวนเดิมพันล่าสุด)
 *
 * ความสัมพันธ์:
 * - เรียก memberMgmtApi → standalone-admin-api (#5)
 * - provider-backoffice-admin-web (#10) มีหน้าคล้ายกัน (เพิ่ม operator filter)
 *
 * Design System: Linear/Vercel dark theme
 * - ใช้ .page-container, .page-header, .card-surface
 * - ใช้ .admin-table สำหรับตาราง
 * - ใช้ .btn, .btn-primary, .btn-danger, .btn-success สำหรับปุ่ม
 * - ใช้ .input สำหรับ search
 * - ใช้ .badge-* สำหรับ status badges
 */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { memberMgmtApi } from '@/lib/api'
import Loading from '@/components/Loading'
import BankIcon from '@/components/BankIcon'

// =============================================================================
// TYPES — โครงสร้างข้อมูลสมาชิก
// =============================================================================

/** สมาชิก 1 คน — มาจาก list API */
interface Member {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string         // 'active' | 'suspended'
  created_at: string
}

/** รายละเอียดสมาชิก — มาจาก get(id) API (มีข้อมูลเพิ่มเติม) */
interface MemberDetail {
  id: number
  username: string
  phone: string
  email: string
  balance: number
  status: string
  created_at: string
  // ข้อมูลธนาคาร (field names ตรงกับ API response)
  bank_code?: string
  bank_account_number?: string
  bank_account_name?: string
  // ผู้แนะนำ (referral)
  referred_by?: number
  referrer_username?: string
  // สถิติ
  total_bets?: number
  recent_bets_count?: number
}

// =============================================================================
// COMPONENT — MembersPage
// =============================================================================
export default function MembersPage() {
  // ----- State: รายการสมาชิก -----
  const [members, setMembers] = useState<Member[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // ----- State: Modal รายละเอียดสมาชิก -----
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // ----- State: Feedback -----
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  /** จำนวนต่อหน้า */
  const PER_PAGE = 20

  // ===== โหลดรายการสมาชิก =====
  const loadMembers = useCallback(() => {
    setLoading(true)
    memberMgmtApi.list({ page, per_page: PER_PAGE, q: search || undefined })
      .then(res => {
        setMembers(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => setMessage({ type: 'error', text: 'โหลดข้อมูลสมาชิกไม่สำเร็จ' }))
      .finally(() => setLoading(false))
  }, [page, search])

  // ===== โหลดเมื่อ page/search เปลี่ยน =====
  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // ===== สลับสถานะ active ↔ suspended =====
  const toggleStatus = async (e: React.MouseEvent, id: number, current: string) => {
    // หยุด event ไม่ให้ trigger row click (เปิด modal)
    e.stopPropagation()

    const newStatus = current === 'active' ? 'suspended' : 'active'
    try {
      await memberMgmtApi.updateStatus(id, newStatus)
      setMessage({
        type: 'success',
        text: `${newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับ'}สมาชิก #${id} แล้ว`
      })
      loadMembers()  // รีโหลดตาราง
    } catch {
      setMessage({ type: 'error', text: 'เปลี่ยนสถานะไม่สำเร็จ' })
    }
  }

  // ===== คลิกแถว → โหลดรายละเอียด + เปิด modal =====
  const openDetailModal = async (memberId: number) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      const res = await memberMgmtApi.get(memberId)
      setSelectedMember(res.data.data || res.data)
    } catch {
      setMessage({ type: 'error', text: 'โหลดรายละเอียดสมาชิกไม่สำเร็จ' })
      setShowDetailModal(false)
    } finally {
      setDetailLoading(false)
    }
  }

  // ===== ปิด modal =====
  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedMember(null)
  }

  // ===== คำนวณ pagination =====
  const totalPages = Math.ceil(total / PER_PAGE)

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <div className="page-container">
      {/* ===== Page Header ===== */}
      <div className="page-header">
        <div>
          <h1>จัดการสมาชิก</h1>
          <p className="label" style={{ marginTop: 4 }}>
            ทั้งหมด {total} คน
          </p>
        </div>
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

      {/* ===== Search Bar ===== */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          type="text"
          placeholder="ค้นหา username / เบอร์โทร / อีเมล..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* ===== ตารางสมาชิก ===== */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        {loading ? (
          /* Loading state */
          <Loading inline text="กำลังโหลด..." />
        ) : members.length === 0 ? (
          /* Empty state */
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
            {search ? `ไม่พบสมาชิกที่ตรงกับ "${search}"` : 'ยังไม่มีสมาชิก'}
          </div>
        ) : (
          <>
            {/* ตารางข้อมูลสมาชิก */}
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Username</th>
                  <th>เบอร์โทร</th>
                  <th>อีเมล</th>
                  <th style={{ textAlign: 'right' }}>ยอดเงิน</th>
                  <th style={{ textAlign: 'center' }}>สถานะ</th>
                  <th style={{ textAlign: 'center' }}>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => openDetailModal(m.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* ID */}
                    <td className="secondary mono">{m.id}</td>

                    {/* Username — คลิกเปิดหน้ารายละเอียดใน tab ใหม่ */}
                    <td style={{ fontWeight: 500 }}>
                      <a
                        href={`/members/${m.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{
                          color: 'var(--accent-text)',
                          textDecoration: 'none',
                          borderBottom: '1px solid transparent',
                          transition: 'border-color 0.15s ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.borderBottomColor = 'var(--accent-text)')}
                        onMouseLeave={e => (e.currentTarget.style.borderBottomColor = 'transparent')}
                      >
                        {m.username}
                      </a>
                    </td>

                    {/* เบอร์โทร */}
                    <td className="secondary">{m.phone || '—'}</td>

                    {/* อีเมล */}
                    <td className="secondary">{m.email || '—'}</td>

                    {/* ยอดเงิน — monospace, สีเขียว */}
                    <td className="mono" style={{ textAlign: 'right', color: 'var(--accent-text)' }}>
                      ฿{(m.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Badge สถานะ */}
                    <td style={{ textAlign: 'center' }}>
                      <span className={`badge ${m.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {m.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </td>

                    {/* ปุ่มสลับสถานะ */}
                    <td style={{ textAlign: 'center' }}>
                      <button
                        className={`btn ${m.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={(e) => toggleStatus(e, m.id, m.status)}
                      >
                        {m.status === 'active' ? 'ระงับ' : 'เปิดใช้'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* ===== Pagination ===== */}
            {totalPages > 1 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px 16px',
                borderTop: '1px solid var(--border)',
              }}>
                {/* ปุ่มก่อนหน้า */}
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </button>

                {/* แสดงหน้าปัจจุบัน / ทั้งหมด */}
                <span className="label" style={{ padding: '0 8px' }}>
                  หน้า {page} / {totalPages}
                </span>

                {/* ปุ่มถัดไป */}
                <button
                  className="btn btn-secondary"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                >
                  ถัดไป
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* =================================================================
       * MODAL: รายละเอียดสมาชิก
       * position: fixed overlay + centered card
       * เปิดเมื่อคลิกแถวในตาราง
       * ================================================================= */}
      {showDetailModal && (
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
          onClick={closeDetailModal}  // คลิกนอก modal เพื่อปิด
        >
          <div
            className="card-surface"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 24,
              margin: 16,
            }}
            onClick={e => e.stopPropagation()}  // ป้องกันปิดเมื่อคลิกใน modal
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
                รายละเอียดสมาชิก
              </h2>
              <button
                className="btn btn-ghost"
                onClick={closeDetailModal}
                style={{ width: 32, height: 32, padding: 0 }}
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              /* กำลังโหลดรายละเอียด */
              <Loading inline text="กำลังโหลด..." />
            ) : selectedMember ? (
              /* แสดงข้อมูลสมาชิก */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* ===== Section 1: ข้อมูลพื้นฐาน ===== */}
                <div>
                  <p className="label" style={{ marginBottom: 10 }}>ข้อมูลพื้นฐาน</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px 16px',
                  }}>
                    {/* Username */}
                    <DetailField label="Username" value={selectedMember.username} />
                    {/* สถานะ */}
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
                        สถานะ
                      </span>
                      <span className={`badge ${selectedMember.status === 'active' ? 'badge-success' : 'badge-error'}`}>
                        {selectedMember.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                      </span>
                    </div>
                    {/* เบอร์โทร */}
                    <DetailField label="เบอร์โทร" value={selectedMember.phone || '—'} />
                    {/* อีเมล */}
                    <DetailField label="อีเมล" value={selectedMember.email || '—'} />
                    {/* วันสมัคร */}
                    <DetailField
                      label="วันที่สมัคร"
                      value={
                        selectedMember.created_at
                          ? new Date(selectedMember.created_at).toLocaleDateString('th-TH', {
                              year: 'numeric', month: 'short', day: 'numeric',
                            })
                          : '—'
                      }
                    />
                  </div>
                </div>

                {/* ===== Section 2: ยอดเงิน ===== */}
                <div style={{
                  background: 'var(--bg-elevated)',
                  borderRadius: 8,
                  padding: 16,
                  textAlign: 'center',
                }}>
                  <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                    ยอดเงินคงเหลือ
                  </span>
                  <span className="metric" style={{ color: 'var(--accent-text)' }}>
                    ฿{(selectedMember.balance || 0).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                {/* ===== Section 3: ข้อมูลธนาคาร ===== */}
                <div>
                  <p className="label" style={{ marginBottom: 10 }}>ข้อมูลธนาคาร</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px 16px',
                  }}>
                    {/* ไอคอนธนาคาร + bank_code */}
                    <div>
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>ธนาคาร</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-primary)' }}>
                        {selectedMember.bank_code && <BankIcon code={selectedMember.bank_code} size={24} />}
                        {selectedMember.bank_code || '—'}
                      </span>
                    </div>
                    <DetailField label="เลขบัญชี" value={selectedMember.bank_account_number || '—'} mono />
                    <DetailField label="ชื่อบัญชี" value={selectedMember.bank_account_name || '—'} />
                  </div>
                </div>

                {/* ===== Section 4: ผู้แนะนำ (Referral) ===== */}
                <div>
                  <p className="label" style={{ marginBottom: 10 }}>ผู้แนะนำ</p>
                  <DetailField
                    label="แนะนำโดย"
                    value={
                      selectedMember.referrer_username
                        ? `${selectedMember.referrer_username} (#${selectedMember.referred_by})`
                        : '— ไม่มีผู้แนะนำ —'
                    }
                  />
                </div>

                {/* ===== Section 5: สถิติการเดิมพัน ===== */}
                <div>
                  <p className="label" style={{ marginBottom: 10 }}>สถิติ</p>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '10px 16px',
                  }}>
                    <DetailField
                      label="เดิมพันล่าสุด"
                      value={
                        selectedMember.recent_bets_count !== undefined
                          ? `${selectedMember.recent_bets_count} รายการ`
                          : '—'
                      }
                    />
                    <DetailField
                      label="เดิมพันทั้งหมด"
                      value={
                        selectedMember.total_bets !== undefined
                          ? `${selectedMember.total_bets} รายการ`
                          : '—'
                      }
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* ===== Modal Footer — ปุ่มปิด ===== */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HELPER COMPONENT — DetailField (แสดงคู่ label + value ใน modal)
// =============================================================================

/**
 * แสดง label + value ใน modal รายละเอียดสมาชิก
 * @param label - ชื่อ field (สีจาง)
 * @param value - ค่าที่แสดง (สีหลัก)
 * @param mono - ใช้ monospace font (สำหรับตัวเลข/เลขบัญชี)
 */
function DetailField({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 2 }}>
        {label}
      </span>
      <span style={{
        fontSize: 13,
        color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  )
}
