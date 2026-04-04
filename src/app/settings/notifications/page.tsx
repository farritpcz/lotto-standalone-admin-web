/**
 * Admin — ตั้งค่าระบบแจ้งเตือน Telegram
 *
 * ⭐ เชื่อม API จริง:
 *  - GET /api/v1/notifications/config
 *  - PUT /api/v1/notifications/config
 *  - POST /api/v1/notifications/test
 *
 * ความสัมพันธ์:
 * - api.ts → notificationApi
 * - admin-api (#5) → handler/notifications.go
 * - ส่ง notification จริงเมื่อเกิด event (deposit/withdraw/new_member/large_win)
 */
'use client'

import { useEffect, useState, useCallback } from 'react'
import { notificationApi, type NotifyConfig } from '@/lib/api'
import { useToast } from '@/components/Toast'
import Loading from '@/components/Loading'
import { Bell, Send, Save } from 'lucide-react'

// ─── จุดแจ้งเตือนที่ตั้งได้ ─────────────────────────────────────────
const NOTIFY_TOGGLES: { key: keyof NotifyConfig; label: string; icon: string; desc: string }[] = [
  { key: 'on_deposit', label: 'คำขอฝากเงิน', icon: '📥', desc: 'แจ้งเตือนเมื่อสมาชิกแจ้งฝากเงิน' },
  { key: 'on_withdraw', label: 'คำขอถอนเงิน', icon: '📤', desc: 'แจ้งเตือนเมื่อสมาชิกแจ้งถอนเงิน' },
  { key: 'on_new_member', label: 'สมัครสมาชิกใหม่', icon: '👤', desc: 'แจ้งเตือนเมื่อมีสมาชิกสมัครใหม่' },
  { key: 'on_large_win', label: 'ถูกรางวัลยอดสูง', icon: '💰', desc: 'แจ้งเตือนเมื่อถูกรางวัลเกินจำนวนที่ตั้งไว้' },
]

// ─── Default Config ──────────────────────────────────────────────────
const defaultConfig: NotifyConfig = {
  enabled: false, bot_token: '', chat_id: '',
  on_deposit: true, on_withdraw: true, on_new_member: true,
  on_large_win: false, large_win_min: 10000,
}

