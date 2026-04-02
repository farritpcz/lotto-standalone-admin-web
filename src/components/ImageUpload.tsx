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
import { Upload, X, Image } from 'lucide-react'

interface Props {
  folder?: string          // subfolder: lottery, banner, avatar
  currentUrl?: string      // URL รูปปัจจุบัน (preview)
  onUploaded: (url: string) => void  // callback เมื่ออัพโหลดเสร็จ
  size?: 'sm' | 'md' | 'lg'
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'

export default function ImageUpload({ folder = 'general', currentUrl, onUploaded, size = 'md' }: Props) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const dims = size === 'sm' ? { w: 80, h: 80 } : size === 'lg' ? { w: '100%' as const, h: 160 } : { w: 140, h: 100 }

  const handleFile = async (file: File) => {
    // validate
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('รองรับเฉพาะ jpg, png, gif, svg, webp')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('ไฟล์ใหญ่เกิน 5MB')
      return
    }

    // preview
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

      const uploadedUrl = API_BASE + (res.data.data?.url || '')
      onUploaded(uploadedUrl)
      setPreview(null) // ใช้ URL จริงแทน
    } catch {
      setError('อัพโหลดไม่สำเร็จ')
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

  const displayUrl = preview || currentUrl

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        style={{
          width: dims.w, height: dims.h, borderRadius: 10, cursor: 'pointer',
          border: `2px dashed ${displayUrl ? 'transparent' : 'var(--border)'}`,
          background: displayUrl ? `url(${displayUrl}) center/cover` : 'var(--bg-elevated)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, position: 'relative', overflow: 'hidden',
          transition: 'border-color 0.2s',
        }}
      >
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
