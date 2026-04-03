/**
 * Theme Settings — ตั้งค่าสีธีมของ agent
 *
 * ⭐ เปลี่ยนสี → PUT /api/v1/agent/theme → bump theme_version
 * → หน้าบ้าน (member-web) เช็ค version → refetch สีใหม่อัตโนมัติ
 */

'use client'

import { useEffect, useState } from 'react'
import { agentThemeApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Palette, Save, RotateCcw, Eye } from 'lucide-react'

interface ThemeColors {
  theme_primary_color: string
  theme_secondary_color: string
  theme_bg_color: string
  theme_accent_color: string
  theme_card_gradient1: string
  theme_card_gradient2: string
  theme_nav_bg: string
  theme_header_bg: string
}

const DEFAULT_COLORS: ThemeColors = {
  theme_primary_color: '#34C759',
  theme_secondary_color: '#30DB5B',
  theme_bg_color: '#000000',
  theme_accent_color: '#2dd4bf',
  theme_card_gradient1: '#1a472a',
  theme_card_gradient2: '#2d6a4f',
  theme_nav_bg: '#0d1f1a',
  theme_header_bg: '#0d3d2e',
}

const PRESETS: { name: string; emoji: string; colors: ThemeColors }[] = [
  {
    name: 'Emerald Green',
    emoji: '💚',
    colors: { ...DEFAULT_COLORS },
  },
  {
    name: 'Royal Purple',
    emoji: '💜',
    colors: {
      theme_primary_color: '#AF52DE',
      theme_secondary_color: '#BF5AF2',
      theme_bg_color: '#0a0015',
      theme_accent_color: '#c084fc',
      theme_card_gradient1: '#2d1b4e',
      theme_card_gradient2: '#5b21b6',
      theme_nav_bg: '#1a0a2e',
      theme_header_bg: '#2d1b4e',
    },
  },
  {
    name: 'Black & Gold',
    emoji: '🏆',
    colors: {
      theme_primary_color: '#D4AF37',
      theme_secondary_color: '#FFD700',
      theme_bg_color: '#0a0a0a',
      theme_accent_color: '#F0C060',
      theme_card_gradient1: '#1a1a0a',
      theme_card_gradient2: '#3d3520',
      theme_nav_bg: '#111111',
      theme_header_bg: '#1a1a0a',
    },
  },
  {
    name: 'Ocean Blue',
    emoji: '🌊',
    colors: {
      theme_primary_color: '#007AFF',
      theme_secondary_color: '#5AC8FA',
      theme_bg_color: '#000a1a',
      theme_accent_color: '#64D2FF',
      theme_card_gradient1: '#0a2a4a',
      theme_card_gradient2: '#1a4a7a',
      theme_nav_bg: '#0a1628',
      theme_header_bg: '#0a2a4a',
    },
  },
  {
    name: 'Ruby Red',
    emoji: '❤️',
    colors: {
      theme_primary_color: '#FF3B30',
      theme_secondary_color: '#FF6961',
      theme_bg_color: '#0a0000',
      theme_accent_color: '#FF6B6B',
      theme_card_gradient1: '#3a0a0a',
      theme_card_gradient2: '#6a1a1a',
      theme_nav_bg: '#1a0808',
      theme_header_bg: '#3a0a0a',
    },
  },
]

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; desc: string }[] = [
  { key: 'theme_primary_color', label: 'Primary Color', desc: 'สีหลัก (ปุ่ม, active tab, link)' },
  { key: 'theme_secondary_color', label: 'Secondary Color', desc: 'สีรอง (gradient, hover)' },
  { key: 'theme_header_bg', label: 'Header Background', desc: 'พื้นหลัง header บนสุด' },
  { key: 'theme_nav_bg', label: 'Nav Background', desc: 'พื้นหลังเมนูล่าง' },
  { key: 'theme_card_gradient1', label: 'Card Gradient Start', desc: 'สีเริ่มต้น gradient (balance card)' },
  { key: 'theme_card_gradient2', label: 'Card Gradient End', desc: 'สีจบ gradient' },
  { key: 'theme_bg_color', label: 'Page Background', desc: 'พื้นหลังหน้าเว็บ' },
  { key: 'theme_accent_color', label: 'Accent Color', desc: 'สีเน้น (badge, indicator)' },
]

