/**
 * Admin — ตั้งค่าระบบ
 */
'use client'
import { useEffect, useState } from 'react'
import { settingApi } from '@/lib/api'

interface Setting { id: number; key: string; value: string; description: string }

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => { settingApi.get().then(res => setSettings(res.data.data || [])) }, [])

  const handleSave = async () => {
    setSaving(true)
    const data: Record<string, string> = {}
    settings.forEach(s => { data[s.key] = s.value })
    await settingApi.update(data)
    setMessage('✅ บันทึกสำเร็จ')
    setSaving(false)
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">ตั้งค่าระบบ</h1>
      {message && <div className="bg-green-900/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{message}</div>}
      <div className="bg-gray-800 rounded-xl p-5 space-y-4">
        {settings.map(s => (
          <div key={s.id}>
            <label className="text-gray-400 text-sm">{s.description || s.key}</label>
            <input type="text" value={s.value} onChange={e => setSettings(prev => prev.map(p => p.id === s.id ? { ...p, value: e.target.value } : p))}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-2 mt-1" />
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold">
          {saving ? 'กำลังบันทึก...' : 'บันทึก'}
        </button>
      </div>
    </div>
  )
}
