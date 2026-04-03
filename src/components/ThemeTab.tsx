/**
 * ThemeTab — ตั้งค่าสีธีม (ใช้ใน CMS page)
 * Color picker + presets + live preview
 */

'use client'

import { useEffect, useState } from 'react'
import { agentThemeApi } from '@/lib/api'
import { useToast } from '@/components/Toast'
import { Save, RotateCcw, Eye, Shuffle } from 'lucide-react'

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
  { name: 'Emerald Green', emoji: '💚', colors: { ...DEFAULT_COLORS } },
  { name: 'Royal Purple', emoji: '💜', colors: { theme_primary_color:'#AF52DE',theme_secondary_color:'#BF5AF2',theme_bg_color:'#0a0015',theme_accent_color:'#c084fc',theme_card_gradient1:'#2d1b4e',theme_card_gradient2:'#5b21b6',theme_nav_bg:'#1a0a2e',theme_header_bg:'#2d1b4e' } },
  { name: 'Black & Gold', emoji: '🏆', colors: { theme_primary_color:'#D4AF37',theme_secondary_color:'#FFD700',theme_bg_color:'#0a0a0a',theme_accent_color:'#F0C060',theme_card_gradient1:'#1a1a0a',theme_card_gradient2:'#3d3520',theme_nav_bg:'#111111',theme_header_bg:'#1a1a0a' } },
  { name: 'Ocean Blue', emoji: '🌊', colors: { theme_primary_color:'#007AFF',theme_secondary_color:'#5AC8FA',theme_bg_color:'#000a1a',theme_accent_color:'#64D2FF',theme_card_gradient1:'#0a2a4a',theme_card_gradient2:'#1a4a7a',theme_nav_bg:'#0a1628',theme_header_bg:'#0a2a4a' } },
  { name: 'Ruby Red', emoji: '❤️', colors: { theme_primary_color:'#FF3B30',theme_secondary_color:'#FF6961',theme_bg_color:'#0a0000',theme_accent_color:'#FF6B6B',theme_card_gradient1:'#3a0a0a',theme_card_gradient2:'#6a1a1a',theme_nav_bg:'#1a0808',theme_header_bg:'#3a0a0a' } },
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

