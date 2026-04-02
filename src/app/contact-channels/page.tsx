/**
 * Admin — จัดการช่องทางติดต่อ
 *
 * เพิ่ม/แก้ไข/ลบ ช่องทางติดต่อ (Line, Telegram, Facebook, Phone, etc.)
 */
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Plus, MessageCircle, Send, Phone, Globe, Mail, Trash2, Edit3 } from 'lucide-react'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

interface Channel {
  id: number; platform: string; name: string; value: string
  link_url: string; icon_url: string; sort_order: number; is_active: boolean
}

const PLATFORMS = [
  { value: 'line', label: 'LINE', icon: MessageCircle, color: '#06C755' },
  { value: 'telegram', label: 'Telegram', icon: Send, color: '#0088cc' },
  { value: 'facebook', label: 'Facebook', icon: Globe, color: '#1877F2' },
  { value: 'whatsapp', label: 'WhatsApp', icon: Phone, color: '#25D366' },
  { value: 'phone', label: 'โทรศัพท์', icon: Phone, color: '#34C759' },
  { value: 'email', label: 'Email', icon: Mail, color: '#FF9500' },
  { value: 'website', label: 'เว็บไซต์', icon: Globe, color: '#3b82f6' },
  { value: 'other', label: 'อื่นๆ', icon: MessageCircle, color: '#888' },
]

export default function ContactChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [form, setForm] = useState({ platform: 'line', name: '', value: '', link_url: '', sort_order: 0 })
  const [saving, setSaving] = useState(false)
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => { load() }, [])
  useEffect(() => { if (message) { const t = setTimeout(() => setMessage(null), 3000); return () => clearTimeout(t) } }, [message])

  const load = () => {
    setLoading(true)
    api.get('/contact-channels').then(res => setChannels(res.data.data || [])).catch(() => {}).finally(() => setLoading(false))
  }

  const openAdd = () => {
    setEditId(null)
    setForm({ platform: 'line', name: '', value: '', link_url: '', sort_order: channels.length + 1 })
    setShowModal(true)
  }

  const openEdit = (ch: Channel) => {
    setEditId(ch.id)
    setForm({ platform: ch.platform, name: ch.name, value: ch.value, link_url: ch.link_url, sort_order: ch.sort_order })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.value) { setMessage({ type: 'error', text: 'กรุณากรอกชื่อและค่า' }); return }
    setSaving(true)
    try {
      if (editId) {
        await api.put(`/contact-channels/${editId}`, form)
      } else {
        await api.post('/contact-channels', form)
      }
      setMessage({ type: 'success', text: editId ? 'แก้ไขสำเร็จ' : 'เพิ่มช่องทางสำเร็จ' })
      setShowModal(false)
      load()
    } catch { setMessage({ type: 'error', text: 'เกิดข้อผิดพลาด' }) }
    finally { setSaving(false) }
  }

  const handleDelete = (ch: Channel) => {
    setConfirmDlg({
      title: 'ลบช่องทางติดต่อ',
      message: `ยืนยันลบ "${ch.name}" (${ch.platform})?`,
      type: 'danger', confirmLabel: 'ลบ',
      onConfirm: async () => {
        setConfirmDlg(null)
        await api.delete(`/contact-channels/${ch.id}`).catch(() => {})
        setMessage({ type: 'success', text: 'ลบสำเร็จ' })
        load()
      },
      onCancel: () => setConfirmDlg(null),
    })
  }

  const handleToggle = async (ch: Channel) => {
    await api.put(`/contact-channels/${ch.id}`, { is_active: !ch.is_active }).catch(() => {})
    load()
  }

  const getPlatformInfo = (p: string) => PLATFORMS.find(pl => pl.value === p) || PLATFORMS[7]

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ช่องทางติดต่อ</h1>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> เพิ่มช่องทาง
        </button>
      </div>

      {message && (
        <div style={{ background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)', color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13 }}>
          {message.text}
        </div>
      )}

      {loading ? <Loading inline text="กำลังโหลด..." /> : channels.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ยังไม่มีช่องทางติดต่อ
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {channels.map(ch => {
            const pl = getPlatformInfo(ch.platform)
            const Icon = pl.icon
            return (
              <div key={ch.id} className="card-surface" style={{
                padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14,
                opacity: ch.is_active ? 1 : 0.5, borderLeft: `3px solid ${pl.color}`,
              }}>
                {/* Platform icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: `${pl.color}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={22} color={pl.color} />
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{ch.name}</span>
                    <span style={{ fontSize: 11, padding: '1px 8px', borderRadius: 10, background: `${pl.color}15`, color: pl.color, fontWeight: 600 }}>
                      {pl.label}
                    </span>
                    {!ch.is_active && <span className="badge badge-neutral" style={{ fontSize: 10 }}>ปิด</span>}
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{ch.value}</div>
                  {ch.link_url && (
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{ch.link_url}</div>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button onClick={() => handleToggle(ch)} style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: ch.is_active ? 'var(--accent)' : '#333', position: 'relative', transition: 'background 0.2s',
                  }}>
                    <div style={{ width: 16, height: 16, borderRadius: 8, background: 'white', position: 'absolute', top: 3, left: ch.is_active ? 21 : 3, transition: 'left 0.2s' }} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => openEdit(ch)} style={{ height: 28, padding: '0 6px' }}>
                    <Edit3 size={14} />
                  </button>
                  <button className="btn btn-ghost" onClick={() => handleDelete(ch)} style={{ height: 28, padding: '0 6px', color: 'var(--status-error)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal เพิ่ม/แก้ไข ──── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 440, width: '100%', animation: 'fadeSlideUp 0.2s ease' }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              {editId ? 'แก้ไขช่องทาง' : 'เพิ่มช่องทางติดต่อ'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Platform select */}
              <div>
                <div className="label" style={{ marginBottom: 4 }}>แพลตฟอร์ม</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {PLATFORMS.map(p => (
                    <button key={p.value} onClick={() => setForm(f => ({ ...f, platform: p.value }))} style={{
                      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                      border: 'none', cursor: 'pointer',
                      background: form.platform === p.value ? p.color : 'var(--bg-elevated)',
                      color: form.platform === p.value ? 'white' : 'var(--text-secondary)',
                    }}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="label" style={{ marginBottom: 4 }}>ชื่อที่แสดง</div>
                <input type="text" className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="เช่น LINE Official" />
              </div>

              <div>
                <div className="label" style={{ marginBottom: 4 }}>ค่า / ID</div>
                <input type="text" className="input" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="เช่น @lotto-official, 02-123-4567" />
              </div>

              <div>
                <div className="label" style={{ marginBottom: 4 }}>Link URL (เปิดตรง)</div>
                <input type="text" className="input" value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))} placeholder="เช่น https://line.me/ti/p/@lotto" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" style={{ flex: 1, height: 38 }} onClick={() => setShowModal(false)}>ยกเลิก</button>
              <button className="btn btn-primary" style={{ flex: 1, height: 38 }} onClick={handleSave} disabled={saving}>
                {saving ? 'กำลังบันทึก...' : editId ? 'บันทึก' : 'เพิ่ม'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDlg && <ConfirmDialog {...confirmDlg} />}
    </div>
  )
}
