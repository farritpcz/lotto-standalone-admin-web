/**
 * Admin — จัดการสมาชิก (Member Management)
 *
 * Rule: page-level only (state + data + layout) — render delegated to components/members/
 * Related:
 *  - components/members/MemberTable.tsx
 *  - components/members/MemberDetailModal.tsx
 *  - components/members/types.ts
 *  - lib/api/member-mgmt.ts → standalone-admin-api (#5)
 */
'use client'
import { useEffect, useState, useCallback } from 'react'
import { memberMgmtApi } from '@/lib/api'
import MemberTable from '@/components/members/MemberTable'
import MemberDetailModal from '@/components/members/MemberDetailModal'
import type { Member, MemberDetail } from '@/components/members/types'

const PER_PAGE = 20

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

  // ===== โหลดรายการสมาชิก =====
  const loadMembers = useCallback(() => {
    setLoading(true)
    memberMgmtApi
      .list({ page, per_page: PER_PAGE, q: search || undefined })
      .then(res => {
        setMembers(res.data.data?.items || [])
        setTotal(res.data.data?.total || 0)
      })
      .catch(() => setMessage({ type: 'error', text: 'โหลดข้อมูลสมาชิกไม่สำเร็จ' }))
      .finally(() => setLoading(false))
  }, [page, search])

  useEffect(() => {
    loadMembers()
  }, [loadMembers])

  // ===== ซ่อน message หลัง 3 วินาที =====
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(null), 3000)
    return () => clearTimeout(timer)
  }, [message])

  // ===== สลับสถานะ active ↔ suspended =====
  const toggleStatus = async (e: React.MouseEvent, id: number, current: string) => {
    e.stopPropagation() // ไม่ให้ trigger row click
    const newStatus = current === 'active' ? 'suspended' : 'active'
    try {
      await memberMgmtApi.updateStatus(id, newStatus)
      setMessage({
        type: 'success',
        text: `${newStatus === 'active' ? 'เปิดใช้งาน' : 'ระงับ'}สมาชิก #${id} แล้ว`,
      })
      loadMembers()
    } catch {
      setMessage({ type: 'error', text: 'เปลี่ยนสถานะไม่สำเร็จ' })
    }
  }

  // ===== คลิกแถว → โหลด detail + เปิด modal =====
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

  const closeDetailModal = () => {
    setShowDetailModal(false)
    setSelectedMember(null)
  }

  const totalPages = Math.ceil(total / PER_PAGE)

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>จัดการสมาชิก</h1>
          <p className="label" style={{ marginTop: 4 }}>
            ทั้งหมด {total} คน
          </p>
        </div>
      </div>

      {/* Feedback */}
      {message && (
        <div
          className={`badge ${message.type === 'success' ? 'badge-success' : 'badge-error'}`}
          style={{ marginBottom: 16, padding: '8px 16px', fontSize: 13 }}
        >
          {message.text}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="input"
          type="text"
          placeholder="ค้นหา username / เบอร์โทร / อีเมล..."
          value={search}
          onChange={e => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Table */}
      <div className="card-surface" style={{ overflow: 'hidden' }}>
        <MemberTable
          members={members}
          loading={loading}
          search={search}
          page={page}
          totalPages={totalPages}
          onRowClick={openDetailModal}
          onToggleStatus={toggleStatus}
          onPageChange={setPage}
        />
      </div>

      {/* Modal */}
      <MemberDetailModal
        open={showDetailModal}
        loading={detailLoading}
        member={selectedMember}
        onClose={closeDetailModal}
      />
    </div>
  )
}
