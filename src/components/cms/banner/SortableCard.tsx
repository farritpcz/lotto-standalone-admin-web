// Component: SortableCard — dnd-kit sortable banner tile (16:5 preview + controls)
// Parent: src/components/cms/BannerManager.tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Pencil, Trash2, Eye, EyeOff, Link as LinkIcon } from 'lucide-react'
import { resolveImageUrl } from '@/lib/imageUrl'
import type { Banner } from './types'

interface Props {
  banner: Banner
  index: number
  onEdit: () => void
  onDelete: () => void
  onToggle: () => void
}

export default function SortableCard({ banner, index, onEdit, onDelete, onToggle }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: banner.id })
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: isDragging ? 'var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.4))' : 'none',
        transition: (style.transition || '') + ', box-shadow 0.2s, border-color 0.2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-subtle-border, rgba(0,229,160,0.3))' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {/* ─── Preview 16:5 ─── */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '16 / 5',
        background: 'var(--bg-elevated)',
        overflow: 'hidden',
      }}>
        {banner.image_url ? (
          // ใช้ <img> ธรรมดาเพราะ R2 URL เป็น dynamic domain
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(banner.image_url)}
            alt={banner.title || `Banner ${banner.sort_order}`}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.2' }}
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)', fontSize: 11,
          }}>ไม่มีรูป</div>
        )}

        {/* Gradient overlay สำหรับ badge/controls */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.3) 100%)',
          pointerEvents: 'none',
        }} />

        {/* Order badge */}
        <div style={{
          position: 'absolute', top: 10, left: 10,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          padding: '4px 10px', borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          #{index + 1}
        </div>

        {/* Status badge (คลิกได้) */}
        <button
          onClick={onToggle}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: banner.is_active
              ? 'linear-gradient(135deg, rgba(0,229,160,0.9), rgba(6,182,212,0.9))'
              : 'rgba(80,80,80,0.8)',
            backdropFilter: 'blur(8px)',
            color: '#fff', fontSize: 10, fontWeight: 600,
            padding: '4px 10px', borderRadius: 999,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
          title={banner.is_active ? 'คลิกเพื่อซ่อน' : 'คลิกเพื่อแสดง'}
        >
          {banner.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
          {banner.is_active ? 'แสดง' : 'ซ่อน'}
        </button>

        {/* Drag handle (ล่างซ้าย) */}
        <div
          {...attributes}
          {...listeners}
          style={{
            position: 'absolute', bottom: 10, left: 10,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
            color: '#fff', padding: 6, borderRadius: 8,
            cursor: 'grab', display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 500,
          }}
          title="ลากเพื่อเรียงลำดับ"
        >
          <GripVertical size={12} />
        </div>
      </div>

      {/* ─── Body ─── */}
      <div style={{ padding: 14 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>
          {banner.title || `แบนเนอร์ #${banner.sort_order}`}
        </div>
        <div style={{
          fontSize: 11, color: 'var(--text-tertiary)',
          display: 'flex', alignItems: 'center', gap: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 12,
        }}>
          {banner.link_url ? (
            <>
              <LinkIcon size={10} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{banner.link_url}</span>
            </>
          ) : (
            <span style={{ fontStyle: 'italic' }}>ไม่มีลิงก์</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onEdit}
            style={{ flex: 1, height: 30, fontSize: 12 }}>
            <Pencil size={12} /> แก้ไข
          </button>
          <button className="btn btn-danger" onClick={onDelete}
            style={{ width: 38, height: 30, padding: 0 }} title="ลบ">
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}
