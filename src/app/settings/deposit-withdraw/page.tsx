/**
 * Admin — ตั้งค่าระบบฝาก/ถอน (Deposit/Withdraw Settings)
 *
 * ฟีเจอร์:
 * - ขั้นต่ำ/สูงสุด ฝากเงิน
 * - ขั้นต่ำ/สูงสุด ถอนเงิน
 * - เปิด/ปิด อนุมัติอัตโนมัติ
 *
 * ⭐ อ่าน/เขียนผ่าน settings key-value API
 * Design System: Linear/Vercel dark theme
 */
'use client'

import { useEffect, useState } from 'react'
import { settingApi } from '@/lib/api'

interface DepositWithdrawSettings {
  min_deposit: string
  max_deposit: string
  min_withdraw: string
  max_withdraw: string
  auto_approve_deposit: string
  auto_approve_withdraw: string
}

const DEFAULT_SETTINGS: DepositWithdrawSettings = {
  min_deposit: '100',
  max_deposit: '0',
  min_withdraw: '300',
  max_withdraw: '0',
  auto_approve_deposit: 'false',
  auto_approve_withdraw: 'false',
}

export default function DepositWithdrawSettingsPage() {
  const [settings, setSettings] = useState<DepositWithdrawSettings>(DEFAULT_SETTINGS)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  useEffect(() => {
    if (message) {
      const t = setTimeout(() => setMessage(null), 3000)
      return () => clearTimeout(t)
    }
  }, [message])

  const loadSettings = async () => {
    setLoading(true)
    try {
      const res = await settingApi.get()
      const all = res.data.data || []
      const mapped = { ...DEFAULT_SETTINGS }
      for (const s of all) {
        if (s.key in mapped) {
          (mapped as Record<string, string>)[s.key] = s.value
        }
      }
      setSettings(mapped)
    } catch {
      // ใช้ default
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingApi.update(settings as unknown as Record<string, string>)
      setMessage({ type: 'success', text: 'บันทึกสำเร็จ' })
    } catch {
      setMessage({ type: 'error', text: 'บันทึกไม่สำเร็จ' })
    } finally {
      setSaving(false)
    }
  }

  const update = (key: keyof DepositWithdrawSettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: 60, color: 'var(--text-secondary)' }}>
        กำลังโหลด...
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>ตั้งค่าระบบฝาก/ถอน</h1>
      </div>

      {message && (
        <div style={{
          background: message.type === 'success' ? 'var(--status-success-bg)' : 'var(--status-error-bg)',
          color: message.type === 'success' ? 'var(--status-success)' : 'var(--status-error)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13,
        }}>
          {message.type === 'success' ? '~' : '~'} {message.text}
        </div>
      )}

      {/* ── ฝากเงิน ──────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <p className="label" style={{ marginBottom: 16 }}>ฝากเงิน</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>ขั้นต่ำ (บาท)</div>
            <input type="number" className="input" value={settings.min_deposit}
              onChange={e => update('min_deposit', e.target.value)} min={0} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>สูงสุด (บาท) — 0 = ไม่จำกัด</div>
            <input type="number" className="input" value={settings.max_deposit}
              onChange={e => update('max_deposit', e.target.value)} min={0} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.auto_approve_deposit === 'true'}
            onChange={e => update('auto_approve_deposit', e.target.checked ? 'true' : 'false')}
            style={{ accentColor: 'var(--accent)' }} />
          อนุมัติฝากเงินอัตโนมัติ (ไม่ต้องรอแอดมินตรวจสอบ)
        </label>
      </div>

      {/* ── ถอนเงิน ──────────────────────────────────────────── */}
      <div className="card-surface" style={{ padding: 20, marginBottom: 16 }}>
        <p className="label" style={{ marginBottom: 16 }}>ถอนเงิน</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>ขั้นต่ำ (บาท)</div>
            <input type="number" className="input" value={settings.min_withdraw}
              onChange={e => update('min_withdraw', e.target.value)} min={0} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>สูงสุด (บาท) — 0 = ไม่จำกัด</div>
            <input type="number" className="input" value={settings.max_withdraw}
              onChange={e => update('max_withdraw', e.target.value)} min={0} />
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
          <input type="checkbox" checked={settings.auto_approve_withdraw === 'true'}
            onChange={e => update('auto_approve_withdraw', e.target.checked ? 'true' : 'false')}
            style={{ accentColor: 'var(--accent)' }} />
          อนุมัติถอนเงินอัตโนมัติ (ไม่ต้องรอแอดมินตรวจสอบ)
        </label>
      </div>

      {/* ── ปุ่มบันทึก ────────────────────────────────────────── */}
      <button className="btn btn-primary" onClick={handleSave} disabled={saving}
        style={{ width: '100%', height: 42, fontSize: 14, fontWeight: 600 }}>
        {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
      </button>

      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-tertiary)', padding: '12px 16px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
        หมายเหตุ: ตั้งค่าสูงสุด = 0 หมายถึงไม่จำกัดยอด · การเปิดอนุมัติอัตโนมัติควรใช้ร่วมกับระบบตรวจสอบการทุจริต
      </div>
    </div>
  )
}