export default function ThemeSettingsPage() {
  const { toast } = useToast()
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS)
  const [original, setOriginal] = useState<ThemeColors>(DEFAULT_COLORS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    agentThemeApi.get().then(res => {
      const data = res.data?.data || {}
      const c: ThemeColors = {
        theme_primary_color: data.theme_primary_color || DEFAULT_COLORS.theme_primary_color,
        theme_secondary_color: data.theme_secondary_color || DEFAULT_COLORS.theme_secondary_color,
        theme_bg_color: data.theme_bg_color || DEFAULT_COLORS.theme_bg_color,
        theme_accent_color: data.theme_accent_color || DEFAULT_COLORS.theme_accent_color,
        theme_card_gradient1: data.theme_card_gradient1 || DEFAULT_COLORS.theme_card_gradient1,
        theme_card_gradient2: data.theme_card_gradient2 || DEFAULT_COLORS.theme_card_gradient2,
        theme_nav_bg: data.theme_nav_bg || DEFAULT_COLORS.theme_nav_bg,
        theme_header_bg: data.theme_header_bg || DEFAULT_COLORS.theme_header_bg,
      }
      setColors(c)
      setOriginal(c)
      setVersion(data.theme_version || 0)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await agentThemeApi.update(colors)
      setOriginal({ ...colors })
      setVersion(v => v + 1)
      toast.success('บันทึกธีมสำเร็จ — หน้าบ้านจะเห็นสีใหม่ทันที')
    } catch {
      toast.error('บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setColors({ ...original })
    toast.success('รีเซ็ตเป็นค่าที่บันทึกล่าสุด')
  }

  const applyPreset = (preset: typeof PRESETS[number]) => {
    setColors({ ...preset.colors })
    toast.success(`ใช้ธีม ${preset.name}`)
  }

  const hasChanges = JSON.stringify(colors) !== JSON.stringify(original)

  if (loading) return <div style={{ padding: 24, color: '#888' }}>กำลังโหลด...</div>

  return (
    <div style={{ padding: '16px 24px 80px', maxWidth: 800 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Palette size={24} color="var(--accent, #8b5cf6)" />
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Theme Settings</h1>
          <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
            ตั้งค่าสีธีมของเว็บ (version: {version})
          </p>
        </div>
      </div>

      {/* Presets */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#ccc' }}>Presets</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 10,
                background: '#1e1e2e', border: '1px solid #333',
                color: '#ddd', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'border-color 0.2s',
              }}
            >
              <span>{preset.emoji}</span>
              <span>{preset.name}</span>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: preset.colors.theme_primary_color,
                border: '1px solid rgba(255,255,255,0.2)',
              }} />
            </button>
          ))}
        </div>
      </div>

      {/* Color Fields */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {COLOR_FIELDS.map(field => (
          <div key={field.key} style={{
            background: '#1e1e2e', borderRadius: 12, padding: '14px 16px',
            border: '1px solid #2a2a3a',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#ddd' }}>{field.label}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{field.desc}</div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: colors[field.key],
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: `0 0 8px ${colors[field.key]}40`,
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={colors[field.key]}
                onChange={e => setColors({ ...colors, [field.key]: e.target.value })}
                style={{ width: 40, height: 32, border: 'none', cursor: 'pointer', background: 'transparent' }}
              />
              <input
                type="text"
                value={colors[field.key]}
                onChange={e => setColors({ ...colors, [field.key]: e.target.value })}
                style={{
                  flex: 1, background: '#111', border: '1px solid #333', borderRadius: 6,
                  padding: '6px 10px', color: '#ddd', fontSize: 13, fontFamily: 'monospace',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10, color: '#ccc', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} /> Live Preview
        </div>
        <div style={{
          background: colors.theme_bg_color, borderRadius: 16, overflow: 'hidden',
          border: '1px solid #333', maxWidth: 320,
        }}>
          {/* Mini header */}
          <div style={{
            background: colors.theme_header_bg, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: colors.theme_primary_color, fontSize: 12, fontWeight: 700 }}>฿ 3,351.00</span>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800 }}>LOTTO</span>
            <span style={{ color: '#888', fontSize: 12 }}>☰</span>
          </div>
          {/* Mini balance card */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.theme_card_gradient1}, ${colors.theme_card_gradient2})`,
            margin: '10px', borderRadius: 12, padding: '14px',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>ยอดเงินคงเหลือ</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>฿3,351.00</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ flex: 1, background: colors.theme_primary_color, color: '#fff', textAlign: 'center', borderRadius: 6, padding: '4px', fontSize: 11, fontWeight: 600 }}>ฝากเงิน</span>
              <span style={{ flex: 1, background: '#FF3B30', color: '#fff', textAlign: 'center', borderRadius: 6, padding: '4px', fontSize: 11, fontWeight: 600 }}>ถอนเงิน</span>
            </div>
          </div>
          {/* Mini nav */}
          <div style={{
            background: colors.theme_nav_bg, display: 'flex', justifyContent: 'space-around',
            padding: '8px 0', borderTop: '1px solid rgba(255,255,255,0.08)',
          }}>
            {['หน้าหลัก', 'แทงหวย', 'ผลรางวัล', 'กระเป๋า', 'บัญชี'].map((label, i) => (
              <span key={label} style={{
                fontSize: 8, color: i === 0 ? colors.theme_primary_color : '#888',
                textAlign: 'center', fontWeight: i === 0 ? 700 : 400,
              }}>
                {label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {hasChanges && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#111', borderTop: '1px solid #333',
          padding: '12px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end',
          zIndex: 100,
        }}>
          <button
            onClick={handleReset}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 20px', borderRadius: 8,
              background: '#2a2a3a', color: '#ddd', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} /> รีเซ็ต
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 24px', borderRadius: 8,
              background: '#3b82f6', color: '#fff', border: 'none',
              fontSize: 14, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกธีม'}
          </button>
        </div>
      )}
    </div>
  )
}
