/**
 * Admin — ตั้งค่าระบบแจ้งเตือน (Telegram Notifications)
 *
 * ⭐ รองรับหลายกลุ่ม — แต่ละกลุ่มมี Bot Token + Chat ID + จุดแจ้งเตือนแยกกัน
 *
 * ตัวอย่าง:
 *  - กลุ่ม "แอดมิน" → แจ้งเตือนฝาก/ถอน/กรอกผล
 *  - กลุ่ม "ฝ่ายการเงิน" → แจ้งเตือนฝาก/ถอนเท่านั้น
 *  - กลุ่ม "เจ้าของ" → แจ้งเตือนยอดสูง/กำไรขาดทุน
 *
 * ⭐ ตอนนี้เป็น UI — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'

/* ── จุดแจ้งเตือนที่ตั้งได้ ─────────────────────────────────────────── */
const NOTIFY_POINTS = [
  { key: 'on_register', label: 'สมัครใหม่', icon: '👤' },
  { key: 'on_deposit', label: 'แจ้งฝาก', icon: '📥' },
  { key: 'on_withdraw', label: 'แจ้งถอน', icon: '📤' },
  { key: 'on_deposit_approve', label: 'อนุมัติฝาก', icon: '✅' },
  { key: 'on_withdraw_approve', label: 'อนุมัติถอน', icon: '✅' },
  { key: 'on_result', label: 'กรอกผล', icon: '🏆' },
  { key: 'on_large_bet', label: 'เดิมพันยอดสูง', icon: '🎰' },
  { key: 'on_large_win', label: 'ถูกรางวัลยอดสูง', icon: '💰' },
  { key: 'on_login', label: 'แอดมิน login', icon: '🔑' },
]

/* ── Type: กลุ่มแจ้งเตือน ─────────────────────────────────────────────── */
interface NotifyGroup {
  id: string
  name: string
  botToken: string
  chatId: string
  enabled: Record<string, boolean>
  largeBetThreshold: number
  largeWinThreshold: number
  active: boolean
}

/* สร้าง ID สำหรับกลุ่มใหม่ */
const genId = () => Math.random().toString(36).slice(2, 8)

/* Default enabled — เปิดทุกอัน */
const defaultEnabled = () => {
  const e: Record<string, boolean> = {}
  NOTIFY_POINTS.forEach(p => { e[p.key] = true })
  return e
}

/* ── Mock data — กลุ่มเริ่มต้น ────────────────────────────────────────── */
const INITIAL_GROUPS: NotifyGroup[] = [
  {
    id: 'grp1', name: 'กลุ่มแอดมิน', botToken: '', chatId: '',
    enabled: { on_register: true, on_deposit: true, on_withdraw: true, on_deposit_approve: true, on_withdraw_approve: true, on_result: true, on_large_bet: false, on_large_win: false, on_login: true },
    largeBetThreshold: 5000, largeWinThreshold: 50000, active: true,
  },
]