export default function ThemeTab() {
  const { toast } = useToast()
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS)
  const [original, setOriginal] = useState<ThemeColors>(DEFAULT_COLORS)
  const [saving, setSaving] = useState(false)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    agentThemeApi.get().then(res => {
      const data = res.data?.data || {}
      const c: ThemeColors = { ...DEFAULT_COLORS }
      for (const k of Object.keys(c) as (keyof ThemeColors)[]) {
        if (data[k]) c[k] = data[k]
      }
      setColors(c); setOriginal(c); setVersion(data.theme_version || 0)
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await agentThemeApi.update(colors as unknown as Record<string, string>)
      setOriginal({ ...colors }); setVersion(v => v + 1)
      toast.success('บันทึกธีมสำเร็จ — หน้าบ้านจะเห็นสีใหม่ทันที')
    } catch { toast.error('บันทึกไม่สำเร็จ') }
    setSaving(false)
  }

  const handleReset = () => { setColors({ ...original }); toast.success('รีเซ็ตเป็นค่าที่บันทึกล่าสุด') }
  const applyPreset = (p: typeof PRESETS[number]) => { setColors({ ...p.colors }); toast.success(`ใช้ธีม ${p.name}`) }

  const randomTheme = () => {
    const hue = Math.floor(Math.random() * 360)
    const hsl = (h: number, s: number, l: number) => {
      const a = s * Math.min(l, 1 - l)
      const f = (n: number) => { const k = (n + h / 30) % 12; return l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1) }
      const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
      return '#' + toHex(f(0)) + toHex(f(8)) + toHex(f(4))
    }
    setColors({
      theme_primary_color: hsl(hue, 0.7, 0.55),
      theme_secondary_color: hsl(hue, 0.6, 0.65),
      theme_bg_color: hsl(hue, 0.15, 0.04),
      theme_accent_color: hsl((hue + 30) % 360, 0.6, 0.65),
      theme_card_gradient1: hsl(hue, 0.4, 0.15),
      theme_card_gradient2: hsl(hue, 0.5, 0.25),
      theme_nav_bg: hsl(hue, 0.3, 0.08),
      theme_header_bg: hsl(hue, 0.4, 0.15),
    })
    toast.success('สุ่มสีใหม่แล้ว')
  }
  const hasChanges = JSON.stringify(colors) !== JSON.stringify(original)

  return (
    <div>
      {/* Presets */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)' }}>Presets</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={randomTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #1e1e2e, #2a2a3a)', border: '1px solid var(--border)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <Shuffle size={14} />
            Random
          </button>
          {PRESETS.map(preset => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', borderRadius: 10,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = preset.colors.theme_primary_color }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <span style={{ fontSize: 16 }}>{preset.emoji}</span>
              <span>{preset.name}</span>
              <span style={{
                width: 14, height: 14, borderRadius: '50%',
                background: preset.colors.theme_primary_color,
                border: '2px solid rgba(255,255,255,0.15)',
                boxShadow: `0 0 6px ${preset.colors.theme_primary_color}40`,
              }} />
            </button>
          ))}
        </div>
      </div>

      {/* Color Fields — 2 columns */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 12, marginBottom: 24,
      }}>
        {COLOR_FIELDS.map(field => (
          <div key={field.key} style={{
            background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 16px',
            border: '1px solid var(--border)',
            transition: 'border-color 0.15s',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{field.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{field.desc}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: colors[field.key],
                border: '2px solid rgba(255,255,255,0.12)',
                boxShadow: `0 2px 8px ${colors[field.key]}30`,
                transition: 'all 0.2s',
              }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={colors[field.key]}
                onChange={e => setColors({ ...colors, [field.key]: e.target.value })}
                style={{ width: 40, height: 34, border: 'none', cursor: 'pointer', background: 'transparent', borderRadius: 6 }}
              />
              <input
                type="text"
                value={colors[field.key]}
                onChange={e => setColors({ ...colors, [field.key]: e.target.value })}
                style={{
                  flex: 1, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8,
                  padding: '8px 12px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'monospace',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = colors[field.key] }}
                onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Live Preview */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Eye size={14} /> Live Preview <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>(version: {version})</span>
        </div>
        <div style={{
          background: colors.theme_bg_color, borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)', maxWidth: 320,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          {/* Mini header */}
          <div style={{
            background: colors.theme_header_bg, padding: '10px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: colors.theme_primary_color, fontSize: 12, fontWeight: 700 }}>฿ 3,351.00</span>
            <span style={{ color: '#fff', fontSize: 14, fontWeight: 800, letterSpacing: 1 }}>LOTTO</span>
            <span style={{ color: '#888', fontSize: 12 }}>☰</span>
          </div>
          {/* Mini balance card */}
          <div style={{
            background: `linear-gradient(135deg, ${colors.theme_card_gradient1}, ${colors.theme_card_gradient2})`,
            margin: 10, borderRadius: 12, padding: 14,
          }}>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>ยอดเงินคงเหลือ</div>
            <div style={{ color: '#fff', fontSize: 20, fontWeight: 800 }}>฿3,351.00</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <span style={{ flex: 1, background: colors.theme_primary_color, color: '#fff', textAlign: 'center', borderRadius: 8, padding: '5px', fontSize: 11, fontWeight: 600 }}>ฝากเงิน</span>
              <span style={{ flex: 1, background: '#FF3B30', color: '#fff', textAlign: 'center', borderRadius: 8, padding: '5px', fontSize: 11, fontWeight: 600 }}>ถอนเงิน</span>
            </div>
          </div>
          {/* Mini menu icons */}
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '8px 10px' }}>
            {['🎰','🏆','📋','🎯'].map(e => (
              <div key={e} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{e}</div>
            ))}
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

      {/* Action Buttons — sticky bottom */}
      {hasChanges && (
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'var(--bg-surface)', borderTop: '1px solid var(--border)',
          padding: '12px 0', display: 'flex', gap: 10,
          zIndex: 10,
        }}>
          <button onClick={handleReset} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 20px', borderRadius: 10,
            background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
            border: '1px solid var(--border)', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}>
            <RotateCcw size={14} /> รีเซ็ต
          </button>
          <button onClick={handleSave} disabled={saving} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 24px', borderRadius: 10,
            background: '#3b82f6', color: '#fff', border: 'none',
            fontSize: 13, fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            opacity: saving ? 0.6 : 1,
            boxShadow: '0 2px 12px rgba(59,130,246,0.3)',
          }}>
            <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึกธีม'}
          </button>
        </div>
      )}
    </div>
  )
}
