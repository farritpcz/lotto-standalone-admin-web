/**
 * AdminSidebar — Linear/Vercel style sidebar navigation
 *
 * Design:
 * - Collapsible: 220px expanded / 60px collapsed
 * - bg #0f0f0f, border-right
 * - nav items: height 32px, radius 6px
 * - active: accent-subtle bg + accent text + left border
 * - icons: 15px SVG stroke-width 1.5
 * - badge count สำหรับ pending deposits/withdrawals
 * - Collapse state persisted to localStorage
 * - Tooltip on hover when collapsed (shows menu label)
 * - Toggle button at bottom: ChevronLeft/ChevronRight
 *
 * menuGroups export ใช้ร่วมกับ CommandPalette + Breadcrumbs
 */

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, Ticket, Clock, CheckCircle, Ban, Zap, DollarSign,
  ArrowDownToLine, ArrowUpFromLine, ArrowDownUp, ClipboardList, Receipt,
  Star, Gift, BarChart3, Link2, UsersRound, Globe, FileText, Palette,
  Settings, CreditCard, Bell, ChevronLeft, ChevronRight,
  type LucideIcon,
} from 'lucide-react'

// =============================================================================
// เมนู items — แบ่ง group, ใช้ Lucide icons
// export เพื่อให้ CommandPalette + Breadcrumbs ใช้ร่วมได้
// =============================================================================
export const menuGroups: { label: string; items: { href: string; label: string; icon: LucideIcon; badge?: 'deposits' | 'withdrawals' }[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/members', label: 'สมาชิก', icon: Users },
    ],
  },
  {
    label: 'หวย',
    items: [
      { href: '/lotteries', label: 'ประเภทหวย', icon: Ticket },
      { href: '/rounds', label: 'รอบหวย', icon: Clock },
      { href: '/results', label: 'กรอกผล', icon: CheckCircle },
      { href: '/bans', label: 'เลขอั้น', icon: Ban },
      { href: '/bans/auto', label: 'อั้นอัตโนมัติ', icon: Zap },
      { href: '/rates', label: 'อัตราจ่าย', icon: DollarSign },
      { href: '/yeekee', label: 'ยี่กี', icon: Zap },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/deposits', label: 'รายการฝาก', icon: ArrowDownToLine, badge: 'deposits' },
      { href: '/withdrawals', label: 'รายการถอน', icon: ArrowUpFromLine, badge: 'withdrawals' },
      { href: '/bets', label: 'รายการแทง', icon: ClipboardList },
      { href: '/transactions', label: 'ธุรกรรม', icon: Receipt },
    ],
  },
  {
    label: 'สมาชิก',
    items: [
      { href: '/member-levels', label: 'Level สมาชิก', icon: Star },
      { href: '/promotions', label: 'โปรโมชั่น', icon: Gift },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { href: '/reports', label: 'รายงาน', icon: BarChart3 },
      { href: '/affiliate', label: 'Affiliate', icon: Link2 },
      { href: '/staff', label: 'พนักงาน', icon: UsersRound },
      { href: '/cms', label: 'จัดการเว็บ', icon: Globe },
      { href: '/settings/theme', label: 'ตั้งค่าธีมสี', icon: Palette },
      { href: '/activity-log', label: 'Activity Log', icon: FileText },
      { href: '/settings', label: 'ตั้งค่า', icon: Settings },
      { href: '/settings/deposit-withdraw', label: 'ตั้งค่าฝาก/ถอน', icon: ArrowDownUp },
      { href: '/settings/bank-accounts', label: 'บัญชีฝาก/ถอน', icon: CreditCard },
      { href: '/contact-channels', label: 'ช่องทางติดต่อ', icon: Bell },
      { href: '/settings/notifications', label: 'แจ้งเตือน', icon: Bell },
    ],
  },
]

// Flat list ของ menu items ทั้งหมด (ใช้ใน CommandPalette)
export const allMenuItems = menuGroups.flatMap(g => g.items)

