/**
 * MemberTable — ตารางสมาชิก + pagination
 *
 * Rule: render only (ไม่มี data fetching); ได้รับ props จาก page
 * Related: app/members/page.tsx, members/types.ts
 */
'use client'
import Loading from '@/components/Loading'
import type { Member } from './types'

interface Props {
  members: Member[]
  loading: boolean
  search: string
  page: number
  totalPages: number
  onRowClick: (id: number) => void
  onToggleStatus: (e: React.MouseEvent, id: number, current: string) => void
  onPageChange: (next: number) => void
}

export default function MemberTable({
  members,
  loading,
  search,
  page,
  totalPages,
  onRowClick,
  onToggleStatus,
  onPageChange,
}: Props) {
  // ===== Loading =====
  if (loading) return <Loading inline text="กำลังโหลด..." />

  // ===== Empty =====
  if (members.length === 0) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
        {search ? `ไม่พบสมาชิกที่ตรงกับ "${search}"` : 'ยังไม่มีสมาชิก'}
      </div>
    )
  }

  return (
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
            <tr key={m.id} onClick={() => onRowClick(m.id)} style={{ cursor: 'pointer' }}>
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
                  onClick={e => onToggleStatus(e, m.id, m.status)}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '12px 16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            ก่อนหน้า
          </button>

          <span className="label" style={{ padding: '0 8px' }}>
            หน้า {page} / {totalPages}
          </span>

          <button
            className="btn btn-secondary"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            ถัดไป
          </button>
        </div>
      )}
    </>
  )
}
