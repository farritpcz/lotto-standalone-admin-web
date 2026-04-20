/**
 * SidebarContent — logo + nav groups + footer (shared by desktop/mobile)
 *
 * Rule: render only; props มาครบจาก AdminSidebar
 * Related: AdminSidebar.tsx, menu.ts, NavItem.tsx, SidebarFooter.tsx
 */
'use client'
import NavItem from './NavItem'
import SidebarFooter from './SidebarFooter'
import { canAccessMenu, menuGroups, type BadgeKey } from './menu'

interface Props {
  isCollapsed: boolean
  pathname: string
  badges: Record<BadgeKey, number>
  userRole: string
  isNodeUser: boolean
  nodeName: string
  userPermissions: string[]
  onToggleCollapse: () => void
  onLogout: () => void
}

export default function SidebarContent({
  isCollapsed,
  pathname,
  badges,
  userRole,
  isNodeUser,
  nodeName,
  userPermissions,
  onToggleCollapse,
  onLogout,
}: Props) {
  const width = isCollapsed ? 60 : 220

  return (
    <div
      style={{
        width,
        height: '100%',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.2s ease',
      }}
    >
      {/* ── Logo ───────────────────────────────────────────────── */}
      <div
        style={{
          padding: isCollapsed ? '16px 0 12px' : '16px 14px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: 'var(--gradient-brand)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            color: 'var(--text-on-accent)',
            fontSize: 14,
            boxShadow: 'var(--shadow-glow-accent), var(--shadow-inset-top)',
            letterSpacing: '-0.02em',
          }}
        >
          L
        </div>
        {!isCollapsed && (
          <span
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.015em',
              whiteSpace: 'nowrap',
            }}
          >
            {isNodeUser ? nodeName || 'สายงาน' : 'LOTTO Admin'}
          </span>
        )}
      </div>

      {/* ── Nav groups ─────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: isCollapsed ? '4px 4px' : '4px 8px' }}>
        {menuGroups.map((group, gi) => {
          const filteredItems = group.items.filter(item =>
            canAccessMenu(item.perm, userRole, isNodeUser, userPermissions),
          )
          if (filteredItems.length === 0) return null

          return (
            <div key={group.label} style={{ marginBottom: 16 }}>
              {/* Group label — ซ่อนเมื่อ collapsed */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: '4px 8px 6px',
                    fontSize: 11,
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  {group.label}
                </div>
              )}
              {/* Collapsed: separator line */}
              {isCollapsed && gi > 0 && (
                <div
                  style={{
                    height: 1,
                    background: 'var(--border)',
                    margin: '4px 8px 8px',
                  }}
                />
              )}

              {/* Items */}
              {filteredItems.map((item, ii) => {
                const isActive = pathname === item.href
                const badgeCount = item.badge ? badges[item.badge] || 0 : 0
                return (
                  <NavItem
                    key={item.href}
                    item={item}
                    isActive={isActive}
                    isCollapsed={isCollapsed}
                    badgeCount={badgeCount}
                    animationDelay={(gi * 4 + ii) * 30}
                  />
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <SidebarFooter
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        onLogout={onLogout}
      />
    </div>
  )
}
