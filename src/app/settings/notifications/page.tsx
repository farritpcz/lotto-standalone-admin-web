/**
 * Admin — ตั้งค่าระบบแจ้งเตือน (Telegram Notifications)
 *
 * - ใส่ Telegram Bot Token + Chat ID
 * - เลือกจุดที่จะแจ้งเตือน: สมัคร, ฝาก, ถอน, กรอกผล
 * - ทดสอบส่ง test message
 *
 * ⭐ ตอนนี้เป็น UI — เมื่อ API พร้อมจะเชื่อมจริง
 */
'use client'

import { useState } from 'react'

/* ── จุดแจ้งเตือนที่ตั้งได้ ─────────────────────────────────────────── */
const notifyPoints = [
  { key: 'on_register', label: 'สมาชิกสมัครใหม่', desc: 'แจ้งเตือนเมื่อมีสมาชิกสมัครใหม่' },
  { key: 'on_deposit', label: 'สมาชิกแจ้งฝากเงิน', desc: 'แจ้งเตือนเมื่อมีรายการฝากเงินใหม่ (pending)' },
  { key: 'on_withdraw', label: 'สมาชิกแจ้งถอนเงิน', desc: 'แจ้งเตือนเมื่อมีรายการถอนเงินใหม่ (pending)' },
  { key: 'on_result', label: 'กรอกผลรางวัล', desc: 'แจ้งเตือนเมื่อแอดมินกรอกผลรางวัลสำเร็จ' },
  { key: 'on_large_bet', label: 'เดิมพันยอดสูง', desc: 'แจ้งเตือนเมื่อมี bet ยอดสูงกว่าที่กำหนด' },
  { key: 'on_large_win', label: 'ถูกรางวัลยอดสูง', desc: 'แจ้งเตือนเมื่อมีคนถูกรางวัลยอดสูง' },
]

export default function NotificationSettingsPage() {
  const [botToken, setBotToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    on_register: true, on_deposit: true, on_withdraw: true,
    on_result: true, on_large_bet: false, on_large_win: false,
  })
  const [largeBetThreshold, setLargeBetThreshold] = useState('5000')
  const [largeWinThreshold, setLargeWinThreshold] = useState('50000')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setSaving(true)
    // TODO: save to API
    await new Promise(r => setTimeout(r, 500))
    setMessage('บันทึกสำเร็จ')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleTest = async () => {
    if (!botToken || !chatId) { setMessage('กรุณากรอก Bot Token + Chat ID'); return }
    setTesting(true)
    // TODO: send test message via API
    await new Promise(r => setTimeout(r, 1000))
    setMessage('ส่ง test message สำเร็จ (mock)')
    setTesting(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่าระบบแจ้งเตือน</h1>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary">
          {saving ? 'กำลังบันทึก...' : '💾 บันทึก'}
        </button>
      </div>

      {message && (
        <div style={{
          background: message.includes('สำเร็จ') ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.includes('สำเร็จ') ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '8px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message}
        </div>
      )}

      {/* ── Telegram Config ──────────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <div className="label" style={{ marginBottom: 12 }}>Telegram Bot Config</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Bot Token</div>
            <input type="text" value={botToken} onChange={e => setBotToken(e.target.value)}
              placeholder="123456:ABC-DEF..." className="input" />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Chat ID / Group ID</div>
            <input type="text" value={chatId} onChange={e => setChatId(e.target.value)}
              placeholder="-1001234567890" className="input" />
          </div>
        </div>
        <button onClick={handleTest} disabled={testing} className="btn btn-secondary">
          {testing ? 'กำลังส่ง...' : '📤 ทดสอบส่งข้อความ'}
        </button>
      </div>

      {/* ── Notification Points ──────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20 }}>
        <div className="label" style={{ marginBottom: 12 }}>จุดแจ้งเตือน</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {notifyPoints.map(np => (
            <div key={np.key} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 0', borderBottom: '1px solid var(--border)',
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{np.label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{np.desc}</div>
                {/* Threshold inputs สำหรับ large bet/win */}
                {np.key === 'on_large_bet' && enabled.on_large_bet && (
                  <div style={{ marginTop: 6 }}>
                    <input type="number" value={largeBetThreshold} onChange={e => setLargeBetThreshold(e.target.value)}
                      className="input" style={{ width: 120, height: 28, fontSize: 12 }} placeholder="ยอดขั้นต่ำ" />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>บาท</span>
                  </div>
                )}
                {np.key === 'on_large_win' && enabled.on_large_win && (
                  <div style={{ marginTop: 6 }}>
                    <input type="number" value={largeWinThreshold} onChange={e => setLargeWinThreshold(e.target.value)}
                      className="input" style={{ width: 120, height: 28, fontSize: 12 }} placeholder="ยอดขั้นต่ำ" />
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', marginLeft: 6 }}>บาท</span>
                  </div>
                )}
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => setEnabled(prev => ({ ...prev, [np.key]: !prev[np.key] }))}
                style={{
                  width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
                  background: enabled[np.key] ? 'var(--accent)' : 'var(--bg-elevated)',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: 9,
                  background: 'white', position: 'absolute', top: 3,
                  left: enabled[np.key] ? 23 : 3, transition: 'left 0.2s',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
