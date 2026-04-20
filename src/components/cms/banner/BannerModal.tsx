// Component: BannerModal — create/edit banner with live 16:5 preview
// Parent: src/components/cms/BannerManager.tsx
'use client'

import { ExternalLink } from 'lucide-react'
import ImageUpload from '@/components/ImageUpload'
import { resolveImageUrl } from '@/lib/imageUrl'
import type { BannerForm } from './types'

interface Props {
  editing: boolean
  form: BannerForm
  setForm: React.Dispatch<React.SetStateAction<BannerForm>>
  saving: boolean
  onSave: () => void
  onClose: () => void
}

export default function BannerModal({ editing, form, setForm, saving, onSave, onClose }: Props) {
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
