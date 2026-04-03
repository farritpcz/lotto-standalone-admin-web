/**
 * Admin — ตั้งค่าระบบ (System Settings)
 * Linear/Vercel dark theme
 *
 * - Dynamic key-value settings จาก DB
 * - Inline edit + save all
 */
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { settingApi } from '@/lib/api'

interface Setting { id: number; key: string; value: string; description: string }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    settingApi.get().then(res => setSettings(res.data.data || [])).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const data: Record<string, string> = {}
    settings.forEach(s => { data[s.key] = s.value })
    await settingApi.update(data).catch(() => {})
    setMessage('บันทึกสำเร็จ')
    setSaving(false)
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่าระบบ</h1>
      </div>

      {message && (
        <div style={{
          background: 'var(--status-success-bg)', color: 'var(--status-success)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          ✓ {message}
        </div>
      )}

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <Link href="/settings/theme" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10,
          background: '#1e1e2e', border: '1px solid #333',
          color: '#ddd', fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>
          🎨 Theme Settings
        </Link>
        <Link href="/settings/bank-accounts" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px', borderRadius: 10,
          background: '#1e1e2e', border: '1px solid #333',
          color: '#ddd', fontSize: 13, fontWeight: 600,
          textDecoration: 'none',
        }}>
          🏦 Bank Accounts
        </Link>
      </div>

      <div className="card-surface" style={{ padding: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {settings.map(s => (
            <div key={s.id}>
              <div className="label" style={{ marginBottom: 6 }}>{s.description || s.key}</div>
              <input
                type="text" value={s.value}
                onChange={e => setSettings(prev => prev.map(p => p.id === s.id ? { ...p, value: e.target.value } : p))}
                className="input"
              />
            </div>
          ))}

          <button onClick={handleSave} disabled={saving}
            className="btn btn-primary" style={{ width: '100%', height: 40, fontSize: 14 }}>
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
        </div>
      </div>
    </div>
  )
}
