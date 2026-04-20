/**
 * ImageUpload — อัพโหลดรูปภาพ
 *
 * - กดเลือกไฟล์ หรือ drag & drop
 * - Preview ก่อนอัพโหลด
 * - อัพโหลดไป POST /api/v1/upload
 * - Return URL กลับให้ parent
 *
 * Usage: <ImageUpload folder="lottery" onUploaded={(url) => setImageUrl(url)} currentUrl={imageUrl} />
 */
'use client'

import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { resolveImageUrl } from '@/lib/imageUrl'
import { Upload, X, Image } from 'lucide-react'

interface Props {
  folder?: string          // subfolder whitelist: lottery, banner, logo, favicon, promo, bank, contact, avatar, general
  currentUrl?: string      // URL รูปปัจจุบัน (preview)
  onUploaded: (url: string) => void  // callback เมื่ออัพโหลดเสร็จ
  size?: 'sm' | 'md' | 'lg'
}

// ⚠️ [Security] client-side size limit ตาม folder (ต้องตรงกับ backend imageguard.go)
// client เช็คก่อน → UX ดีขึ้น (ไม่ต้อง upload เสียเวลา)
// server enforce จริงๆ — ห้ามพึ่ง client-side เท่านั้น
function sizeLimitForFolder(folder: string): number {
  switch (folder) {
    case 'avatar':
    case 'logo':
    case 'favicon':
      return 500 * 1024          // 500 KB
    case 'slip':
    case 'bank':
    case 'contact':
      return 1 * 1024 * 1024     // 1 MB
    case 'banner':
    case 'promo':
    case 'lottery':
      return 2 * 1024 * 1024     // 2 MB
    default:
      return 1 * 1024 * 1024     // 1 MB
  }
}

function sizeLimitLabel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${bytes / 1024 / 1024} MB`
  return `${bytes / 1024} KB`
}

export default function ImageUpload({ folder = 'general', currentUrl, onUploaded, size = 'md' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const dims = size === 'sm' ? { w: 80, h: 80 } : size === 'lg' ? { w: '100%' as const, h: 160 } : { w: 140, h: 100 }

  const handleFile = async (file: File) => {
    // ⚠️ [Security] SVG ถูกถอดออก → ป้องกัน stored XSS (SVG รัน JavaScript ได้)
    // backend ก็ reject SVG เช่นกัน (imageguard.go)
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('รองรับเฉพาะ jpg, png, gif, webp (ไม่รับ svg)')
      return
    }

    const limit = sizeLimitForFolder(folder)
    if (file.size > limit) {
      setError(`ไฟล์ใหญ่เกิน ${sizeLimitLabel(limit)}`)
      return
    }

    setPreview(URL.createObjectURL(file))
    setError('')
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)

      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      // ⭐ backend คืน URL R2 absolute แล้ว (https://pub-xxx.r2.dev/...) — ใช้ตรงได้
      const uploadedUrl = res.data.data?.url || ''
      onUploaded(uploadedUrl)
      setPreview(null)
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'อัพโหลดไม่สำเร็จ'
      setError(msg)
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ⭐ ใช้ resolveImageUrl เพื่อรองรับทั้ง R2 absolute + legacy /uploads relative
  const displayUrl = preview || resolveImageUrl(currentUrl)

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          width: dims.w, height: dims.h, borderRadius: 10, cursor: 'pointer',
          border: `2px dashed ${displayUrl ? 'transparent' : 'var(--border)'}`,
          background: displayUrl ? 'var(--bg-base)' : 'var(--bg-elevated)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
        {/* แสดงรูปด้วย <img> tag — รองรับ SVG ได้ดี */}
        {displayUrl && !uploading && (
          <img src={displayUrl} alt="preview"
            style={{ width: '100%', height: '100%', objectFit: 'contain', position: 'absolute', inset: 0 }}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
        )}

        {!displayUrl && !uploading && (
          <>
            <Upload size={20} color="var(--text-tertiary)" />
            <span style={{ fontSize: 10, color: 'var(--text-tertiary)' }}>อัพโหลดรูป</span>
          </>
        )}

        {uploading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 24, height: 24, border: '3px solid var(--border)',
              borderTopColor: 'var(--accent)', borderRadius: '50%',
              animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>กำลังอัพโหลด...</span>
          </div>
        )}

        {displayUrl && !uploading && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0, transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
          >
            <Image size={20} color="white" />
            <span style={{ fontSize: 11, color: 'white', marginLeft: 4 }}>เปลี่ยน</span>
          </div>
        )}

        {/* ปุ่ม X ลบรูป */}
        {displayUrl && !uploading && (
          <button
            onClick={(e) => { e.stopPropagation(); onUploaded(''); setPreview(null) }}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={12} color="white" />
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {error && <div style={{ fontSize: 11, color: 'var(--status-error)', marginTop: 4 }}>{error}</div>}
    </div>
  )
}