export default function NotificationSettingsPage() {
  const [groups, setGroups] = useState<NotifyGroup[]>(INITIAL_GROUPS)
  const [editingGroup, setEditingGroup] = useState<NotifyGroup | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmDlg, setConfirmDlg] = useState<ConfirmDialogProps | null>(null)
  const [testingId, setTestingId] = useState<string | null>(null)

  /* ── เปิด modal เพิ่ม/แก้ไขกลุ่ม ───────────────────────────────────── */
  const openAdd = () => {
    setEditingGroup({
      id: genId(), name: '', botToken: '', chatId: '',
      enabled: defaultEnabled(),
      largeBetThreshold: 5000, largeWinThreshold: 50000, active: true,
    })
    setShowModal(true)
  }

  const openEdit = (g: NotifyGroup) => {
    setEditingGroup({ ...g, enabled: { ...g.enabled } })
    setShowModal(true)
  }

  /* ── บันทึกกลุ่ม ────────────────────────────────────────────────────── */
  const saveGroup = () => {
    if (!editingGroup || !editingGroup.name.trim()) return
    setGroups(prev => {
      const exists = prev.find(g => g.id === editingGroup.id)
      if (exists) return prev.map(g => g.id === editingGroup.id ? editingGroup : g)
      return [...prev, editingGroup]
    })
    setShowModal(false)
    setEditingGroup(null)
  }

  /* ── ลบกลุ่ม ─────────────────────────────────────────────────────────── */
  const deleteGroup = (g: NotifyGroup) => {
    setConfirmDlg({
      title: 'ลบกลุ่มแจ้งเตือน',
      message: `ยืนยันลบกลุ่ม "${g.name}"?\nจะหยุดแจ้งเตือนทุกจุดของกลุ่มนี้`,
      type: 'danger',
      confirmLabel: 'ลบ',
      onConfirm: () => { setGroups(prev => prev.filter(x => x.id !== g.id)); setConfirmDlg(null) },
      onCancel: () => setConfirmDlg(null),
    })
  }

  /* ── Toggle active ───────────────────────────────────────────────────── */
  const toggleActive = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g))
  }

  /* ── ทดสอบส่งข้อความ ─────────────────────────────────────────────────── */
  const handleTest = async (g: NotifyGroup) => {
    if (!g.botToken || !g.chatId) { setMessage('กรุณากรอก Bot Token + Chat ID ของกลุ่มนี้'); return }
    setTestingId(g.id)
    await new Promise(r => setTimeout(r, 1000))
    setMessage(`ส่ง test ไปกลุ่ม "${g.name}" สำเร็จ (mock)`)
    setTestingId(null)
    setTimeout(() => setMessage(''), 3000)
  }

  /* ── บันทึกทั้งหมด ───────────────────────────────────────────────────── */
  const handleSaveAll = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 500))
    setMessage('บันทึกทั้งหมดสำเร็จ')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <h1>ตั้งค่าระบบแจ้งเตือน</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={openAdd} className="btn btn-secondary">+ เพิ่มกลุ่ม</button>
          <button onClick={handleSaveAll} disabled={saving} className="btn btn-primary">
            {saving ? 'กำลังบันทึก...' : '💾 บันทึกทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          background: message.includes('สำเร็จ') ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.includes('สำเร็จ') ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message}
        </div>
      )}

      {/* ══ รายการกลุ่มแจ้งเตือน ════════════════════════════════════════════ */}
      {groups.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ยังไม่มีกลุ่มแจ้งเตือน — กดปุ่ม "+ เพิ่มกลุ่ม" เพื่อเริ่มต้น
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => {
            const enabledCount = Object.values(g.enabled).filter(Boolean).length
            return (
              <div key={g.id} className="card-surface" style={{ padding: 20, opacity: g.active ? 1 : 0.5 }}>
                {/* ── Header: ชื่อกลุ่ม + toggle + actions ────────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Toggle active */}
                    <button onClick={() => toggleActive(g.id)} style={{
                      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                      background: g.active ? 'var(--accent)' : 'var(--bg-elevated)',
                      position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 9, background: 'white',
                        position: 'absolute', top: 3, left: g.active ? 23 : 3, transition: 'left 0.2s',
                      }} />
                    </button>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {g.chatId ? `Chat: ${g.chatId}` : 'ยังไม่ได้ตั้ง Chat ID'} · {enabledCount}/{NOTIFY_POINTS.length} จุด
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleTest(g)} disabled={testingId === g.id}
                      className="btn btn-ghost" style={{ fontSize: 12 }}>
                      {testingId === g.id ? '📤...' : '📤 ทดสอบ'}
                    </button>
                    <button onClick={() => openEdit(g)} className="btn btn-ghost" style={{ fontSize: 12 }}>แก้ไข</button>
                    <button onClick={() => deleteGroup(g)} className="btn btn-ghost" style={{ fontSize: 12, color: 'var(--status-error)' }}>ลบ</button>
                  </div>
                </div>

                {/* ── จุดแจ้งเตือนที่เปิดอยู่ (badges) ─────────────────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {NOTIFY_POINTS.map(np => (
                    <span key={np.key} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4,
                      background: g.enabled[np.key] ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      color: g.enabled[np.key] ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontWeight: g.enabled[np.key] ? 500 : 400,
                    }}>
                      {np.icon} {np.label}
                    </span>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ══ Modal: เพิ่ม/แก้ไขกลุ่ม ════════════════════════════════════════ */}
      {showModal && editingGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 24, maxWidth: 560, width: '100%', maxHeight: '85vh', overflowY: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>
                {groups.find(g => g.id === editingGroup.id) ? 'แก้ไขกลุ่มแจ้งเตือน' : 'เพิ่มกลุ่มแจ้งเตือน'}
              </div>
              <button onClick={() => setShowModal(false)} className="btn btn-ghost">✕</button>
            </div>

            {/* ── ชื่อกลุ่ม ──────────────────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 4 }}>ชื่อกลุ่ม</div>
              <input type="text" value={editingGroup.name}
                onChange={e => setEditingGroup({ ...editingGroup, name: e.target.value })}
                placeholder="เช่น กลุ่มแอดมิน, ฝ่ายการเงิน, เจ้าของ"
                className="input" />
            </div>

            {/* ── Telegram Config ─────────────────────────────────────────── */}
            <div className="label" style={{ marginBottom: 8 }}>Telegram</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Bot Token</div>
                <input type="text" value={editingGroup.botToken}
                  onChange={e => setEditingGroup({ ...editingGroup, botToken: e.target.value })}
                  placeholder="123456:ABC-DEF..." className="input" />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Chat ID / Group ID</div>
                <input type="text" value={editingGroup.chatId}
                  onChange={e => setEditingGroup({ ...editingGroup, chatId: e.target.value })}
                  placeholder="-1001234567890" className="input" />
              </div>
            </div>

            {/* ── จุดแจ้งเตือน (toggles) ──────────────────────────────────── */}
            <div className="label" style={{ marginBottom: 8 }}>จุดแจ้งเตือน</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {NOTIFY_POINTS.map(np => (
                <div key={np.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{np.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{np.label}</span>
                  </div>
                  <button
                    onClick={() => setEditingGroup({
                      ...editingGroup,
                      enabled: { ...editingGroup.enabled, [np.key]: !editingGroup.enabled[np.key] },
                    })}
                    style={{
                      width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                      background: editingGroup.enabled[np.key] ? 'var(--accent)' : '#333',
                      position: 'relative', transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: 8, background: 'white',
                      position: 'absolute', top: 3, left: editingGroup.enabled[np.key] ? 21 : 3, transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              ))}
            </div>

            {/* ── Threshold (เดิมพัน/ถูกรางวัลยอดสูง) ─────────────────────── */}
            {(editingGroup.enabled.on_large_bet || editingGroup.enabled.on_large_win) && (
              <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>Threshold ยอดสูง</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {editingGroup.enabled.on_large_bet && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>เดิมพันยอดสูงเกิน (฿)</div>
                      <input type="number" value={editingGroup.largeBetThreshold}
                        onChange={e => setEditingGroup({ ...editingGroup, largeBetThreshold: Number(e.target.value) })}
                        className="input" />
                    </div>
                  )}
                  {editingGroup.enabled.on_large_win && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>ถูกรางวัลยอดสูงเกิน (฿)</div>
                      <input type="number" value={editingGroup.largeWinThreshold}
                        onChange={e => setEditingGroup({ ...editingGroup, largeWinThreshold: Number(e.target.value) })}
                        className="input" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── ปุ่ม ─────────────────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
              <button onClick={saveGroup} disabled={!editingGroup.name.trim()} className="btn btn-primary" style={{ flex: 1 }}>บันทึกกลุ่ม</button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog */}
      {confirmDlg && <ConfirmDialog {...confirmDlg} />}

      {/* Note */}
      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8, fontSize: 12, color: 'var(--text-tertiary)' }}>
        💡 แต่ละกลุ่มสามารถใช้ Bot Token เดียวกัน แต่ส่งไปคนละ Chat ID ได้ — เมื่อเชื่อม API จริง ระบบจะยิงแจ้งเตือนไปทุกกลุ่มที่เปิดใช้งาน
      </div>
    </div>
  )
}