export default function NotificationSettingsPage() {
  const [config, setConfig] = useState<NotifyConfig>(defaultConfig)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { toast } = useToast()

  // ─── โหลด config จาก API ───────────────────────────────────────────
  const loadConfig = useCallback(() => {
    setLoading(true)
    notificationApi.getConfig()
      .then(res => setConfig(res.data.data || defaultConfig))
      .catch(() => {}) // ใช้ default ถ้า API ยังไม่มีข้อมูล
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadConfig() }, [loadConfig])

  // ─── บันทึก config ─────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      await notificationApi.updateConfig(config)
      toast.success('บันทึกการตั้งค่าสำเร็จ')
    } catch { toast.error('บันทึกไม่สำเร็จ') }
    finally { setSaving(false) }
  }

  // ─── ทดสอบส่ง ──────────────────────────────────────────────────────
  const handleTest = async () => {
    if (!config.bot_token || !config.chat_id) {
      toast.error('กรุณากรอก Bot Token และ Chat ID ก่อน')
      return
    }
    // ⭐ บันทึกก่อนทดสอบ (ให้ API มี token/chat_id สำหรับส่ง)
    setSaving(true)
    try { await notificationApi.updateConfig(config) } catch {}
    setSaving(false)

    setTesting(true)
    try {
      await notificationApi.test()
      toast.success('ส่งข้อความทดสอบสำเร็จ — ตรวจสอบ Telegram')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'ส่งไม่สำเร็จ'
      toast.error(msg)
    } finally { setTesting(false) }
  }

  if (loading) return <div className="page-container"><Loading inline text="กำลังโหลด..." /></div>

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bell size={20} />
          <h1>ตั้งค่าระบบแจ้งเตือน Telegram</h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleTest} className="btn btn-secondary" style={{ gap: 6 }} disabled={testing}>
            <Send size={14} /> {testing ? 'กำลังส่ง...' : 'ทดสอบส่ง'}
          </button>
          <button onClick={handleSave} className="btn btn-primary" style={{ gap: 6 }} disabled={saving}>
            <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* ── Master Toggle: เปิด/ปิดทั้งระบบ ────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>เปิดใช้งานระบบแจ้งเตือน</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              เมื่อเปิด ระบบจะส่ง notification ไปยัง Telegram ตามจุดที่เลือก
            </div>
          </div>
          <Toggle checked={config.enabled} onChange={v => setConfig(c => ({ ...c, enabled: v }))} />
        </div>
      </div>

      {/* ── Telegram Config: Bot Token + Chat ID ──────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16, opacity: config.enabled ? 1 : 0.5 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div className="label">Telegram Bot</div>
          <button onClick={() => setShowHelp(!showHelp)} className="btn btn-ghost" style={{ fontSize: 11, height: 24 }}>
            {showHelp ? 'ซ่อนคำแนะนำ' : '❓ วิธีตั้งค่า'}
          </button>
        </div>

        {/* คำแนะนำวิธีหา Bot Token + Chat ID */}
        {showHelp && (
          <div style={{
            background: 'var(--bg-elevated)', borderRadius: 8,
            padding: 14, marginBottom: 16, fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>วิธีหา Bot Token</div>
            <div>1. เปิด Telegram ค้นหา <span style={{ color: 'var(--accent)' }}>@BotFather</span></div>
            <div>2. พิมพ์ <code style={{ background: '#222', padding: '1px 4px', borderRadius: 3 }}>/newbot</code> แล้วตั้งชื่อ Bot</div>
            <div>3. BotFather จะส่ง Token กลับมา</div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 12, marginBottom: 6 }}>วิธีหา Chat ID</div>
            <div>1. เพิ่ม Bot เข้ากลุ่ม Telegram แล้วส่งข้อความ</div>
            <div>2. เปิด URL: <code style={{ background: '#222', padding: '1px 4px', borderRadius: 3, fontSize: 11 }}>
              https://api.telegram.org/bot[TOKEN]/getUpdates
            </code></div>
            <div>3. หา chat id ในผลลัพธ์ (เลขรวมเครื่องหมายลบ)</div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Bot Token</div>
            <input className="input" placeholder="123456:ABC-DEF..." value={config.bot_token}
              onChange={e => setConfig(c => ({ ...c, bot_token: e.target.value }))} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Chat ID / Group ID</div>
            <input className="input" placeholder="-1001234567890" value={config.chat_id}
              onChange={e => setConfig(c => ({ ...c, chat_id: e.target.value }))} />
          </div>
        </div>
      </div>

      {/* ── จุดแจ้งเตือน (Toggles) ───────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, opacity: config.enabled ? 1 : 0.5 }}>
        <div className="label" style={{ marginBottom: 16 }}>จุดแจ้งเตือน</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {NOTIFY_TOGGLES.map(nt => (
            <div key={nt.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>{nt.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{nt.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{nt.desc}</div>
                </div>
              </div>
              <Toggle checked={config[nt.key] as boolean}
                onChange={v => setConfig(c => ({ ...c, [nt.key]: v }))} />
            </div>
          ))}

          {/* Threshold สำหรับยอดสูง */}
          {config.on_large_win && (
            <div style={{ padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>
                ยอดถูกรางวัลขั้นต่ำที่แจ้ง (บาท)
              </div>
              <input type="number" className="input" style={{ maxWidth: 200 }}
                value={config.large_win_min || ''}
                onChange={e => setConfig(c => ({ ...c, large_win_min: Number(e.target.value) }))} />
            </div>
          )}
        </div>
      </div>
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
