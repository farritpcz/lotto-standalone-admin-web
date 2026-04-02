/**
 * AdminSidebar — Linear/Vercel style sidebar navigation
 *
 * Design:
 * - width 220px, bg #0f0f0f, border-right
 * - nav items: height 32px, radius 6px
 * - active: accent-subtle bg + accent text + left border
 * - icons: 15px SVG stroke-width 1.5
 * - badge count สำหรับ pending deposits/withdrawals
 *
 * ⭐ comment เยอะ เพื่อให้ไล่ง่าย
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

// =============================================================================
// เมนู items — แบ่ง group, icon เป็น SVG path
// =============================================================================
const menuGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1' },
      { href: '/members', label: 'สมาชิก', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197' },
    ],
  },
  {
    label: 'หวย',
    items: [
      { href: '/lotteries', label: 'ประเภทหวย', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { href: '/rounds', label: 'รอบหวย', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/results', label: 'กรอกผล', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
      { href: '/bans', label: 'เลขอั้น', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636' },
      { href: '/bans/auto', label: 'อั้นอัตโนมัติ', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
      { href: '/rates', label: 'อัตราจ่าย', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1' },
      { href: '/yeekee', label: 'ยี่กี', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/deposits', label: 'รายการฝาก', icon: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', badge: 'deposits' as const },
      { href: '/withdrawals', label: 'รายการถอน', icon: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1', badge: 'withdrawals' as const },
      { href: '/bets', label: 'รายการแทง', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
      { href: '/transactions', label: 'ธุรกรรม', icon: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z' },
    ],
  },
  {
    label: 'สมาชิก',
    items: [
      { href: '/member-levels', label: 'Level สมาชิก', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
      { href: '/promotions', label: 'โปรโมชั่น', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { href: '/reports', label: 'รายงาน', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
      { href: '/affiliate', label: 'Affiliate', icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1' },
      { href: '/staff', label: 'พนักงาน', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
      { href: '/cms', label: 'จัดการเว็บ', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
      { href: '/activity-log', label: 'Activity Log', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
      { href: '/settings', label: 'ตั้งค่า', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
      { href: '/settings/bank-accounts', label: 'บัญชีฝาก/ถอน', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
      { href: '/settings/notifications', label: 'แจ้งเตือน', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    ],
  },
]

// =============================================================================
// Component
// =============================================================================
interface AdminSidebarProps {
  pendingDeposits?: number
  pendingWithdrawals?: number
}

export default function AdminSidebar({ pendingDeposits = 0, pendingWithdrawals = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Badge counts
  const badges: Record<string, number> = {
    deposits: pendingDeposits,
    withdrawals: pendingWithdrawals,
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    router.push('/login')
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Sidebar content (ใช้ทั้ง desktop + mobile)
  // ────────────────────────────────────────────────────────────────────────────
  const sidebarContent = (
    <div style={{
      width: 'var(--sidebar-width)', height: '100%',
      background: 'var(--sidebar-bg)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
    }}>
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <div style={{ padding: '16px 14px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28, borderRadius: 6,
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, color: 'black', fontSize: 13,
        }}>L</div>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
          LOTTO Admin
        </span>
      </div>

      {/* ── Nav groups ────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {menuGroups.map((group, gi) => (
          <div key={group.label} style={{ marginBottom: 16 }}>
            {/* Group label */}
            <div style={{
              padding: '4px 8px 6px', fontSize: 11, fontWeight: 500,
              textTransform: 'uppercase', letterSpacing: '0.08em',
              color: 'var(--text-tertiary)',
            }}>
              {group.label}
            </div>

            {/* Items */}
            {group.items.map((item, ii) => {
              const isActive = pathname === item.href
              const badgeKey = (item as { badge?: string }).badge
              const badgeCount = badgeKey ? badges[badgeKey] || 0 : 0

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    height: 32, padding: '0 8px',
                    borderRadius: 6, fontSize: 13,
                    textDecoration: 'none',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                    background: isActive ? 'var(--accent-subtle)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'all 0.15s ease',
                    marginBottom: 1,
                    // stagger animation
                    animation: `fadeSlideUp 0.2s ease backwards`,
                    animationDelay: `${(gi * 4 + ii) * 30}ms`,
                  }}
                >
                  {/* Icon (SVG path) */}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                    strokeLinecap="round" strokeLinejoin="round"
                    style={{ width: 15, height: 15, flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
                    <path d={item.icon} />
                  </svg>

                  <span style={{ flex: 1 }}>{item.label}</span>

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <span style={{
                      background: 'var(--status-error)',
                      color: 'white', fontSize: 10, fontWeight: 700,
                      padding: '1px 6px', borderRadius: 8,
                      minWidth: 18, textAlign: 'center',
                      fontVariantNumeric: 'tabular-nums',
                    }}>
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── Footer: Logout ──────────────────────────────────────────────── */}
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={handleLogout}
          className="btn btn-ghost"
          style={{
            width: '100%', justifyContent: 'flex-start', gap: 8,
            color: 'var(--text-tertiary)', fontSize: 13,
          }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
            strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15 }}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </div>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop sidebar (fixed) */}
      <div className="sidebar-desktop" style={{
        display: 'none', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
      }}>
        {sidebarContent}
      </div>

      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="sidebar-mobile-btn"
        style={{
          display: 'none', position: 'fixed', top: 10, left: 10, zIndex: 50,
          width: 36, height: 36, borderRadius: 6,
          background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          cursor: 'pointer', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth={1.5} style={{ width: 18, height: 18 }}>
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Mobile overlay + sidebar */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 60 }}>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
