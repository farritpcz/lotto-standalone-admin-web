/**
 * ThemeToggle — สลับธีม Dark/Light
 *
 * - อ่าน/เขียน localStorage key "admin_theme"
 * - Set attribute [data-theme] บน <html>
 * - Animated icon transition (sun ↔ moon)
 *
 * ใช้ที่ sidebar footer หรือ topbar
 *
 * Note: Theme init อยู่ใน layout.tsx เป็น inline script
 *       เพื่อป้องกัน flash ตอน SSR → hydration
 */

'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

const THEME_KEY = 'admin_theme'
type Theme = 'dark' | 'light'

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = (localStorage.getItem(THEME_KEY) as Theme) || 'dark'
    setTheme(saved)
    setMounted(true)
  }, [])

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem(THEME_KEY, next)
    document.documentElement.setAttribute('data-theme', next)
  }

  if (!mounted) {
    // Render placeholder ขนาดเดียวกัน (กัน layout shift)
    return (
      <button
        className="btn btn-ghost"
        style={{
          width: compact ? 34 : '100%',
          justifyContent: compact ? 'center' : 'flex-start',
          gap: 8, color: 'var(--text-tertiary)', fontSize: 13,
        }}
        aria-label="Toggle theme"
      >
        <Sun size={15} strokeWidth={1.75} style={{ opacity: 0.6 }} />
      </button>
    )
  }

  const Icon = theme === 'dark' ? Sun : Moon
  const label = theme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'

  return (
    <button
      onClick={toggle}
      className="btn btn-ghost"
      title={label}
      aria-label={label}
      style={{
        width: compact ? 34 : '100%',
        justifyContent: compact ? 'center' : 'flex-start',
        gap: 8, color: 'var(--text-secondary)', fontSize: 13,
        padding: compact ? 0 : undefined,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          transition: 'transform 0.4s var(--ease-bounce)',
          transform: `rotate(${theme === 'dark' ? 0 : 360}deg)`,
        }}
      >
        <Icon size={15} strokeWidth={1.75} />
      </span>
      {!compact && <span>{label}</span>}
    </button>
  )
}
