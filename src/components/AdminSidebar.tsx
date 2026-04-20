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
  Star, Gift, BarChart3, Link2, UsersRound, Globe, FileText,
  Settings, CreditCard, Bell, ChevronLeft, ChevronRight,
  GitBranch, FileBarChart,
  type LucideIcon,
} from 'lucide-react'
import ThemeToggle from './ThemeToggle'

// =============================================================================
// เมนู items — แบ่ง group, ใช้ Lucide icons
// export เพื่อให้ CommandPalette + Breadcrumbs ใช้ร่วมได้
// =============================================================================
// ⭐ Permission mapping — เมนูไหนต้องมี permission อะไร
// null = ทุกคนเห็น, string = ต้องมี permission นั้น (หรือ wildcard)
type MenuItem = { href: string; label: string; icon: LucideIcon; badge?: 'deposits' | 'withdrawals'; perm?: string | null }

export const menuGroups: { label: string; items: MenuItem[] }[] = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, perm: 'dashboard.view' },
      { href: '/members', label: 'สมาชิก', icon: Users, perm: 'members.view' },
    ],
  },
  {
    label: 'หวย',
    items: [
      { href: '/lotteries', label: 'ประเภทหวย', icon: Ticket, perm: 'lottery.view' },
      { href: '/rounds', label: 'รอบหวย', icon: Clock, perm: 'lottery.view' },
      { href: '/bans', label: 'เลขอั้น', icon: Ban, perm: 'lottery.bans' },
      { href: '/bans/auto', label: 'อั้นอัตโนมัติ', icon: Zap, perm: 'lottery.bans' },
      { href: '/rates', label: 'อัตราจ่าย', icon: DollarSign, perm: 'lottery.rates' },
      { href: '/yeekee', label: 'ยี่กี', icon: Zap, perm: 'lottery.view' },
    ],
  },
  {
    label: 'การเงิน',
    items: [
      { href: '/deposits', label: 'รายการฝาก', icon: ArrowDownToLine, badge: 'deposits', perm: 'finance.deposits' },
      { href: '/withdrawals', label: 'รายการถอน', icon: ArrowUpFromLine, badge: 'withdrawals', perm: 'finance.withdrawals' },
      { href: '/bets', label: 'รายการแทง', icon: ClipboardList, perm: 'finance.bets' },
      { href: '/transactions', label: 'ธุรกรรม', icon: Receipt, perm: 'finance.transactions' },
    ],
  },
  {
    label: 'สมาชิก',
    items: [
      { href: '/member-levels', label: 'Level สมาชิก', icon: Star, perm: 'system.cms' },
      { href: '/promotions', label: 'โปรโมชั่น', icon: Gift, perm: 'system.cms' },
    ],
  },
  {
    label: 'สายงาน',
    items: [
      { href: '/downline', label: 'จัดการสายงาน', icon: GitBranch, perm: 'system.affiliate' },
      { href: '/downline/report', label: 'รายงานเคลีย', icon: FileBarChart, perm: 'system.affiliate' },
    ],
  },
  {
    label: 'ระบบ',
    items: [
      { href: '/reports', label: 'รายงาน', icon: BarChart3, perm: 'reports.view' },
      { href: '/affiliate', label: 'Affiliate', icon: Link2, perm: 'system.affiliate' },
      { href: '/staff', label: 'พนักงาน', icon: UsersRound, perm: 'system.staff' },
      { href: '/cms', label: 'จัดการเว็บ', icon: Globe, perm: 'system.cms' },
      { href: '/activity-log', label: 'Activity Log', icon: FileText, perm: 'system.staff' },
      { href: '/settings/deposit-withdraw', label: 'ตั้งค่าฝาก/ถอน', icon: ArrowDownUp, perm: 'system.settings' },
      { href: '/settings/bank-accounts', label: 'บัญชีฝาก/ถอน', icon: CreditCard, perm: 'system.settings' },
      { href: '/contact-channels', label: 'ช่องทางติดต่อ', icon: Bell, perm: 'system.cms' },
      { href: '/settings/notifications', label: 'แจ้งเตือน', icon: Bell, perm: 'system.settings' },
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
  // ⭐ ตรวจว่าเป็น node user (สายงาน) หรือไม่ — จำกัดเมนูที่เห็น
  const [isNodeUser, setIsNodeUser] = useState(false)
  const [nodeName, setNodeName] = useState('')
  // ⭐ User role + permissions — ซ่อนเมนูที่ไม่มีสิทธิ์
  const [userRole, setUserRole] = useState('owner')
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  useEffect(() => {
    const ut = localStorage.getItem('user_type')
    setIsNodeUser(ut === 'node')
    setNodeName(localStorage.getItem('node_name') || '')
    setUserRole(localStorage.getItem('admin_role') || 'owner')
    try {
      const perms = JSON.parse(localStorage.getItem('admin_permissions') || '[]')
      setUserPermissions(Array.isArray(perms) ? perms : [])
    } catch { setUserPermissions([]) }
  }, [])

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
    // ⭐ ลบ user type flags
    localStorage.removeItem('user_type')
    localStorage.removeItem('node_id')
    localStorage.removeItem('node_role')
    localStorage.removeItem('node_name')
    localStorage.removeItem('share_percent')
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
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'var(--gradient-brand)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: 'var(--text-on-accent)', fontSize: 14,
            boxShadow: 'var(--shadow-glow-accent), var(--shadow-inset-top)',
            letterSpacing: '-0.02em',
          }}>L</div>
          {!isCollapsed && (
            <span style={{
              fontSize: 14.5, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.015em', whiteSpace: 'nowrap',
            }}>
              {isNodeUser ? nodeName || 'สายงาน' : 'LOTTO Admin'}
            </span>
          )}
        </div>

        {/* ── Nav groups ────────────────────────────────────────────────────── */}
        <nav style={{ flex: 1, padding: isCollapsed ? '4px 4px' : '4px 8px' }}>
          {menuGroups.map((group, gi) => {
            // ⭐ Permission-based menu filtering
            // owner/admin → เห็นทุกเมนู
            // operator → เห็นเฉพาะเมนูที่มี permission (รองรับ wildcard เช่น members.*)
            // viewer → เห็นเฉพาะเมนูที่ GET ได้ (ดูอย่างเดียว)
            const canAccess = (perm: string | null | undefined) => {
              if (!perm) return true // null = ทุกคนเห็น
              if (userRole === 'owner' || userRole === 'admin') return true
              // ⭐ node user (สายงาน) = มีเว็บเป็นของตัวเอง → เห็นเมนูทั้งหมด
              // scope ข้อมูลทำที่ backend (NodeScope middleware) แล้ว
              if (isNodeUser) return true
              // operator: เช็ค exact match หรือ wildcard
              return userPermissions.some(p => {
                if (p === perm) return true
                if (p.endsWith('.*')) {
                  const prefix = p.replace('.*', '.')
                  return perm.startsWith(prefix)
                }
                return false
              })
            }
            const filteredItems = group.items.filter(item => canAccess(item.perm))
            if (filteredItems.length === 0) return null

            return (
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
              {filteredItems.map((item, ii) => {
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
                      gap: isCollapsed ? 0 : 10,
                      height: 34,
                      padding: isCollapsed ? '0' : '0 10px',
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      borderRadius: 8, fontSize: 13,
                      textDecoration: 'none',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'var(--accent-text)' : 'var(--text-secondary)',
                      background: isActive
                        ? 'linear-gradient(90deg, var(--accent-subtle), transparent 70%)'
                        : 'transparent',
                      boxShadow: isActive && !isCollapsed ? 'inset 3px 0 0 var(--accent)' : 'none',
                      transition: 'background 0.18s var(--ease-smooth), color 0.15s var(--ease-smooth), transform 0.15s var(--ease-smooth)',
                      marginBottom: 2,
                      position: 'relative',
                      animation: 'fadeSlideUp 0.2s var(--ease-smooth) backwards',
                      animationDelay: `${(gi * 4 + ii) * 30}ms`,
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'var(--bg-hover)'
                        e.currentTarget.style.color = 'var(--text-primary)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--text-secondary)'
                      }
                    }}
                  >
                    {/* Icon (Lucide) */}
                    <item.icon size={16} strokeWidth={1.75} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.75 }} />

                    {!isCollapsed && <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}

                    {/* Badge — gradient red + pulse */}
                    {badgeCount > 0 && !isCollapsed && (
                      <span style={{
                        background: 'var(--gradient-danger)',
                        color: 'white', fontSize: 10, fontWeight: 800,
                        padding: '1px 7px', borderRadius: 999,
                        minWidth: 18, textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums',
                        boxShadow: '0 0 0 2px rgba(239,68,68,0.2), 0 2px 6px rgba(239,68,68,0.35)',
                        letterSpacing: 0,
                      }}>
                        {badgeCount}
                      </span>
                    )}
                    {badgeCount > 0 && isCollapsed && (
                      <span style={{
                        position: 'absolute', top: 4, right: 6,
                        width: 7, height: 7, borderRadius: '50%',
                        background: 'var(--status-error)',
                        boxShadow: '0 0 0 2px rgba(239,68,68,0.35)',
                        animation: 'glowPulse 1.8s ease-in-out infinite',
                      }} />
                    )}
                  </Link>
                )
              })}
            </div>
          );
          })}
        </nav>

        {/* ── Footer: Theme + Collapse + Logout ─────────────────────────── */}
        <div style={{ padding: isCollapsed ? '8px 4px' : '8px 14px', borderTop: '1px solid var(--border)' }}>
          {/* Theme toggle */}
          <div style={{ marginBottom: 4 }}>
            <ThemeToggle compact={isCollapsed} />
          </div>

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