// =============================================================================
// localStorage key สำหรับ collapse state
// =============================================================================
const SIDEBAR_COLLAPSED_KEY = 'admin_sidebar_collapsed'

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

  // Collapse state — อ่านจาก localStorage ตอน mount
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved === 'true') setCollapsed(true)
  }, [])

  // Toggle collapse + persist
  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next))
      return next
    })
  }

  // ปิด mobile menu เมื่อเปลี่ยนหน้า
  useEffect(() => { setMobileOpen(false) }, [pathname])

  // Badge counts
  const badges: Record<string, number> = {
    deposits: pendingDeposits,
    withdrawals: pendingWithdrawals,
  }

  const handleLogout = () => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {})
    window.location.href = '/login'
  }

  // Sidebar width ตาม collapse state
  const sidebarWidth = collapsed ? 60 : 220

  // ────────────────────────────────────────────────────────────────────────────
  // Sidebar content (ใช้ทั้ง desktop + mobile)
  // mobile จะ force expanded เสมอ
  // ────────────────────────────────────────────────────────────────────────────
  const renderSidebar = (forceExpanded: boolean = false) => {
    const isCollapsed = forceExpanded ? false : collapsed
    const width = isCollapsed ? 60 : 220

    return (
      <div style={{
        width, height: '100%',
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'width 0.2s ease',
      }}>
        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <div style={{
          padding: isCollapsed ? '16px 0 12px' : '16px 14px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6, flexShrink: 0,
            background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'black', fontSize: 13,
          }}>L</div>
          {!isCollapsed && (
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>
              LOTTO Admin
            </span>
          )}
        </div>

        {/* ── Nav groups ────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: isCollapsed ? '4px 4px' : '4px 8px' }}>
          {menuGroups.map((group, gi) => (
            <div key={group.label} style={{ marginBottom: 16 }}>
              {/* Group label — ซ่อนเมื่อ collapsed */}
              {!isCollapsed && (
                <div style={{
                  padding: '4px 8px 6px', fontSize: 11, fontWeight: 500,
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  color: 'var(--text-tertiary)',
                }}>
                  {group.label}
                </div>
              )}
              {/* Collapsed: separator line แทน group label */}
              {isCollapsed && gi > 0 && (
                <div style={{
                  height: 1, background: 'var(--border)',
                  margin: '4px 8px 8px',
                }} />
              )}

              {/* Items */}
              {group.items.map((item, ii) => {
                const isActive = pathname === item.href
                const badgeKey = (item as { badge?: string }).badge
                const badgeCount = badgeKey ? badges[badgeKey] || 0 : 0

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    style={{
                      display: 'flex', alignItems: 'center',
                      gap: isCollapsed ? 0 : 8,
                      height: 32,
                      padding: isCollapsed ? '0' : '0 8px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: 6, fontSize: 13,
                      textDecoration: 'none',
                      fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                      background: isActive ? 'var(--accent-subtle)' : 'transparent',
                      borderLeft: isCollapsed ? 'none' : (isActive ? '2px solid var(--accent)' : '2px solid transparent'),
                      transition: 'all 0.15s ease',
                      marginBottom: 1,
                      position: 'relative',
                      // stagger animation
                      animation: 'fadeSlideUp 0.2s ease backwards',
                      animationDelay: `${(gi * 4 + ii) * 30}ms`,
                    }}
                  >
                    {/* Icon (Lucide) */}
                    <item.icon size={15} strokeWidth={1.5} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.6 }} />

                    {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}

                    {/* Badge — ซ่อนเมื่อ collapsed, แสดงเป็น dot แทน */}
                    {badgeCount > 0 && !isCollapsed && (
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
                    {/* Collapsed badge dot */}
                    {badgeCount > 0 && isCollapsed && (
                      <span style={{
                        position: 'absolute', top: 4, right: 8,
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--status-error)',
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer: Collapse toggle + Logout ─────────────────────────────── */}
        <div style={{ padding: isCollapsed ? '8px 4px' : '8px 14px', borderTop: '1px solid var(--border)' }}>
          {/* Collapse toggle button */}
          <button
            onClick={toggleCollapse}
            className="btn btn-ghost"
            title={isCollapsed ? 'ขยาย sidebar' : 'ย่อ sidebar'}
            style={{
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 8,
              color: 'var(--text-tertiary)', fontSize: 13,
              marginBottom: 4,
            }}
          >
            {isCollapsed
              ? <ChevronRight size={15} strokeWidth={1.5} />
              : <><ChevronLeft size={15} strokeWidth={1.5} /><span>ย่อเมนู</span></>
            }
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            title={isCollapsed ? 'ออกจากระบบ' : undefined}
            style={{
              width: '100%',
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              gap: 8,
              color: 'var(--text-tertiary)', fontSize: 13,
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
              strokeLinecap="round" strokeLinejoin="round" style={{ width: 15, height: 15, flexShrink: 0 }}>
              <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!isCollapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // Render
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Desktop sidebar (fixed) */}
      <div className="sidebar-desktop" data-collapsed={collapsed} style={{
        display: 'none', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 40,
        width: sidebarWidth,
        transition: 'width 0.2s ease',
      }}>
        {renderSidebar(false)}
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

      {/* Mobile overlay + sidebar (always expanded) */}
      {mobileOpen && (
        <>
          <div onClick={() => setMobileOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.6)' }} />
          <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 60 }}>
            {renderSidebar(true)}
          </div>
        </>
      )}
    </>
  )
}
