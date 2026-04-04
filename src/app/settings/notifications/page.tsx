/**
 * Admin — ตั้งค่าระบบแจ้งเตือน Telegram (Multi-Group)
 *
 * ⭐ รองรับหลายกลุ่ม — แต่ละกลุ่มมี Bot Token + Chat ID + จุดแจ้งเตือนแยกกัน
 *
 * ตัวอย่าง:
 *  - กลุ่ม "แอดมิน" → แจ้งเตือนฝาก/ถอน/กรอกผล
 *  - กลุ่ม "ฝ่ายการเงิน" → แจ้งเตือนฝาก/ถอนเท่านั้น
 *  - กลุ่ม "เจ้าของ" → แจ้งเตือนยอดสูง/กำไรขาดทุน
 *
 * ⭐ เชื่อม API จริง:
 *  - GET /api/v1/notifications/config → array ของ groups
 *  - PUT /api/v1/notifications/config → บันทึก array ทั้งหมด
 *  - POST /api/v1/notifications/test  → ส่งข้อความทดสอบไปกลุ่มเดียว
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { notificationApi, type NotifyGroup } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import ConfirmDialog, { ConfirmDialogProps } from '@/components/ConfirmDialog'
import { Bell, Plus, Save, Send, Pencil, Trash2, Copy } from 'lucide-react'

// ─── จุดแจ้งเตือนที่ตั้งได้ ─────────────────────────────────────────
// key ต้องตรงกับ field ใน NotifyGroup interface
const NOTIFY_POINTS: { key: keyof NotifyGroup; label: string; icon: string }[] = [
  { key: 'on_deposit', label: 'แจ้งฝาก', icon: '📥' },
  { key: 'on_withdraw', label: 'แจ้งถอน', icon: '📤' },
  { key: 'on_deposit_approve', label: 'อนุมัติฝาก', icon: '✅' },
  { key: 'on_withdraw_approve', label: 'อนุมัติถอน', icon: '✅' },
  { key: 'on_new_member', label: 'สมัครใหม่', icon: '👤' },
  { key: 'on_result', label: 'กรอกผล', icon: '🏆' },
  { key: 'on_large_bet', label: 'เดิมพันยอดสูง', icon: '🎰' },
  { key: 'on_large_win', label: 'ถูกรางวัลยอดสูง', icon: '💰' },
  { key: 'on_login', label: 'แอดมิน login', icon: '🔑' },
]

// ─── สร้าง ID สำหรับกลุ่มใหม่ ────────────────────────────────────────
const genId = () => 'grp_' + Math.random().toString(36).slice(2, 10)

// ─── Default group ใหม่ ──────────────────────────────────────────────
const newGroup = (): NotifyGroup => ({
  id: genId(), name: '', bot_token: '', chat_id: '', active: true,
  on_deposit: true, on_withdraw: true, on_deposit_approve: true,
  on_withdraw_approve: true, on_new_member: true, on_result: false,
  on_large_win: false, on_large_bet: false, on_login: false,
  large_win_min: 50000, large_bet_min: 5000,
})

export default function NotificationSettingsPage() {
  // ─── State ──────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<NotifyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)

  // Modal state: null=ปิด, กลุ่มที่กำลังแก้ไข
  const [editGroup, setEditGroup] = useState<NotifyGroup | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [dialog, setDialog] = useState<ConfirmDialogProps | null>(null)
  const { toast } = useToast()

  // ─── โหลดข้อมูลจาก API ─────────────────────────────────────────────
  const loadGroups = useCallback(() => {
    setLoading(true)
    notificationApi.getGroups()
      .then(res => {
        const data = res.data.data
        // ⭐ API ส่ง array ของ groups หรือ object เดียว (backward compat)
        if (Array.isArray(data)) {
          setGroups(data)
        } else if (data && typeof data === 'object' && data.bot_token !== undefined) {
          // format เก่า: single object → แปลงเป็น array
          setGroups([{ ...newGroup(), ...data, id: data.id || 'migrated', name: data.name || 'กลุ่มหลัก' }])
        } else {
          setGroups([])
        }
      })
      .catch(() => setGroups([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadGroups() }, [loadGroups])

  // ─── บันทึกทั้งหมด ─────────────────────────────────────────────────
  const handleSaveAll = async () => {
    setSaving(true)
    try {
      await notificationApi.saveGroups(groups)
      toast.success('บันทึกทั้งหมดสำเร็จ')
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally { setSaving(false) }
  }

  // ─── เพิ่มกลุ่มใหม่ ────────────────────────────────────────────────
  const handleAdd = () => {
    setEditGroup(newGroup())
    setShowHelp(false)
  }

  // ─── แก้ไขกลุ่ม ────────────────────────────────────────────────────
  const handleEdit = (g: NotifyGroup) => {
    setEditGroup({ ...g })
    setShowHelp(false)
  }

  // ─── Duplicate กลุ่ม ───────────────────────────────────────────────
  const handleDuplicate = (g: NotifyGroup) => {
    const dup = { ...g, id: genId(), name: g.name + ' (สำเนา)' }
    setGroups(prev => [...prev, dup])
    toast.success(`สร้างสำเนา "${g.name}" แล้ว — อย่าลืมกดบันทึก`)
  }

  // ─── ลบกลุ่ม ───────────────────────────────────────────────────────
  const handleDelete = (g: NotifyGroup) => {
    setDialog({
      title: 'ลบกลุ่มแจ้งเตือน',
      message: `ยืนยันลบกลุ่ม "${g.name}"? จะหยุดแจ้งเตือนทุกจุดของกลุ่มนี้`,
      type: 'danger', confirmLabel: 'ลบ',
      onConfirm: () => { setGroups(prev => prev.filter(x => x.id !== g.id)); setDialog(null); toast.success('ลบแล้ว — อย่าลืมกดบันทึก') },
      onCancel: () => setDialog(null),
    })
  }

  // ─── Toggle active กลุ่ม ───────────────────────────────────────────
  const toggleActive = (id: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, active: !g.active } : g))
  }

  // ─── บันทึกจาก modal ───────────────────────────────────────────────
  const saveFromModal = () => {
    if (!editGroup || !editGroup.name.trim()) { toast.error('กรุณากรอกชื่อกลุ่ม'); return }
    setGroups(prev => {
      const exists = prev.find(g => g.id === editGroup.id)
      if (exists) return prev.map(g => g.id === editGroup.id ? editGroup : g)
      return [...prev, editGroup]
    })
    setEditGroup(null)
  }

  // ─── ทดสอบส่ง notification ─────────────────────────────────────────
  const handleTest = async (g: NotifyGroup) => {
    if (!g.bot_token || !g.chat_id) { toast.error('กลุ่มนี้ยังไม่ได้กรอก Bot Token / Chat ID'); return }
    // ⭐ บันทึกก่อนทดสอบ
    setSaving(true)
    try { await notificationApi.saveGroups(groups) } catch {}
    setSaving(false)

    setTestingId(g.id)
    try {
      await notificationApi.test(g.id)
      toast.success(`ส่งข้อความทดสอบไป "${g.name}" สำเร็จ`)
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ส่งไม่สำเร็จ'
      toast.error(msg)
    } finally { setTestingId(null) }
  }

  // ─── Loading ────────────────────────────────────────────────────────
  if (loading) return <div className="page-container"><Loading inline text="กำลังโหลด..." /></div>

  // ─── Render ─────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} />
          <div>
            <h1>ตั้งค่าระบบแจ้งเตือน Telegram</h1>
            <p className="label" style={{ marginTop: 2 }}>{groups.length} กลุ่ม</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleAdd} className="btn btn-secondary" style={{ gap: 6 }}>
            <Plus size={14} /> เพิ่มกลุ่ม
          </button>
          <button onClick={handleSaveAll} className="btn btn-primary" style={{ gap: 6 }} disabled={saving}>
            <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกทั้งหมด'}
          </button>
        </div>
      </div>

      {/* ── รายการกลุ่ม ─────────────────────────────────────────────── */}
      {groups.length === 0 ? (
        <div className="card-surface" style={{ padding: 40, textAlign: 'center', color: 'var(--text-tertiary)' }}>
          ยังไม่มีกลุ่มแจ้งเตือน — กดปุ่ม "เพิ่มกลุ่ม" เพื่อเริ่มต้น
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map(g => {
            // นับจุดแจ้งเตือนที่เปิดอยู่
            const enabledCount = NOTIFY_POINTS.filter(np => g[np.key] as boolean).length
            return (
              <div key={g.id} className="card-surface" style={{ padding: 20, opacity: g.active ? 1 : 0.5, transition: 'opacity 0.2s' }}>
                {/* ── Row 1: ชื่อกลุ่ม + toggle + actions ─────────────── */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {/* Toggle active */}
                    <Toggle checked={g.active} onChange={() => toggleActive(g.id)} />
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{g.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {g.chat_id ? `Chat: ${g.chat_id}` : 'ยังไม่ได้ตั้ง Chat ID'} · {enabledCount}/{NOTIFY_POINTS.length} จุด
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button onClick={() => handleTest(g)} disabled={testingId === g.id}
                      className="btn btn-ghost" style={{ fontSize: 12, gap: 4, padding: '0 8px' }}>
                      <Send size={13} /> {testingId === g.id ? 'กำลังส่ง...' : 'ทดสอบ'}
                    </button>
                    <button onClick={() => handleEdit(g)} className="btn btn-ghost" style={{ fontSize: 12, padding: '0 8px' }}>
                      <Pencil size={13} />
                    </button>
                    <button onClick={() => handleDuplicate(g)} className="btn btn-ghost" style={{ fontSize: 12, padding: '0 8px' }} title="สร้างสำเนา">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => handleDelete(g)} className="btn btn-ghost" style={{ fontSize: 12, padding: '0 8px', color: 'var(--status-error)' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* ── Row 2: จุดแจ้งเตือนที่เปิดอยู่ (badges) ─────────── */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {NOTIFY_POINTS.map(np => (
                    <span key={np.key} style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 4,
                      background: (g[np.key] as boolean) ? 'var(--accent-subtle)' : 'var(--bg-elevated)',
                      color: (g[np.key] as boolean) ? 'var(--accent)' : 'var(--text-tertiary)',
                      fontWeight: (g[np.key] as boolean) ? 500 : 400,
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

      {/* ══ Modal: เพิ่ม/แก้ไขกลุ่ม ════════════════════════════════════ */}
      {editGroup && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={() => setEditGroup(null)}>
          <div className="card-surface" style={{
            padding: 24, maxWidth: 560, width: '100%', maxHeight: '90vh', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                {groups.find(g => g.id === editGroup.id) ? 'แก้ไขกลุ่มแจ้งเตือน' : 'เพิ่มกลุ่มแจ้งเตือน'}
              </h2>
              <button onClick={() => setEditGroup(null)} className="btn btn-ghost" style={{ width: 32, height: 32, padding: 0 }}>✕</button>
            </div>

            {/* ── ชื่อกลุ่ม ───────────────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 4 }}>ชื่อกลุ่ม *</div>
              <input className="input" placeholder="เช่น กลุ่มแอดมิน, ฝ่ายการเงิน, เจ้าของ"
                value={editGroup.name}
                onChange={e => setEditGroup({ ...editGroup, name: e.target.value })} />
            </div>

            {/* ── Telegram Config ──────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div className="label">Telegram</div>
              <button onClick={() => setShowHelp(!showHelp)} className="btn btn-ghost" style={{ fontSize: 11, height: 24 }}>
                {showHelp ? 'ซ่อน' : '❓ วิธีหา Token + Chat ID'}
              </button>
            </div>

            {/* คำแนะนำ */}
            {showHelp && (
              <div style={{
                background: 'var(--bg-elevated)', borderRadius: 8,
                padding: 14, marginBottom: 12, fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>วิธีหา Bot Token</div>
                <div>1. เปิด Telegram ค้นหา <span style={{ color: 'var(--accent)' }}>@BotFather</span></div>
                <div>2. พิมพ์ <code style={{ background: '#222', padding: '1px 4px', borderRadius: 3 }}>/newbot</code> ตั้งชื่อ Bot</div>
                <div>3. คัดลอก Token ที่ได้มาใส่</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, marginBottom: 6 }}>วิธีหา Chat ID (กลุ่ม)</div>
                <div>1. เพิ่ม Bot เข้ากลุ่ม แล้วส่งข้อความ</div>
                <div>2. เปิด: <code style={{ background: '#222', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>
                  https://api.telegram.org/bot[TOKEN]/getUpdates
                </code></div>
                <div>3. หา chat id (ตัวเลข รวมเครื่องหมายลบ)</div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Bot Token</div>
                <input className="input" placeholder="123456:ABC-DEF..."
                  value={editGroup.bot_token}
                  onChange={e => setEditGroup({ ...editGroup, bot_token: e.target.value })} />
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Chat ID / Group ID</div>
                <input className="input" placeholder="-1001234567890"
                  value={editGroup.chat_id}
                  onChange={e => setEditGroup({ ...editGroup, chat_id: e.target.value })} />
              </div>
            </div>

            {/* ── จุดแจ้งเตือน (toggles) ───────────────────────────────── */}
            <div className="label" style={{ marginBottom: 8 }}>จุดแจ้งเตือน</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              {NOTIFY_POINTS.map(np => (
                <div key={np.key} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 16 }}>{np.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{np.label}</span>
                  </div>
                  <Toggle
                    checked={editGroup[np.key] as boolean}
                    onChange={v => setEditGroup({ ...editGroup, [np.key]: v })}
                  />
                </div>
              ))}
            </div>

            {/* ── Threshold ──────────────────────────────────────────── */}
            {(editGroup.on_large_bet || editGroup.on_large_win) && (
              <div style={{ marginBottom: 16 }}>
                <div className="label" style={{ marginBottom: 8 }}>Threshold ยอดสูง</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {editGroup.on_large_bet && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>เดิมพันเกิน (฿)</div>
                      <input type="number" className="input" value={editGroup.large_bet_min || ''}
                        onChange={e => setEditGroup({ ...editGroup, large_bet_min: Number(e.target.value) })} />
                    </div>
                  )}
                  {editGroup.on_large_win && (
                    <div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>ถูกรางวัลเกิน (฿)</div>
                      <input type="number" className="input" value={editGroup.large_win_min || ''}
                        onChange={e => setEditGroup({ ...editGroup, large_win_min: Number(e.target.value) })} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Buttons ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditGroup(null)} className="btn btn-secondary" style={{ flex: 1 }}>ยกเลิก</button>
              <button onClick={saveFromModal} className="btn btn-primary" style={{ flex: 1 }}>บันทึกกลุ่ม</button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmDialog */}
      {dialog && <ConfirmDialog {...dialog} />}
    </div>
  )
}

// ─── Toggle Component ─────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: checked ? 'var(--accent)' : '#333', position: 'relative', transition: 'background 0.2s',
      flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: 9, background: 'white',
        position: 'absolute', top: 3, left: checked ? 23 : 3, transition: 'left 0.2s',
      }} />
    </button>
  )
}
