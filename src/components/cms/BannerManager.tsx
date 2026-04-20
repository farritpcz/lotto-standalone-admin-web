// Component: BannerManager — orchestrator for banner CMS (grid + DnD + modal)
// Parent: src/app/cms/**
//
// Features:
// - Card grid (responsive, 16:5 aspect)
// - Drag & drop reorder ด้วย @dnd-kit (auto save via API)
// - Toggle active inline
// - Modal: ImageUpload + live preview 16:5 + title/link/active
// - Stats bar (ทั้งหมด / แสดง / ซ่อน)
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Plus, ExternalLink } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, arrayMove, rectSortingStrategy, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import SortableCard from './banner/SortableCard'
import BannerModal from './banner/BannerModal'
import type { Banner, BannerForm } from './banner/types'

// Re-export for backward-compat with existing imports
export type { Banner } from './banner/types'

interface Props {
  banners: Banner[]
  onChange: () => void | Promise<void>  // reload parent
  onMessage: (msg: { type: 'success' | 'error'; text: string }) => void
}

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
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
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
