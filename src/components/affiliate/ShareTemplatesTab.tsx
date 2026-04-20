// Component: ShareTemplatesTab — ข้อความแชร์สำเร็จรูป (LINE/FB/Telegram)
// Parent: src/app/affiliate/page.tsx

'use client'

import { type ShareTemplate } from '@/lib/api'
import { MessageSquare, Plus, Copy, Pencil, Trash2 } from 'lucide-react'
import Loading from '@/components/Loading'

interface Props {
  templates: ShareTemplate[]
  loading: boolean
  onAdd: () => void
  onEdit: (t: ShareTemplate) => void
  onDelete: (t: ShareTemplate) => void
  onCopy: (content: string) => void
}

/** Platform badge สี */
function platformBadge(platform: string) {
  const map: Record<string, { bg: string; color: string; label: string }> = {
    all:      { bg: 'rgba(0,229,160,0.15)', color: 'var(--accent)', label: 'ทุกแพลตฟอร์ม' },
    line:     { bg: 'rgba(6,199,85,0.15)', color: '#06C755', label: 'LINE' },
    facebook: { bg: 'rgba(24,119,242,0.15)', color: '#1877F2', label: 'Facebook' },
    telegram: { bg: 'rgba(38,166,224,0.15)', color: '#26A6E0', label: 'Telegram' },
  }
  const m = map[platform] || map.all
  return (
    <span style={{ background: m.bg, color: m.color, padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
      {m.label}
    </span>
  )
}

export default function ShareTemplatesTab({ templates, loading, onAdd, onEdit, onDelete, onCopy }: Props) {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquare size={16} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 700 }}>ข้อความแชร์สำเร็จรูป</span>
        </div>
        <button className="btn btn-primary" onClick={onAdd}
          style={{ height: 32, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={14} /> เพิ่ม Template
        </button>
      </div>

      {/* คำอธิบาย placeholder */}
      <div style={{
        background: 'var(--bg-elevated)', border: '1px solid var(--border)',
        borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.6,
      }}>
        ตัวแปรที่ใช้ได้ในเนื้อหา: <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{link}'}</code> = ลิงก์แนะนำ ·{' '}
        <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{code}'}</code> = รหัสแนะนำ ·{' '}
        <code style={{ background: 'var(--bg-base)', padding: '1px 4px', borderRadius: 4 }}>{'{username}'}</code> = ชื่อผู้แนะนำ
      </div>

      {loading ? <Loading inline text="กำลังโหลด..." /> : templates.length === 0 ? (
        <div style={{
          background: 'var(--bg-elevated)', borderRadius: 12, padding: '40px 20px',
          textAlign: 'center', border: '1px dashed var(--border)',
        }}>
          <MessageSquare size={32} color="var(--text-tertiary)" style={{ marginBottom: 8, opacity: 0.5 }} />
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>
            ยังไม่มีข้อความแชร์ — กดปุ่ม &quot;เพิ่ม Template&quot; เพื่อสร้าง
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {templates.map(t => (
            <div key={t.id} style={{
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{t.name}</span>
                  {platformBadge(t.platform)}
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => onCopy(t.content)} title="คัดลอก" style={{
                    background: 'var(--bg-base)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                  }}>
                    <Copy size={13} color="var(--text-secondary)" />
                  </button>
                  <button onClick={() => onEdit(t)} title="แก้ไข" style={{
                    background: 'var(--bg-base)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                  }}>
                    <Pencil size={13} color="var(--text-secondary)" />
                  </button>
                  <button onClick={() => onDelete(t)} title="ลบ" style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: 8, padding: 6, cursor: 'pointer',
                  }}>
                    <Trash2 size={13} color="var(--status-error)" />
                  </button>
                </div>
              </div>
              <div style={{
                background: 'var(--bg-base)', borderRadius: 8, padding: '10px 12px',
                fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                maxHeight: 120, overflow: 'auto',
              }}>
                {t.content}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
