/**
 * AdminSidebar — Linear/Vercel style sidebar navigation (orchestrator)
 *
 * Rule: orchestrator — state + mobile/desktop switcher, render delegated to
 *  components/sidebar/* (menu, NavItem, SidebarFooter, SidebarContent)
 *
 * Related:
 *  - components/sidebar/menu.ts — menuGroups, allMenuItems, canAccessMenu
 *  - components/sidebar/SidebarContent.tsx — shared layout
 *  - CommandPalette / Breadcrumbs ใช้ menuGroups + allMenuItems จาก ./sidebar/menu
 */
'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import SidebarContent from './sidebar/SidebarContent'
import type { BadgeKey } from './sidebar/menu'

// ⭐ re-export เพื่อไม่ break caller เดิม (CommandPalette, Breadcrumbs)
export { menuGroups, allMenuItems } from './sidebar/menu'

// localStorage key สำหรับ collapse state
const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed'

interface AdminSidebarProps {
  pendingDeposits?: number
  pendingWithdrawals?: number
}

export default function AdminSidebar({
  pendingDeposits = 0,
  pendingWithdrawals = 0,
}: AdminSidebarProps) {
  const pathname = usePathname()

  // ⭐ User state (type + role + permissions) — lazy init จาก localStorage
  //    ใช้ useState lazy function เพื่อหลีกเลี่ยง setState-in-effect rule
  //    ปลอดภัย SSR: component นี้ 'use client' ทำงานแค่ฝั่ง browser เท่านั้น
  const [isNodeUser] = useState(() =>
    typeof window !== 'undefined' && localStorage.getItem('user_type') === 'node',
  )
  const [nodeName] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('node_name') || '' : '',
  )
  const [userRole] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('admin_role') || 'owner' : 'owner',
  )
  const [userPermissions] = useState<string[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const perms = JSON.parse(localStorage.getItem('admin_permissions') || '[]')
      return Array.isArray(perms) ? perms : []
    } catch {
      return []
    }
  })

  // Collapse state — lazy init จาก localStorage (ไม่ใช้ effect)
  const [collapsed, setCollapsed] = useState(() =>
    typeof window !== 'undefined'
      ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true'
      : false,
  )

  const [mobileOpen, setMobileOpen] = useState(false)

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  // ใช้ prev-state pattern ของ React (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes)
  // — เทียบ pathname ในระหว่าง render แล้ว set state ตรงๆ — ไม่ต้องใช้ useEffect
  const [prevPathname, setPrevPathname] = useState(pathname)
  if (prevPathname !== pathname) {
    setPrevPathname(pathname)
    if (mobileOpen) setMobileOpen(false)
  }

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  const handleLogout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    localStorage.removeItem('user_type')
    localStorage.removeItem('node_id')
    localStorage.removeItem('node_role')
    localStorage.removeItem('node_name')
    localStorage.removeItem('share_percent')
    window.location.href = '/login'
  }

  const badges: Record<BadgeKey, number> = {
    deposits: pendingDeposits,
    withdrawals: pendingWithdrawals,
  }

  const sidebarWidth = collapsed ? 60 : 220

  const sharedProps = {
    pathname,
    badges,
    userRole,
    isNodeUser,
    nodeName,
    userPermissions,
    onToggleCollapse: toggleCollapse,
    onLogout: handleLogout,
  }

  return (
    <>
      {/* Desktop sidebar (fixed) */}
      <div
        className="sidebar-desktop"
        data-collapsed={collapsed}
        style={{
          display: 'none',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 40,
          width: sidebarWidth,
          transition: 'width 0.2s ease',
        }}
      >
        <SidebarContent {...sharedProps} isCollapsed={collapsed} />
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-btn"
        style={{
          display: 'none',
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 50,
          width: 36,
          height: 36,
          borderRadius: 6,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          cursor: 'pointer',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-secondary)"
          strokeWidth={1.5}
          style={{ width: 18, height: 18 }}
        >
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay + sidebar (forced expanded) */}
      {mobileOpen && (
        <>
          <div
            onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }}
          />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 60 }}>
            <SidebarContent {...sharedProps} isCollapsed={false} />
          </div>
        </>
      )}
    </>
  )
}
