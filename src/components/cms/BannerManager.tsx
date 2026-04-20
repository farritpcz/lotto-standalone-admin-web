/**
 * BannerManager — Card grid + drag-drop reorder + modal with live preview
 *
 * Features:
 * - Card grid (responsive, 16:5 aspect) แทน table เดิม
 * - Drag & drop เรียงลำดับด้วย @dnd-kit (ออโต้ save reorder API)
 * - Toggle active inline (คลิกที่ badge ก็เปลี่ยนสถานะเลย)
 * - Modal: ImageUpload + live preview 16:5 + title/link/active
 * - Stats bar (ทั้งหมด / แสดง / ซ่อน)
 *
 * ⭐ Design ตาม Aurora Dark palette — ใช้ CSS vars (--accent, --bg-surface, ...)
 */
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { api } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUrl'
import ImageUpload from '@/components/ImageUpload'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, GripVertical, Pencil, Trash2, Eye, EyeOff, Link as LinkIcon, ExternalLink } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ───────────────────────────── Types ─────────────────────────────
export interface Banner {
  id: number
  title?: string
  image_url: string
  link_url: string
  sort_order: number
  is_active: boolean
  status?: string
}

interface BannerForm {
  title: string
  image_url: string
  link_url: string
  is_active: boolean
}

interface Props {
  banners: Banner[]
  onChange: () => void | Promise<void>  // reload parent
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

// ═══════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════
export default function BannerManager({ banners, onChange, onMessage }: Props) {
  const [items, setItems] = useState<Banner[]>(banners)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<BannerForm>({ title: '', image_url: '', link_url: '', is_active: true })
  const [confirm, setConfirm] = useState<ConfirmDialogProps | null>(null)
  const [saving, setSaving] = useState(false)

  // sync props → local state เมื่อ parent reload
  useEffect(() => {
    setItems([...banners].sort((a, b) => a.sort_order - b.sort_order))
  }, [banners])

  // ───── DnD sensors ─────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),  // กันคลิกแล้วลาก
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(b => b.id === active.id)
    const newIdx = items.findIndex(b => b.id === over.id)
    const next = arrayMove(items, oldIdx, newIdx).map((b, i) => ({ ...b, sort_order: i + 1 }))
    setItems(next)  // optimistic
    try {
      await api.put('/cms/banners/reorder', {
        orders: next.map(b => ({ id: b.id, sort_order: b.sort_order })),
      })
      onMessage({ type: 'success', text: 'จัดลำดับสำเร็จ' })
    } catch {
      onMessage({ type: 'error', text: 'จัดลำดับไม่สำเร็จ' })
      setItems(banners)
    }
  }

