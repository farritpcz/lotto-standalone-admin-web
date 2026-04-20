/**
 * MemberDetailModal — modal รายละเอียดสมาชิก
 *
 * Rule: overlay fixed, ปิดเมื่อคลิกนอก card
 * Related: app/members/page.tsx, members/types.ts
 */
'use client'
import Loading from '@/components/Loading'
import BankIcon from '@/components/BankIcon'
import type { MemberDetail } from './types'

interface Props {
  open: boolean
  loading: boolean
  member: MemberDetail | null
  onClose: () => void
}

export default function MemberDetailModal({ open, loading, member, onClose }: Props) {
  if (!open) return null

  return (
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
      onClick={onClose}
    >
      <div
        className="card-surface"
        style={{ width: '100%', maxWidth: 520, padding: 24, margin: 16 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>
            รายละเอียดสมาชิก
          </h2>
          <button
            className="btn btn-ghost"
            onClick={onClose}
            style={{ width: 32, height: 32, padding: 0 }}
          >
            ✕
          </button>
        </div>

        {loading ? (
          <Loading inline text="กำลังโหลด..." />
        ) : member ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* ===== Section 1: ข้อมูลพื้นฐาน ===== */}
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                ข้อมูลพื้นฐาน
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                <DetailField label="Username" value={member.username} />
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    สถานะ
                  </span>
                  <span
                    className={`badge ${member.status === 'active' ? 'badge-success' : 'badge-error'}`}
                  >
                    {member.status === 'active' ? 'ใช้งาน' : 'ระงับ'}
                  </span>
                </div>
                <DetailField label="เบอร์โทร" value={member.phone || '—'} />
                <DetailField label="อีเมล" value={member.email || '—'} />
                <DetailField
                  label="วันที่สมัคร"
                  value={
                    member.created_at
                      ? new Date(member.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'
                  }
                />
              </div>
            </div>

            {/* ===== Section 2: ยอดเงิน ===== */}
            <div
              style={{
                background: 'var(--bg-elevated)',
                borderRadius: 8,
                padding: 16,
                textAlign: 'center',
              }}
            >
              <span className="label" style={{ display: 'block', marginBottom: 4 }}>
                ยอดเงินคงเหลือ
              </span>
              <span className="metric" style={{ color: 'var(--accent-text)' }}>
                ฿
                {(member.balance || 0).toLocaleString('th-TH', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            {/* ===== Section 3: ข้อมูลธนาคาร ===== */}
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                ข้อมูลธนาคาร
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: 'var(--text-tertiary)',
                      display: 'block',
                      marginBottom: 2,
                    }}
                  >
                    ธนาคาร
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: 'var(--text-primary)',
                    }}
                  >
                    {member.bank_code && <BankIcon code={member.bank_code} size={24} />}
                    {member.bank_code || '—'}
                  </span>
                </div>
                <DetailField label="เลขบัญชี" value={member.bank_account_number || '—'} mono />
                <DetailField label="ชื่อบัญชี" value={member.bank_account_name || '—'} />
              </div>
            </div>

            {/* ===== Section 4: ผู้แนะนำ ===== */}
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                ผู้แนะนำ
              </p>
              <DetailField
                label="แนะนำโดย"
                value={
                  member.referrer_username
                    ? `${member.referrer_username} (#${member.referred_by})`
                    : '— ไม่มีผู้แนะนำ —'
                }
              />
            </div>

            {/* ===== Section 5: สถิติ ===== */}
            <div>
              <p className="label" style={{ marginBottom: 10 }}>
                สถิติ
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
                <DetailField
                  label="เดิมพันล่าสุด"
                  value={
                    member.recent_bets_count !== undefined
                      ? `${member.recent_bets_count} รายการ`
                      : '—'
                  }
                />
                <DetailField
                  label="เดิมพันทั้งหมด"
                  value={member.total_bets !== undefined ? `${member.total_bets} รายการ` : '—'}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Modal Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            ปิด
          </button>
        </div>
      </div>
    </div>
  )
}

/** แสดง label + value (ใช้ใน modal) */
function DetailField({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div>
      <span
        style={{
          fontSize: 11,
          color: 'var(--text-tertiary)',
          display: 'block',
          marginBottom: 2,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  )
}
