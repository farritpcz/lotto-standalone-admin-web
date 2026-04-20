/**
 * NavItem — 1 แถว nav link (icon + label + badge)
 *
 * Rule: UI-only; พ่อส่ง isCollapsed + isActive + badgeCount มาให้
 * Related: AdminSidebar.tsx, components/sidebar/menu.ts
 */
'use client'
import Link from 'next/link'
import type { MenuItem } from './menu'

interface Props {
  item: MenuItem
  isActive: boolean
  isCollapsed: boolean
  badgeCount: number
  animationDelay: number
}

export default function NavItem({
  item,
  isActive,
  isCollapsed,
  badgeCount,
  animationDelay,
}: Props) {
  return (
    <Link
      href={item.href}
      title={isCollapsed ? item.label : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: isCollapsed ? 0 : 10,
        height: 34,
        padding: isCollapsed ? '0' : '0 10px',
        justifyContent: isCollapsed ? 'center' : 'flex-start',
        borderRadius: 8,
        fontSize: 13,
        textDecoration: 'none',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
        background: isActive
          ? 'linear-gradient(90deg, var(--accent-subtle), transparent 70%)'
          : 'transparent',
        boxShadow: isActive && !isCollapsed ? 'inset 3px 0 0 var(--accent)' : 'none',
        transition:
          'background 0.18s var(--ease-smooth), color 0.15s var(--ease-smooth), transform 0.15s var(--ease-smooth)',
        marginBottom: 2,
        position: 'relative',
        animation: 'fadeSlideUp 0.2s var(--ease-smooth) backwards',
        animationDelay: `${animationDelay}ms`,
      }}
      onMouseEnter={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--bg-hover)'
          e.currentTarget.style.color = 'var(--text-primary)'
        }
      }}
      onMouseLeave={e => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = 'var(--text-secondary)'
        }
      }}
    >
      <item.icon size={16} strokeWidth={1.75} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />

      {!isCollapsed && (
        <span
          style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {item.label}
        </span>
      )}

      {/* Badge — expanded: gradient pill; collapsed: dot indicator */}
      {badgeCount > 0 && !isCollapsed && (
        <span
          style={{
            background: 'var(--gradient-danger)',
            color: 'white',
            fontSize: 10,
            fontWeight: 800,
            padding: '1px 7px',
            borderRadius: 999,
            minWidth: 18,
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            boxShadow: '0 0 0 2px rgba(239,68,68,0.2), 0 2px 6px rgba(239,68,68,0.35)',
            letterSpacing: 0,
          }}
        >
          {badgeCount}
        </span>
      )}
      {badgeCount > 0 && isCollapsed && (
        <span
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--status-error)',
            boxShadow: '0 0 0 2px rgba(239,68,68,0.35)',
            animation: 'glowPulse 1.8s ease-in-out infinite',
          }}
        />
      )}
    </Link>
  )
}