  // ───── Modal open/save ─────
  const openAdd = () => {
    setEditingId(null)
    setForm({ title: '', image_url: '', link_url: '', is_active: true })
    setShowModal(true)
  }
  const openEdit = (b: Banner) => {
    setEditingId(b.id)
    setForm({ title: b.title || '', image_url: b.image_url, link_url: b.link_url, is_active: b.is_active })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.image_url) {
      onMessage({ type: 'error', text: 'กรุณาอัพโหลดรูปภาพ' })
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, status: form.is_active ? 'active' : 'inactive' }
      if (editingId) await api.put(`/cms/banners/${editingId}`, payload)
      else await api.post('/cms/banners', payload)
      onMessage({ type: 'success', text: editingId ? 'บันทึกแบนเนอร์สำเร็จ' : 'เพิ่มแบนเนอร์สำเร็จ' })
      setShowModal(false)
      await onChange()
    } catch {
      onMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (b: Banner) => {
    setConfirm({
      title: 'ลบแบนเนอร์',
      message: `ยืนยันลบ "${b.title || `แบนเนอร์ #${b.sort_order}`}"?`,
      type: 'danger', confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirm(null)
        try {
          await api.delete(`/cms/banners/${b.id}`)
          onMessage({ type: 'success', text: 'ลบแบนเนอร์สำเร็จ' })
          await onChange()
        } catch {
          onMessage({ type: 'error', text: 'ลบไม่สำเร็จ' })
        }
      },
      onCancel: () => setConfirm(null),
    })
  }

  const handleToggleActive = async (b: Banner) => {
    try {
      await api.put(`/cms/banners/${b.id}`, { status: b.is_active ? 'inactive' : 'active' })
      setItems(prev => prev.map(x => x.id === b.id ? { ...x, is_active: !x.is_active } : x))
      onMessage({ type: 'success', text: b.is_active ? 'ซ่อนแบนเนอร์' : 'แสดงแบนเนอร์' })
    } catch {
      onMessage({ type: 'error', text: 'อัพเดทสถานะไม่สำเร็จ' })
    }
  }

  // ───── Stats ─────
  const total = items.length
  const activeCount = items.filter(b => b.is_active).length
  const inactiveCount = total - activeCount

  return (
    <div>
      {/* ─── Stats bar ─── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: 12, marginBottom: 16,
      }}>
        <StatPill label="แบนเนอร์ทั้งหมด" value={total} color="var(--text-primary)" />
        <StatPill label="กำลังแสดง" value={activeCount} color="var(--accent)" dot />
        <StatPill label="ซ่อนอยู่" value={inactiveCount} color="var(--text-tertiary)" />
      </div>

      {/* ─── Header + Add ─── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 16,
      }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            รายการแบนเนอร์
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
            ลากการ์ดเพื่อเรียงลำดับ · คลิกที่สถานะเพื่อเปิด/ปิด
          </div>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ height: 34, fontSize: 12 }}>
          <Plus size={14} strokeWidth={2.2} /> เพิ่มแบนเนอร์
        </button>
      </div>

      {/* ─── Banner grid / Empty ─── */}
      {items.length === 0 ? (
        <div style={{
          padding: 60, textAlign: 'center', borderRadius: 14,
          border: '2px dashed var(--border)', background: 'var(--bg-elevated)',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-subtle)',
            margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ExternalLink size={24} color="var(--accent)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>ยังไม่มีแบนเนอร์</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16 }}>
            เพิ่มแบนเนอร์แรกเพื่อแสดงบนหน้าแรกของสมาชิก
          </div>
          <button className="btn btn-primary" onClick={openAdd} style={{ height: 34, fontSize: 12 }}>
            <Plus size={14} /> เพิ่มแบนเนอร์แรก
          </button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(b => b.id)} strategy={rectSortingStrategy}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}>
              {items.map((b, idx) => (
                <SortableCard
                  key={b.id}
                  banner={b}
                  index={idx}
                  onEdit={() => openEdit(b)}
                  onDelete={() => handleDelete(b)}
                  onToggle={() => handleToggleActive(b)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* ─── Modal ─── */}
      {showModal && (
        <BannerModal
          editing={!!editingId}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}
      {confirm && <ConfirmDialog {...confirm} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Sortable Card — banner tile with 16:5 preview
// ═══════════════════════════════════════════════════════════════════
function SortableCard({
  banner, index, onEdit, onDelete, onToggle,
}: {
  banner: Banner; index: number
  onEdit: () => void; onDelete: () => void; onToggle: () => void
}) {
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

// ═══════════════════════════════════════════════════════════════════
// Modal — add/edit with live preview
// ═══════════════════════════════════════════════════════════════════
function BannerModal({
  editing, form, setForm, saving, onSave, onClose,
}: {
  editing: boolean
  form: BannerForm
  setForm: React.Dispatch<React.SetStateAction<BannerForm>>
  saving: boolean
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, animation: 'fadeIn 0.15s ease',
    }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 16, padding: 24, maxWidth: 560, width: '100%',
          maxHeight: '90vh', overflowY: 'auto',
          animation: 'fadeSlideUp 0.2s ease',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
              {editing ? 'แก้ไขแบนเนอร์' : 'เพิ่มแบนเนอร์ใหม่'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
              แนะนำอัตราส่วน 16:5 (เช่น 1920×600 px)
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
        </div>

        {/* Live Preview 16:5 */}
        <div style={{
          width: '100%', aspectRatio: '16 / 5',
          borderRadius: 10, overflow: 'hidden',
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          marginBottom: 14, position: 'relative',
        }}>
          {form.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveImageUrl(form.image_url)} alt="preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{
              width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-tertiary)', fontSize: 12, gap: 8,
            }}>
              <ExternalLink size={18} opacity={0.5} />
              พรีวิวแบนเนอร์ (16:5)
            </div>
          )}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Upload */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>รูปแบนเนอร์</div>
            <ImageUpload
              folder="banner"
              currentUrl={form.image_url}
              size="lg"
              onUploaded={url => setForm(f => ({ ...f, image_url: url }))}
            />
            <div style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 6 }}>
              รองรับ JPG/PNG/WebP · สูงสุด 2 MB · ระบบจะสร้าง 3 ขนาด (sm/md/lg) อัตโนมัติ
            </div>
          </div>

          {/* Title */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ชื่อแบนเนอร์ (สำหรับอ้างอิงภายใน)</div>
            <input type="text" className="input"
              placeholder="เช่น โปรโมชั่นฝากแรก, แบนเนอร์หวยเวียดนาม..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
          </div>

          {/* Link */}
          <div>
            <div className="label" style={{ marginBottom: 6 }}>ลิงก์ (ถ้ามี)</div>
            <input type="text" className="input"
              placeholder="เช่น /promotions/1 หรือ https://..."
              value={form.link_url}
              onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
            />
          </div>

          {/* Active toggle */}
          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 14px', borderRadius: 10,
            background: 'var(--bg-elevated)', border: '1px solid var(--border)',
            cursor: 'pointer',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>แสดงแบนเนอร์นี้</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                ถ้าปิด จะไม่แสดงในหน้าแรกของสมาชิก
              </div>
            </div>
            <Switch checked={form.is_active} onChange={v => setForm(f => ({ ...f, is_active: v }))} />
          </label>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button className="btn btn-secondary" style={{ flex: 1, height: 40 }} onClick={onClose}>
            ยกเลิก
          </button>
          <button className="btn btn-primary" style={{ flex: 1.5, height: 40, fontWeight: 600 }}
            disabled={saving || !form.image_url}
            onClick={onSave}>
            {saving ? 'กำลังบันทึก...' : (editing ? 'บันทึกการแก้ไข' : 'เพิ่มแบนเนอร์')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Small helpers
// ═══════════════════════════════════════════════════════════════════
function StatPill({ label, value, color, dot }: { label: string; value: number; color: string; dot?: boolean }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 10, padding: '10px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {dot && <span style={{
          width: 7, height: 7, borderRadius: '50%', background: color,
          boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.8s ease-in-out infinite',
        }} />}
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 18, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 44, height: 24, borderRadius: 999,
        background: checked ? 'linear-gradient(135deg, var(--accent), var(--accent-strong, #00e5a0))' : 'var(--border)',
        border: 'none', cursor: 'pointer', position: 'relative',
        transition: 'background 0.2s',
      }}
    >
      <span style={{
        position: 'absolute', top: 2, left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
      }} />
    </button>
  )
}
