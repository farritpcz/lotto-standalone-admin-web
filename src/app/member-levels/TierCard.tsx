/**
 * TierCard — card แสดงระดับสมาชิก 1 ระดับใน ladder
 * Props: level (MemberLevel) + onEdit + onDelete callbacks
 */
import { Pencil, Trash2, Users } from 'lucide-react'
import type { MemberLevel } from '@/lib/api'

export default function TierCard({ level, onEdit, onDelete }: {
  level: MemberLevel
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div
      className="card-surface"
      style={{
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        borderLeft: `4px solid ${level.color}`,
      }}
    >
      {/* Badge */}
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: level.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, color: '#000', fontSize: 22,
        boxShadow: `0 4px 16px ${level.color}55`,
        flexShrink: 0,
      }}>
        {level.name[0]}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
          marginBottom: 4,
        }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: level.color }}>
            {level.name}
          </span>
          <span className={`badge ${level.status === 'active' ? 'badge-success' : 'badge-error'}`}>
            {level.status === 'active' ? 'เปิดใช้' : 'ปิด'}
          </span>
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          ฝากสะสม 30 วัน ≥ <strong style={{ color: 'var(--text-primary)' }}>
            ฿{level.min_deposit_30d.toLocaleString('th-TH')}
          </strong>
        </div>
        {level.description && (
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            {level.description}
          </div>
        )}
      </div>

      {/* Member count */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-end', gap: 4,
        minWidth: 80,
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
        }}>
          <Users size={12} /> สมาชิก
        </span>
        <span className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
          {level.member_count.toLocaleString('th-TH')}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={onEdit} className="btn btn-ghost" style={{ width: 36, height: 36, padding: 0 }} title="แก้ไข">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="btn btn-danger" style={{ width: 36, height: 36, padding: 0 }} title="ลบ">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}
