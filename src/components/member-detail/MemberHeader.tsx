// Component: MemberHeader — page header (username, ID, status badge, join date, back button)
// Parent: src/app/members/[id]/page.tsx

'use client'

import { MemberDetail, fmtDate } from './types'

interface Props {
  member: MemberDetail
}

export default function MemberHeader({ member }: Props) {
  return (
    <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* ปุ่มกลับ */}
        <button
          className="btn btn-ghost"
          onClick={() => window.close()}
          title="ปิดแท็บ"
          style={{ width: 32, height: 32, padding: 0, fontSize: 16 }}
        >
          &larr;
        </button>

        <div>
          {/* Username + ID */}
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            {member.username}
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 400 }}>
              #{member.id}
            </span>
            {/* Status badge */}
            <span className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`}>
              {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
            </span>
          </h1>

          {/* วันที่สมัคร */}
          <p className="label" style={{ marginTop: 4, fontSize: 12 }}>
            สมัครเมื่อ {fmtDate(member.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
